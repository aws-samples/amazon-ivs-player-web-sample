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
import { setupForm, getFormStream } from '../common/form-control';

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

    constructor(stream: string) {
        /**
         * The IVS player can only be used in browsers which support WebAssembly.
         * You should use `isPlayerSupported` before calling `create`.
         * Otherwise, wrap `create` in a `try/catch` block, because an error will be thrown in browsers without WebAssembly support.
         */
        if (!isPlayerSupported) {
            throw new Error('IVS Player is not supported in this browser');
        }

        /**
         * Web Workers and WASM Workers need to be created via URL. Webpack has created the relative URL for us via file-loader,
         * now we just have to create the absolute (fully qualified) URL.
         */
        const createAbsolutePath = (assetPath: string) => new URL(assetPath, document.URL).toString();
        const player = this.player = create({
            wasmWorker: createAbsolutePath(wasmWorkerPath),
            wasmBinary: createAbsolutePath(wasmBinaryPath),
        });

        player.attachHTMLVideoElement(this.videoElement);
        this.attachListeners();

        const versionString: HTMLElement = document.querySelector('.version');
        versionString.innerText = `Amazon IVS Player version ${player.getVersion()}`;

        this.loadAndPlay(stream);

        // We're adding the demo here so you can play with it in the console.
        // @ts-ignore
        window.player = player;
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

const demo = new PlayerDemo(getFormStream());
setupForm(demo.loadAndPlay);
