// Example for bundling with bundle/index.html as a script tag
import videojs from 'video.js';
import {
    VideoJSQualityPlugin,
    VideoJSIVSTech,
    registerIVSQualityPlugin,
    registerIVSTech,
    VideoJSEvents,
} from 'amazon-ivs-player';
import wasmWorkerPath from 'amazon-ivs-player/dist/assets/amazon-ivs-wasmworker.min.js';
// We use the TypeScript compiler (TSC) to check types; it doesn't know what this WASM module is, so let's ignore the error it throws (TS2307).
// @ts-ignore
import wasmBinaryPath from 'amazon-ivs-player/dist/assets/amazon-ivs-wasmworker.min.wasm';
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

const defaultStream = 'https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.DmumNckWFTqz.m3u8';
const inputEl: HTMLInputElement = document.querySelector('.src-input');
function loadFormStream() {
    // load a source
    player.src(inputEl.value || defaultStream);
}

setupForm();

function setupForm() {
    // Set the stream to load using the `playbackUrl=` query param
    const params = new URLSearchParams(window.location.search);
    const streamParam = params.get('playbackUrl');
    if (streamParam) {
        inputEl.value = streamParam;
    }

    const formEl = document.querySelector('.src-container-direct');
    formEl.addEventListener('submit', (event) => {
        event.preventDefault();
        loadFormStream();
    })
    loadFormStream();
}
