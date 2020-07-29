import Demuxer from './demuxer';
import Renderer from './renderer';
import MPEG1Video from './decoder/mpeg1';
import MPEG1VideoWASM from './decoder/mpeg1-wasm';
import WASMModule from './wasm-module';
import Ajax from './source/ajax'
import AjaxProgressive from './source/ajax-progressive'
import uitls from './uitls';

const Player = function(url, options) {
	this.options = options || {};

	if (options.progressive !== false) {
		this.source = new AjaxProgressive(url, options);
	} else {
		this.source = new Ajax(url, options);
	}

	this.loop = options.loop !== false;
	this.autoplay = !!options.autoplay;

	this.demuxer = new Demuxer(options);
	this.source.connect(this.demuxer);

	if (!options.disableWebAssembly && WASMModule.IsSupported() && options.wasmBinary) {
		this.wasmModule = WASMModule.GetModule();
		options.wasmModule = this.wasmModule;
	}

	if (options.video !== false) {
		this.video = options.wasmModule
			? new MPEG1VideoWASM(options)
			: new MPEG1Video(options);

		this.renderer = !options.disableGl && Renderer.WebGL.IsSupported()
			? new Renderer.WebGL(options)
			: new Renderer.Canvas2D(options);
		this.demuxer.connect(Demuxer.STREAM.VIDEO_1, this.video);
		this.video.connect(this.renderer);
	}

	Object.defineProperty(this, 'currentTime', {
		get: this.getCurrentTime,
		set: this.setCurrentTime
	});

	this.paused = true;
	this.unpauseOnShow = false;
	if (options.pauseWhenHidden !== false) {
		document.addEventListener('visibilitychange', this.showHide.bind(this));
	}

	// If we have WebAssembly support, wait until the module is compiled before
	// loading the source. Otherwise the decoders won't know what to do with 
	// the source data.
	if (this.wasmModule) {
		if (this.wasmModule.ready) {
			this.startLoading();
		} else {
			var wasm = uitls.Base64ToArrayBuffer(options.wasmBinary);
			this.wasmModule.loadFromBuffer(wasm, this.startLoading.bind(this));
		}
	}
	else {
		this.startLoading();
	}
};

Player.prototype.startLoading = function() {
	this.source.start();
	if (this.autoplay) {
		this.play();
	}
};

Player.prototype.showHide = function(ev) {
	if (document.visibilityState === 'hidden') {
		this.unpauseOnShow = this.wantsToPlay;
		this.pause();
	}
	else if (this.unpauseOnShow) {
		this.play();
	}
};

Player.prototype.play = function(ev) {
	if (this.animationId) {
		return;
	}

	this.animationId = requestAnimationFrame(this.update.bind(this));
	this.wantsToPlay = true;
	this.paused = false;
};

Player.prototype.pause = function(ev) {
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
};

Player.prototype.stop = function(ev) {
	this.pause();
	this.seek(0);
	if (this.video && this.options.decodeFirstFrame !== false) {
		this.video.decode();
	}
};

Player.prototype.destroy = function() {
	this.pause();
	this.source.destroy();
	this.video && this.video.destroy();
	this.renderer && this.renderer.destroy();
};

Player.prototype.seek = function(time) {
	var startOffset = this.video.startTime;

	if (this.video) {
		this.video.seek(time + startOffset);
	}

	this.startTime = uitls.Now() - time;
};

Player.prototype.getCurrentTime = function() {
	return this.video.currentTime - this.video.startTime;
};

Player.prototype.setCurrentTime = function(time) {
	this.seek(time);
};

Player.prototype.update = function() {
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
};


Player.prototype.nextFrame = function() {
	if (this.source.established && this.video) {
		return this.video.decode();
	}
	return false;
};

Player.prototype.updateForStaticFile = function() {
	var notEnoughData = false,
		headroom = 0;

	if (this.video) {
		// Video only - sync it to player's wallclock
		var targetTime = (uitls.Now() - this.startTime) + this.video.startTime,
			lateTime = targetTime - this.video.currentTime,
			frameTime = 1/this.video.frameRate;

		if (this.video && lateTime > 0) {
			// If the video is too far behind (>2 frames), simply reset the
			// target time to the next frame instead of trying to catch up.
			if (lateTime > frameTime * 2) {
				this.startTime += lateTime;
			}

			notEnoughData = !this.video.decode();
		}

		headroom = this.demuxer.currentTime - targetTime;
	}

	// Notify the source of the playhead headroom, so it can decide whether to
	// continue loading further data.
	this.source.resume(headroom);

	// If we failed to decode and the source is complete, it means we reached
	// the end of our data. We may want to loop.
	if (notEnoughData && this.source.completed) {
		if (this.loop) {
			this.seek(0);
		}
		else {
			this.pause();
			if (this.options.onEnded) {
				this.options.onEnded(this);
			}
		}
	}

	// If there's not enough data and the source is not completed, we have
	// just stalled.
	else if (notEnoughData && this.options.onStalled) {
		this.options.onStalled(this);
	}
};

export default Player;
