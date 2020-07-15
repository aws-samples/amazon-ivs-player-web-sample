
<a href="https://docs.aws.amazon.com/ivs/"><img align="right" width="128px" src="./ivs-logo.svg"></a>

# Amazon IVS Player Web SDK Samples

This project contains code samples demonstrating how to build, package, and integrate with the Amazon IVS Player Web SDK.


## Requirements
- Node 12+
- NPM 6+
- A browser which meets the IVS web player requirements


## Setup
1. [Locally clone](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository) this repository.
2. Install dependencies: `npm install`
3. Start the dev server: `npm start`
4. Navigate to one of the demo links listed below
    * Once in the demo, open the developer tools to see relevant logs.

## Samples

* [Webpack build configuration](./webpack.config.js) - Demonstrates how to make player assets available via Webpack
* [Basic demo](./src/basic.ts) - A basic integration with the IVS player.
    * Available at http://localhost:8080/index.html after starting the dev server.
    * The stream URL can be set on load with the `?playbackUrl=` query parameter.
* [Basic VideoJS Tech demo](./src/videojs-tech.ts) - A basic integration with the IVS player VideoJS tech
    * Available at http://localhost:8080/videojs.html after starting the dev server.

Please see each sample for detailed code comments.


## Test Streams
* 1080p30 - https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.DmumNckWFTqz.m3u8
* Square Video - https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.XFAcAcypUxQm.m3u8
* Vertical Video - https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.YtnrVcQbttF0.m3u8
* Quiz - https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.xhP3ExfcX8ON.m3u8
* VOD - https://d6hwdeiig07o4.cloudfront.net/ivs/956482054022/cTo5UpKS07do/2020-07-13T22-54-42.188Z/OgRXMLtq8M11/media/hls/master.m3u8

## License

This project is licensed under the MIT-0 License. See the LICENSE file.

