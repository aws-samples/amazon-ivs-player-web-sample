import { setupForm, getFormStream } from '../common/form-control';

// IVSPlayer is added to the window when loaded from the script tag (see ../pages/load-from-cdn.html)
// Alternatively, you can import the script via Webpack Externals: https://webpack.js.org/configuration/externals/
// However, this is not shown here.
// IVS types are not available for the cloud-loaded player.
// @ts-ignore
const IVSPackage = window.IVSPlayer;

class PlayerDemo {
    private player: any;
    private videoElement: HTMLVideoElement = document.querySelector('#video-player');

    constructor(stream: string) {
        if (!IVSPackage.isPlayerSupported) {
            throw new Error('IVS Player is not supported in this browser');
        }

        const player = this.player = IVSPackage.create();
        player.attachHTMLVideoElement(this.videoElement);
        this.attachListeners();

        const versionString: HTMLElement = document.querySelector('.version');
        versionString.innerText = `Amazon IVS Player version ${player.getVersion()}`;

        this.loadAndPlay(stream)
    }

    loadAndPlay(stream: string) {
        const { player } = this;
        player.setAutoplay(true);
        player.load(stream);
    }

    private attachListeners() {
        const { player } = this;
         // Unlike the NPM build, enums are pulled off of the IVS player package itself.

        const { ErrorType, PlayerEventType, PlayerState } = IVSPackage;

        for (let state of Object.values(PlayerState)) {
            player.addEventListener(state, () => {
                console.log(state);
            });
        }

        player.addEventListener(PlayerEventType.INITIALIZED, () => {
            console.log('INITIALIZED');
        });

        player.addEventListener(PlayerEventType.ERROR, (error) => {
            const statusTooManyRequests = 429;
            if (error.type === ErrorType.NOT_AVAILABLE && error.code === statusTooManyRequests) {
                console.error('Concurrent-viewer limit reached', error);
            } else {
                console.error('ERROR', error);
            }
        });

        player.addEventListener(PlayerEventType.QUALITY_CHANGED, (quality) => {
            console.log('QUALITY_CHANGED', quality);
        });

        // This event fires when text cues are encountered, such as captions or subtitles
        player.addEventListener(PlayerEventType.TEXT_CUE, (cue) => {
            console.log('TEXT_CUE', cue.startTime, cue.text);
        });

        // This event fires when embedded Timed Metadata is encountered
        player.addEventListener(PlayerEventType.TEXT_METADATA_CUE, (cue) => {
            console.log('Timed metadata', cue.text);
        });
    }
}

const demo = new PlayerDemo(getFormStream());
setupForm(demo.loadAndPlay);

