import Player from './src/index';
import wasmBinary from './src/wasm-binary';
import videoData from './video-data';

window.addEventListener('load',async () => {
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

    const player = new Player(videoData.url, {
        canvas,
        wasmBinary,
        loop: true,
        autoplay: true,
        disableWebAssembly: true,
    });

    window.player = player;
}, false);