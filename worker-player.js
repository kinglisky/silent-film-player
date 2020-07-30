import Renderer from './src/renderer/web-gl';
import WorkerPlayer from './src/worker/player';
import wasmBinary from './src/wasm-binary';
import videoData from './video-data';

function initCanvas(videoData) {
    const wrapHeight = window.innerHeight;
    const wrapWidth = Math.floor(window.innerHeight / videoData.height * videoData.width);
    const wrap = {
        height: wrapHeight,
        width: wrapWidth,
        top: 0,
        left: -(wrapWidth - window.innerWidth) / 2 | 0,
    };
    const wrapDom = document.querySelector('.canvas-wrap');
    wrapDom.style.width = wrap.width + 'px';
    wrapDom.style.height = wrap.height + 'px';
    wrapDom.style.top = wrap.top + 'px';
    wrapDom.style.left = wrap.left + 'px';

    const canvas = document.querySelector('#video-content');
    canvas.width = wrapWidth;
    canvas.height = wrapHeight;
    return canvas;
}

window.addEventListener('load', async () => {
    const canvas = initCanvas(videoData);
    const worker = new Worker('./worker-proxy.js');
    const renderer = new Renderer({ canvas });
    const player = new WorkerPlayer({
        worker,
        renderer,
        url: videoData.url,
        loop: true,
        autoplay: true,
        progressive: true,
        wasmBinary,
        chunkSize: 1 * 1024 * 1024,
        videoBufferSize: 1 * 1024 * 1024,
        disableWebAssembly: true,
        onSourceEstablished() {
            console.log('onSourceEstablished');
            player.play();
        },
        onWorkerPlayerInit() {
            console.log('onWorkerPlayerInit');
        },
    });
    console.log(player);
    window.player = player;
}, false);