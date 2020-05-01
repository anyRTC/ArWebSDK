# ArRTCWebSDK

*[English](README.md) | 简体中文*

anyrtc Web SDK 是基于 anyrtc Web SDK 开发的下一代 SDK。能实现基于 anyrtc SD-RTN 的音视频实时通信功能，支持语音通话、视频通话、音频互动直播、视频互动直播等场景。anyrtc Web SDK 是一个全量重构的版本，主要针对 API 的易用性和内部架构做了较大的调整。

```shell
npm install ar-rtc-sdk--save
```

接入指南和使用文档请访问我们的文档站 https://anyrtc.github.io/ArRTCWebSDK/zh-CN/

接入过程中，你可以在本仓库参考 anyrtc Web SDK NG 的 [Demo 源码](./Demo)，或者体验 [Demo](https://github.com/anyRTC/ArRTCWebSDK/demo/)

> 如果您在接入 anyrtc Web SDK NG 时遇到问题，或者有任何建议，都可以在本仓库的 Issues 区发帖讨论，我们会尽快处理大家的反馈

## 简介

详细的介绍和文档请访问上面提到的文档站链接，这里我们简单介绍一下 anyrtc Web SDK 的特性

- 支持 Typescript
- 使用 Promise
- 基于 Track 的音视频管理

下面是加入会议并自动发布的代码示例

```js
import ArRTC from "ar-rtc-sdk"

const client = ArRTC.createClient()

async function startCall() {
  await client.join("APPID", "CHANNEL", "TOKEN");
  const audioTrack = await ArRTC.createMicrophoneAudioTrack();
  const videoTrack = await ArRTC.createCameraVideoTrack();

  await client.publish([audioTrack, videoTrack]);
}

startCall().then(/** ... **/).catch(console.error);
```
