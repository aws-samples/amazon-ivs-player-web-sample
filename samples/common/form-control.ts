const inputEl: HTMLInputElement = document.querySelector('.src-input');
inputEl.value = 'https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.xhP3ExfcX8ON.m3u8';

export function setupForm(playCallback: (string) => void) {
    // Set the stream to load using the `playbackUrl=` query param
    const params = new URLSearchParams(window.location.search);
    const streamParam = params.get('playbackUrl');
    if (streamParam) {
        inputEl.value = streamParam;
    }

    const formEl = document.querySelector('.src-container-direct');
    formEl.addEventListener('submit', (event) => {
        event.preventDefault();
        playCallback(inputEl.value);
    })
}

export function getFormStream(): string | undefined {
    return inputEl.value;
}