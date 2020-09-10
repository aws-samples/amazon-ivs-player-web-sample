import {
    create,
    ErrorType,
    isPlayerSupported,
    MediaPlayer,
    PlayerError,
    PlayerEventType,
    PlayerState,
    Quality,
    TextCue,
    TextMetadataCue,
} from 'amazon-ivs-player';
/**
 * These imports are loaded via the file-loader, and return the path to the asset.
 * We use the TypeScript compiler (TSC) to check types; it doesn't know what this WASM module is, so let's ignore the error it throws (TS2307).
 */
// @ts-ignore
import wasmBinaryPath from 'amazon-ivs-player/dist/assets/amazon-ivs-wasmworker.min.wasm'
import wasmWorkerPath from 'amazon-ivs-player/dist/assets/amazon-ivs-wasmworker.min.js';

class PlayerDemo {
    private player: MediaPlayer;
    private videoElement: HTMLVideoElement = document.querySelector('#video-player');

    constructor(player: MediaPlayer) {
        this.player = player;
        player.attachHTMLVideoElement(this.videoElement);
        this.attachListeners();

        const versionString: HTMLElement =  document.querySelector('.version');
        versionString.innerText = `Amazon IVS Player version ${player.getVersion()}`;
    }

    loadAndPlay(stream: string) {
        const { player } = this;
        /**
         * With setAutoplay, we don't need to call play() here to try and start the stream. One of three things will happen:
         * - Autoplay with sound
         * - Autoplay muted
         * - Playback blocked
         * If autoplay is muted or blocked, the viewer will need to manually interact with the video player in order to unmute or start playback.
         * See https://developers.google.com/web/updates/2017/09/autoplay-policy-changes for more info on autoplaying video and best practices.
         * */
        player.setAutoplay(true);
        player.load(stream);
    }

    destroy() {
        // Event listeners are automatically removed on player destruction
        this.player.delete();
    }

    private attachListeners() {
        const { player } = this;
        for (let state of Object.values(PlayerState)) {
            player.addEventListener(state, () => {
                console.log(state);
            });
        }

        player.addEventListener(PlayerEventType.INITIALIZED, () => {
            console.log('INITIALIZED');
        });

        player.addEventListener(PlayerEventType.ERROR, (error: PlayerError) => {
            const statusTooManyRequests = 429;
            if (error.type === ErrorType.NOT_AVAILABLE && error.code === statusTooManyRequests) {
                console.error('Concurrent-viewer limit reached', error);
            } else {
                console.error('ERROR', error);
            }
        });

        player.addEventListener(PlayerEventType.QUALITY_CHANGED, (quality: Quality) => {
            console.log('QUALITY_CHANGED', quality);
        });

        // This event fires when text cues are encountered, such as captions or subtitles
        player.addEventListener(PlayerEventType.TEXT_CUE, (cue: TextCue) => {
            console.log('TEXT_CUE', cue.startTime, cue.text);
        });

        // This event fires when embedded Timed Metadata is encountered
        player.addEventListener(PlayerEventType.TEXT_METADATA_CUE, (cue: TextMetadataCue) => {
            console.log('Timed metadata', cue.text);
        });
    }
}

// This is the "quiz" stream, which contains Timed Metadata. See the README for more sample streams.
const defaultStream = 'https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.xhP3ExfcX8ON.m3u8';
const inputEl: HTMLInputElement = document.querySelector('.src-input');
let demo: PlayerDemo;

setup();

function setup() {
    /**
     * The IVS player can only be used in browsers which support WebAssembly.
     * You should use `isPlayerSupported` before calling `create`.
     * Otherwise, wrap `create` in a `try/catch` block, because an error will be thrown in browsers without WebAssembly support.
     */
    if (isPlayerSupported) {
        setupForm();
        setupPlayer();
    } else {
        console.error('IVS Player is not supported in this browser');
    }
}

function setupPlayer() {
    const createAbsolutePath = (assetPath: string) => new URL(assetPath, document.URL).toString();
    const player = create({
        wasmWorker: createAbsolutePath(wasmWorkerPath),
        wasmBinary: createAbsolutePath(wasmBinaryPath),
    });

    demo = new PlayerDemo(player);
    loadFormStream();

    /**
     * Add the demo and player to the window so that you can play around with them in the console.
     * This is not necessary for production.
     * */
    // @ts-ignore
    window.demo = demo;
    // @ts-ignore
    window.player = demo.player;
}

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
}

function loadFormStream() {
    demo.loadAndPlay(inputEl.value || defaultStream);
}
