export default class WorkerPlayer {
    constructor(options = {}) {
        this.worker = options.worker;
        this.renderer = options.renderer;
        this.onPlay = options.onPlay;
        this.onPause = options.onPause;
        this.onEnded = options.onEnded;
        this.onVideoDecode = options.onVideoDecode;
        this.onStalled = options.onStalled;
        this.onSourceEstablished = options.onSourceEstablished;
        this.onSourceCompleted = options.onSourceCompleted;
        this.onWorkerPlayerInit = options.onWorkerPlayerInit;
    
        delete options.worker;
        delete options.renderer;
        delete options.onPlay;
        delete options.onPause;
        delete options.onEnded;
        delete options.onVideoDecode;
        delete options.onStalled;
        delete options.onSourceEstablished;
        delete options.onSourceCompleted;
        delete options.onWorkerPlayerInit;

        this.options = options;
        this.init();
    }

    emit(method, params) {
        this.worker.postMessage({
            method,
            params,
        });
    }

    init() {
        const scope = this;
        this.worker.onmessage = (e) => {
            const {
                method,
                params,
            } = e.data;
            const hanlder = this[method];
            if (hanlder) {
                hanlder.bind(scope)(params);
            }
        }
        this.emit('init', this.options);
    }

    play() {
        this.emit('play');
    }

    pause() {
        this.emit('pause');
    }

    stop() {
        this.emit('stop');
    }

    destroy() {
        this.worker.terminate();
        this.renderer && this.renderer.destroy();
        this.emit('destroy');
    }

    render({ y, cb, cr, isClampedArray }) {
        requestAnimationFrame(() => {
            this.renderer.render(y, cb, cr, isClampedArray);
        });
    }

    resize({ width, height }) {
        this.renderer.resize(width, height);
    }
}
