
import Generator from './src/generator';
import Renderer from './src/renderer/canvas-2d';
import wasmBinary from './src/wasm-binary';
import videoData from './video-data';

window.addEventListener('load', async () => {
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

    const renderer = new Renderer({ canvas });
    const generator = new Generator({
        url: videoData.url,
        renderer,
        wasmBinary,
        loop: true,
        progressive: true,
        disableWebAssembly: true,
    });

    generator.init().then(() => {
        setInterval(() => {
            generator.update();
        }, 20)
    });
    window.generator = generator;
}, false);