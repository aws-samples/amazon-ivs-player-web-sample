// Example for bundling with bundle/index.html as a script tag
import videojs from 'video.js';
import {
    VideoJSQualityPlugin,
    VideoJSIVSTech,
    registerIVSQualityPlugin,
    registerIVSTech,
    VideoJSEvents,
} from 'amazon-ivs-player';
import { setupForm, getFormStream } from '../common/form-control';

// We use the TypeScript compiler (TSC) to check types; it doesn't know what this WASM module is, so let's ignore the error it throws (TS2307).
// @ts-ignore
import wasmBinaryPath from 'amazon-ivs-player/dist/assets/amazon-ivs-wasmworker.min.wasm';
import wasmWorkerPath from 'amazon-ivs-player/dist/assets/amazon-ivs-wasmworker.min.js';

const createAbsolutePath = (assetPath: string) => new URL(assetPath, document.URL).toString();

// register the tech with videojs
registerIVSTech(videojs, {
    wasmWorker: createAbsolutePath(wasmWorkerPath),
    wasmBinary: createAbsolutePath(wasmBinaryPath),
});

// register the quality plugin
registerIVSQualityPlugin(videojs)

// create the player with the appropriate types. We're using @types/video.js VideoJsPlayer, and intersecting our Player and Quality Plugin interface
const player = videojs('videojs-player', {
    techOrder: ["AmazonIVS"],
    autoplay: true
}, function() {
    console.warn('Player is ready to use')
}) as videojs.Player & VideoJSIVSTech & VideoJSQualityPlugin;

// enable the quality plugin
player.enableIVSQualityPlugin();

// listen to IVS specific events
const events: VideoJSEvents = player.getIVSEvents();
const ivsPlayer = player.getIVSPlayer();
ivsPlayer.addEventListener(events.PlayerState.PLAYING, () => { console.log('IVS Player is playing') });

setupForm(player.src);
player.src(getFormStream());
