import Demuxer from './demuxer';
import Decoder from './decoder';
import WASMModule from './wasm-module';
import SourceAjax from './source/ajax';
import SourceAjaxProgressive from './source/ajax-progressive';
import uitls from './uitls';
import './raf';

export default class Generator {
    constructor(options = {}) {
        this.loop = !!options.loop;
	    this.autoplay = !!options.autoplay;
        this.paused = false;
        this.isRunning = false;
        this.wasmModule = null;
        this.wasmBinary = options.wasmBinary;
        // 初始化 wasm
        if (!options.disableWebAssembly && options.wasmBinary && WASMModule.IsSupported()) {
            const wasmModule = WASMModule.GetModule();
            options.wasmModule = wasmModule;
            this.wasmModule = wasmModule;
        }

        // 用视频资源获取，分片获取 OR 完整下载
        this.source = options.progressive
            ? new SourceAjaxProgressive(options.url, options)
            : new SourceAjax(options.url, options);

        // 适配器桥接下载资源与解码器
        this.demuxer = new Demuxer(options);

        // 解码器
        this.video = options.wasmModule
			? new Decoder.MPEG1VideoWASM(options)
			: new Decoder.MPEG1Video(options);

        // source 中下载的 arrayBuffer 数据会写入到 demuxer 中
        this.source.connect(this.demuxer);
        // demuxer 会做一层预处理提供给 decoder 使用
        this.demuxer.connect(Demuxer.STREAM.VIDEO_1, this.video);
        // video 解码后将 y, cb, cr 数据吐到 renderer 进行渲染
        this.video.connect(options.renderer);
        this.options = options;
    }

    get currentTime() {
        return this.video.currentTime - this.video.startTime;
    }
    set currentTime(time) {
        this.seek(time);
    }

    initWasmModule() {
        return new Promise((resolve, reject) => {
            const { wasmBinary } = this;
            if (this.wasmModule) {
                if (this.wasmModule.ready) {
                    return resolve();
                }

                if (wasmBinary) {
                    const wasm = uitls.Base64ToArrayBuffer(wasmBinary);
                    this.wasmModule.loadFromBuffer(wasm, resolve);
                } else {
                    reject(new Error('WASM_BINARY_INLINED UNDEFINED'));
                }
            }
            else {
                resolve();
            }
        });
    }

    init() {
        return this.initWasmModule().then(() => this.start())
    }

    start() {
        this.source.start().then(() => {
            if (this.autoplay) {
                this.play();
            }
        });
    }

    play() {
        if (this.animationId) {
            return;
        }
    
        this.animationId = requestAnimationFrame(this.update.bind(this));
        this.wantsToPlay = true;
        this.paused = false;
    }

    pause() {
        if (this.paused) {
            return;
        }
    
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
        this.wantsToPlay = false;
        this.isPlaying = false;
        this.paused = true;
    
        if (this.options.onPause) {
            this.options.onPause(this);
        }
    }

    stop() {
        this.pause();
        this.seek(0);
        if (this.video && this.options.decodeFirstFrame !== false) {
            this.video.decode();
        }
    }

    destroy() {
        this.pause();
        this.source.destroy();
        this.video && this.video.destroy();
        this.renderer && this.renderer.destroy();
    }

    seek(time) {
        const startOffset = this.video.startTime;
        this.video.seek(time + startOffset);
        this.startTime = uitls.Now() - time;
    }

    update() {
        this.animationId = requestAnimationFrame(this.update.bind(this));

        if (!this.source.established) {
            if (this.renderer) {
                this.renderer.renderProgress(this.source.progress);
            }
            return;
        }

        if (!this.isPlaying) {
            this.isPlaying = true;
            this.startTime = uitls.Now() - this.currentTime;

            if (this.options.onPlay) {
                this.options.onPlay(this);
            }
        }

        this.updateForStaticFile();
    }

    nextFrame() {
        if (this.source.established && this.video) {
            return this.video.decode();
        }
        return false;
    }

    updateForStaticFile() {
        let notEnoughData = false;
    
        // Video only - sync it to player's wallclock
        const targetTime = (uitls.Now() - this.startTime) + this.video.startTime;
        const lateTime = targetTime - this.video.currentTime;
        const frameTime = 1 / this.video.frameRate;

        if (this.video && lateTime > 0) {
            // If the video is too far behind (>2 frames), simply reset the
            // target time to the next frame instead of trying to catch up.
            if (lateTime > frameTime * 2) {
                this.startTime += lateTime;
            }

            notEnoughData = !this.video.decode();
        }

        const headroom = this.demuxer.currentTime - targetTime;

        // Notify the source of the playhead headroom, so it can decide whether to
        // continue loading further data.
        this.source.resume(headroom);

        // If we failed to decode and the source is complete, it means we reached
        // the end of our data. We may want to loop.
        if (notEnoughData) {
            const { options } = this;
            if (options.loop) {
                this.seek(0);
            }

            // 事件回调
            if (this.source.completed) {
                this.options.onEnd && this.options.onEnd();
            } else {
                this.options.onStalled && this.options.onStalled();
            }
        }
    }
};
