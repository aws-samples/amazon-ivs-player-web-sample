
<a href="https://docs.aws.amazon.com/ivs/"><img align="right" width="128px" src="./ivs-logo.svg"></a>

# Amazon IVS Player Web SDK Samples &middot; [![Run on Repl.it](https://repl.it/badge/github/aws-samples/amazon-ivs-player-web-sample)](https://repl.it/github/aws-samples/amazon-ivs-player-web-sample)

This project contains code samples demonstrating how to build, package, and integrate with the Amazon IVS Player Web SDK. You can find the Web SDK API reference and documentation [here](https://docs.aws.amazon.com/ivs/).

## Requirements
- Node 12+
- NPM 6+
- A browser which meets the IVS web player requirements

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

Try out this repo in [Repl.it](https://repl.it/github/aws-samples/amazon-ivs-player-web-sample). You can build, run, and experiment with our code without having to set it up yourself.

1. Visit https://repl.it/github/aws-samples/amazon-ivs-player-web-sample and sign up for an account
2. Leave the default repl.it configuration (select language: Node.js, configure the run button: `npm start`) and click "Done"
3. Click the "Run" button
4. Wait for `npm install` and `npm start` to complete. You should see `Compiled successfully` in the console when done
5. Reload the page and browse the live samples in the top right window

## Test Streams
* 1080p30 - https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.DmumNckWFTqz.m3u8
* Square Video - https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.XFAcAcypUxQm.m3u8
* Vertical Video - https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.YtnrVcQbttF0.m3u8
* Quiz - https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.xhP3ExfcX8ON.m3u8
* VOD - https://d6hwdeiig07o4.cloudfront.net/ivs/956482054022/cTo5UpKS07do/2020-07-13T22-54-42.188Z/OgRXMLtq8M11/media/hls/master.m3u8
    
## License

This project is licensed under the MIT-0 License. See the LICENSE file.

