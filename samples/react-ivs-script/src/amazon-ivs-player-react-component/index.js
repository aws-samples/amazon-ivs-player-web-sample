import React, { useEffect, useRef, useState } from 'react'
// import * as AmazonIVSPlayer from 'amazon-ivs-player';

const AmazonIVSPlayerComponent = React.forwardRef((props, ref) => {
    const [player, setPlayer] = useState(null);
    const vEl = useRef(null);
    const createPlayer = () => {
        const p = window.IVSPlayer.create({
            wasmWorker: "https://player.live-video.net/1.2.0/amazon-ivs-wasmworker.min.js",
            wasmBinary: "https://player.live-video.net/1.2.0/amazon-ivs-wasmworker.min.wasm",
        });
        setPlayer(p);
    };

    useEffect(() => {
        if (!player) {
            return;
        }
        player.attachHTMLVideoElement(vEl.current);
        return () => {
            player.delete();
            setPlayer(null);
        }
    }, [vEl.current, player]);

    useEffect(() => {
        if (!player) {
            return;
        }
        player.load(props.src);
    }, [props.src, player]);

    useEffect(() => {
        if (!window.IVSPlayer) {
            const s = document.createElement('script');
            s.async = true;
            s.src = "https://player.live-video.net/1.2.0/amazon-ivs-player.min.js"
            document.body.appendChild(s);
            s.onload = createPlayer;
            s.onerror = () => {
                console.error('Amazon IVS Player library not found');
            }
        } else {
            createPlayer();
        }
    }, []); // The [] ensures player is created only once

    return (
        <div>
            <video ref={vEl} {... props}>
            </video>
        </div>
    );
});
export default AmazonIVSPlayerComponent;