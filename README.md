# SILENT-FILM-PLAYER

TS 格式的视频播放器，基于 https://github.com/phoboslab/jsmpeg 二次开发，用户支持背景视频回退

## 开发
- 安装：`npm install`
- 开发：`npm run dev`
- 构建：`npm run lib`

## 使用


## 转格式

请自行安装 ffmpeg 工具
```
cd videos && sh ffmpeg.sh
```

## 定制

silent-film 基于 jsmpeg 做了一些二次开发，主要如下：

- 拆分模块支持 npm 包引用
- 移除 audio 声音模块
- 抽离核心的解析模块 generator
- 新增 Web Workers 调用支持
- 一些 api 变更


api 变更如下：

- 原本的 JSMpeg.WASM_BINARY_INLINED 改成 wasmBinary
- 去除了声音相关的 api
  - audio
  - maxAudioLag
  - audioBufferSize
  - onAudioDecode

具体示例可以查考 index.js generator.js 与 worker-player.js

jsmpeg 支持 webAssembly 解码，但在移动端效果较差不建议使用。