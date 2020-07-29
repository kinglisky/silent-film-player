import Generator from '../generator';

const emit = (method, params) => {
    self.postMessage({ method, params });
};

const METHOS = [
    'onPlay',
    'onPause',
    'onEnded',
    'onVideoDecode',
    'onStalled',
    'onSourceEstablished',
    'onSourceCompleted',
];

const proxyMethods = METHOS.reduce((handlers, method) => {
    handlers[method] = () => emit(method);
    return handlers;
}, {});

const rendererProxy = {
    render(y, cb, cr, isClampedArray) {
        emit('render', { y, cb, cr, isClampedArray });
    },
    resize(width, height) {
        emit('resize', { width, height });
    },
    renderProgress(progress) {
        emit('progress', progress);
    },
    destroy() {}
};

let generator = null;

const PROXY_HANDLERS = {
    init(options) {
        const mixinOptions = Object.assign(options, proxyMethods, {
            renderer: rendererProxy,
        });
        generator = new Generator(mixinOptions);
        generator.init().then(() => emit('onWorkerPlayerInit'));
    },

    play() {
        if (generator) {
            generator.play();
        }
    },

    pause() {
        if (generator) {
            generator.pause();
        }
    },

    stop() {
        if (generator) {
            generator.stop();
        }
    },

    destroy() {
        if (generator) {
            generator.destroy();
        }
    },
};

export default function create() {
    self.addEventListener('message', function (e) {
        const { method, params } = e.data;
        const handler = PROXY_HANDLERS[method];
        if (handler) {
            handler(params);
        }
    }, false);
}
