# ArRTCWebSDK

*English | [简体中文](README.cn.md)*

The anyrtc Web SDK is the next-generation SDK of the current anyrtc Web SDK, enabling audio and video real-time communications based on anyrtc SD-RTNTM and implementing scenarios such as voice-only calls, video call, voice-only interactive broadcast, and video interactive broadcast. The anyrtc Web SDK makes full-scale refactoring to the internal architecture of the anyrtc Web SDK and improves usability of APIs.

```shell
npm install ar-rtc-sdk --save
```

[Documentation Website](https://anyrtc.github.io/ArRTCWebSDK)

We provide some basic demos. For the online website, check out [here](https://github.com/anyRTC/ArRTCWebSDK/demo/). For the source code, check out [here](./Demo).


> If you have some problems when using the anyrtc Web SDK NG, or have any suggestions, you can post new issue in this repo and we will reply as soon as possoble.

## Overview

For detailed introduction and documentation, please go to  [Documentation Website](https://anyrtc.github.io/ArRTCWebSDK). Here we briefly introduce the features of the anyrtc Web SDK:

- Support Typescript
- Using ES6 Promise
- Track-based media objects

Here is the sample code to join the channel and publish local media automatically

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
