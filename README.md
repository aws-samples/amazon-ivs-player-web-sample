
<a href="https://docs.aws.amazon.com/ivs/"><img align="right" width="128px" src="./ivs-logo.svg"></a>

# Amazon IVS Player Web SDK Samples
[![Edit amazon-ivs-player-web-sample](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/aws-samples/amazon-ivs-player-web-sample/tree/master/?fontsize=14&hidenavigation=1&theme=dark&view=preview)

This project contains code samples demonstrating how to build, package, and integrate with the Amazon IVS Player Web SDK. You can find the Web SDK API reference and documentation [here](https://docs.aws.amazon.com/ivs/).

## Requirements
- Node 12+
- NPM 6+
- A browser which meets the IVS web player requirements

## How to Import the SDK from NPM
The Amazon IVS Web SDK on NPM is built using Webpack using the [commonjs2](https://github.com/webpack/webpack/issues/1114) library target. We recommend importing with the `import` statement, but any module syntax compatible with `commonjs2` will work.

You need to import two files to use the SDK:

* `amazon-ivs-player/dist/assets/amazon-ivs-wasmworker.min.js`
* `amazon-ivs-player/dist/assets/amazon-ivs-wasmworker.min.wasm`

Please see our [sample player](./samples/npm-sdk) for an example on how to import the SDK assets. However, you must also configure your build tool to properly import the SDK WebAssembly files.

### How to import WebAssembly Files
The Amazon IVS Web SDK uses WebAssembly (WASM). The WASM file is included separately from the JavaScript file. There are two important steps you must take to properly import the WASM:
 
* **You must not transpile the WASM file**. If you do, the Player will fail on setup and throw an error.
* It is strongly suggested to [stream the WASM file](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiateStreaming)

Webpack's [file-loader](https://webpack.js.org/loaders/file-loader/) meets both of the above requirements. We have included a sample [Webpack config](webpack.config.js) which demonstrates how to use this to load our SDK.

### You don't need to install from NPM
We also provide the Amazon IVS SDK hosted on our CDN. Cloud-hosted SDKs are easier to get started with, and do not require you to use Webpack or another build tool. There is no difference in performance between either SDK. However, the Cloud SDK does not currently support TypeScript types. Please see the sample directory below for how to use the Cloud SDK.

## Setup
1. [Locally clone](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository) this repository.
2. Install dependencies: `npm install`
3. Build and host using webpack-dev-server: `npm start`
    * Alternatively, you can just build with `npm run bundle`. The `dist/` folder can then be independently hosted.
4. Navigate to the [index page](http://localhost:8080/index.html) and select a demo.
5. Once in the demo, open the developer tools to see relevant logs.

## Code Samples
* [Cloud Player Demo](./samples/cloud-player/cloud-player.ts) - Demonstrates how to instantiate a player using our cloud-hosted assets. Webpack is used here to transpile TypeScript.
* [How to load from NPM](./samples/npm-sdk/npm-sdk.ts) - Demonstrates how to create a player using the NPM package and Webpack.
* [Basic VideoJS Tech demo](./samples/videojs/videojs.ts) - A basic integration with the IVS player VideoJS tech.
* [Pure JavaScript Codepen](https://codepen.io/amazon-ivs/pen/c3b13a2df34b60ada7756f3a2af8d2f0) - A demo player built using pure JavaScript.
* [Webpack build configuration](./webpack.config.js) - Demonstrates how to make player assets available via Webpack.

Please see each sample for detailed code comments.

## Live Demo

Try out this repo in [CodeSandbox](https://githubbox.com/aws-samples/amazon-ivs-player-web-sample). You can build, run, and experiment with our code without having to set it up yourself.

## Test Streams
* 1080p60 https://3d26876b73d7.us-west-2.playback.live-video.net/api/video/v1/us-west-2.913157848533.channel.rkCBS9iD1eyd.m3u8
* 720p - https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.DmumNckWFTqz.m3u8
* Square Video - https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.XFAcAcypUxQm.m3u8
* Vertical Video - https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.YtnrVcQbttF0.m3u8
* Timed Metadata stream - https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.xhP3ExfcX8ON.m3u8
* Closed Captions stream - https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.DmumNckWFTqz.m3u8
* VOD - https://d6hwdeiig07o4.cloudfront.net/ivs/956482054022/cTo5UpKS07do/2020-07-13T22-54-42.188Z/OgRXMLtq8M11/media/hls/master.m3u8
    
## License

This project is licensed under the MIT-0 License. See the LICENSE file.

