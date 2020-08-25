# SILENT-FILM-PLAYER

TS 格式的视频播放器，基于 https://github.com/phoboslab/jsmpeg 二次开发，用于支持移动端背景视频播放。

## 开发

- 安装：`npm install`
- 开发：`npm run dev`
- 构建：`npm run lib`

## 定制

使用方法参照： https://github.com/phoboslab/jsmpeg 

silent-film-player jsmpeg 做了一些二次开发，主要如下：

- 拆分模块支持 npm 包
- 移除 audio 相关模块
- 抽离核心的解析模块为 generator
- 新增 Web Workers 调用支持
- 一些 api 变更

api 变更如下：
- 原本的 JSMpeg.WASM_BINARY_INLINED 改成 wasmBinary 选项
- 去除了声音相关的 api
  - audio
  - maxAudioLag
  - audioBufferSize
  - onAudioDecode

具体示例可以查考 [index.js](./index.js) [generator.js](./generator.js) 与 [worker-player.js](./worker-player.js)

jsmpeg 支持 webAssembly 解码，但在移动端效果较差不建议使用，且存在多个 player 实例时解码会有问题。

## 使用

基本使用：
```javascript
import Player from 'silent-film-player';
import wasmBinary from 'silent-film-player/lib/wasm-binary';

const canvas = document.querySelector('.canvas');
const url = 'https://kinglisky.oss-cn-hangzhou.aliyuncs.com/videos/fireworks.ts';
const player = new Player(url, {
    canvas,
    // wasm 文件的 base64 数据 
    wasmBinary,
    loop: true,
    autoplay: true,
    // 是否启用 wasm 解码
    disableWebAssembly: true, 
    chunkSize: 1 * 1024 * 1024,
    videoBufferSize: 512 * 1024,
});
```
Web Workers 使用：
```javascript
// worker-proxy.js
import createWorker from 'silent-film-player/lib/worker/create';
createWorker();
console.log('wroker create');

// worker-player.js
import WorkerPlayer from 'silent-film-player/lib/worker/player';
import Renderer from 'silent-film-player/lib/renderer';

const canvas = document.querySelector('.canvas');
const url = 'https://kinglisky.oss-cn-hangzhou.aliyuncs.com/videos/fireworks.ts';
const worker = new Worker('./worker-proxy.js');

const renderer = new Renderer({ canvas });
const player = new WorkerPlayer({
    worker,
    renderer,
    url,
    loop: true,
    autoplay: true,
    progressive: true,
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
```

Generator 使用：
```javascript
import Generator from 'silent-film-player/lib/generator';
import Renderer from 'silent-film-player/lib/renderer';

const canvas = document.querySelector('.canvas');
const url = 'https://kinglisky.oss-cn-hangzhou.aliyuncs.com/videos/fireworks.ts';

const renderer = new Renderer({ canvas });
const generator = new Generator({
    url,
    renderer,
    loop: true,
    progressive: true,
    disableWebAssembly: true,
});

generator.init().then(() => {
    setInterval(() => {
        generator.update();
    }, 20)
});
```

## 其他

请自行安装 ffmpeg 工具
```
cd videos && sh ffmpeg.sh
```
