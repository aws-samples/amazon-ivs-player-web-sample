/**
 * Multi-Angle IVS Player
 * 10 simultaneous video streams with quality optimization
 */

class MultiAnglePlayer {
    constructor() {
        this.players = [];
        this.streamConfigs = [];
        this.currentMainIndex = 0;
        this.mainVideoElement = document.getElementById('main-video');
        
        // Check IVS Player support
        if (!window.IVSPlayer || !window.IVSPlayer.isPlayerSupported) {
            alert('IVS Player is not supported in this browser');
            return;
        }

        this.init();
    }

    init() {
        console.log('Initializing Multi-Angle Player...');
        console.log('IVS Player version:', window.IVSPlayer.VERSION);

        // Setup event listeners
        this.setupControlButtons();
        this.setupThumbnailClickHandlers();
        this.setupConfigPanel();

        // Try to load stream URLs from config or CloudFormation outputs
        this.loadStreamConfigs();
    }

    loadStreamConfigs() {
        // Try to load from inline config (can be injected from CloudFormation)
        if (window.IVS_STREAM_CONFIGS) {
            this.streamConfigs = window.IVS_STREAM_CONFIGS;
            console.log('Loaded stream configs from window object');
            this.initializePlayers();
        } else {
            console.log('No stream configs found. Please configure manually.');
            this.showConfigPanel();
        }
    }

    initializePlayers() {
        console.log('Initializing players for', this.streamConfigs.length, 'streams');

        this.streamConfigs.forEach((config, index) => {
            const videoElement = document.getElementById(`video-${index}`);
            
            if (!videoElement || !config.url) {
                console.warn(`Skipping stream ${index}: missing element or URL`);
                return;
            }

            try {
                const player = window.IVSPlayer.create();
                player.attachHTMLVideoElement(videoElement);

                // Configure quality settings
                if (index === 0) {
                    // Main stream: auto quality
                    player.setAutoQualityMode(true);
                } else {
                    // Sub streams: lowest quality to save bandwidth
                    player.setAutoQualityMode(false);
                }

                // Setup event listeners
                this.setupPlayerEvents(player, index);

                // Load and play
                player.setAutoplay(true);
                player.setMuted(index !== 0); // Only first stream has audio
                player.load(config.url);

                this.players[index] = player;
                
                console.log(`Player ${index} initialized:`, config.name);
            } catch (error) {
                console.error(`Failed to initialize player ${index}:`, error);
                this.updateStreamStatus(index, 'error');
            }
        });

        // Set first stream as main
        this.switchMainStream(0);
        this.updateStats();
    }

    setupPlayerEvents(player, index) {
        const { PlayerState, PlayerEventType } = window.IVSPlayer;

        // State changes
        player.addEventListener(PlayerState.PLAYING, () => {
            console.log(`Stream ${index}: PLAYING`);
            this.updateStreamStatus(index, 'playing');
            this.updateStats();
        });

        player.addEventListener(PlayerState.BUFFERING, () => {
            console.log(`Stream ${index}: BUFFERING`);
            this.updateStreamStatus(index, 'buffering');
        });

        player.addEventListener(PlayerState.IDLE, () => {
            console.log(`Stream ${index}: IDLE`);
            this.updateStreamStatus(index, 'idle');
        });

        player.addEventListener(PlayerState.ENDED, () => {
            console.log(`Stream ${index}: ENDED`);
            this.updateStreamStatus(index, 'ended');
        });

        // Quality changed
        player.addEventListener(PlayerEventType.QUALITY_CHANGED, (quality) => {
            console.log(`Stream ${index} quality:`, quality);
            if (index === this.currentMainIndex) {
                this.updateMainQuality(quality);
            }
        });

        // Error handling
        player.addEventListener(PlayerEventType.ERROR, (error) => {
            console.error(`Stream ${index} error:`, error);
            this.updateStreamStatus(index, 'error');
            
            // Auto-retry after 5 seconds
            setTimeout(() => {
                console.log(`Retrying stream ${index}...`);
                player.load(this.streamConfigs[index].url);
            }, 5000);
        });

        // Set quality to lowest for sub-streams after loaded
        if (index !== 0) {
            player.addEventListener(PlayerEventType.INITIALIZED, () => {
                const qualities = player.getQualities();
                if (qualities && qualities.length > 0) {
                    const lowestQuality = qualities[qualities.length - 1];
                    player.setQuality(lowestQuality);
                    console.log(`Stream ${index} set to lowest quality:`, lowestQuality.name);
                }
            });
        }
    }

    switchMainStream(index) {
        if (index === this.currentMainIndex) return;

        console.log(`Switching main stream from ${this.currentMainIndex} to ${index}`);

        const oldPlayer = this.players[this.currentMainIndex];
        const newPlayer = this.players[index];

        if (!newPlayer) {
            console.error(`Player ${index} not found`);
            return;
        }

        // Mute old main stream
        if (oldPlayer) {
            oldPlayer.setMuted(true);
            oldPlayer.setAutoQualityMode(false);
            // Set to low quality
            const qualities = oldPlayer.getQualities();
            if (qualities && qualities.length > 0) {
                oldPlayer.setQuality(qualities[qualities.length - 1]);
            }
        }

        // Unmute and optimize new main stream
        newPlayer.setMuted(false);
        newPlayer.setAutoQualityMode(true);

        // Update current index
        this.currentMainIndex = index;

        // Update UI
        this.updateMainStreamUI(index);
        this.updateThumbnailActiveState(index);
        this.updateMainQuality(newPlayer.getQuality());
    }

    updateMainStreamUI(index) {
        const config = this.streamConfigs[index];
        document.getElementById('main-stream-name').textContent = 
            config ? config.name : `Stream ${index + 1}`;
    }

    updateThumbnailActiveState(index) {
        // Remove active class from all thumbnails
        document.querySelectorAll('.thumbnail-wrapper').forEach(wrapper => {
            wrapper.classList.remove('active');
        });

        // Add active class to selected thumbnail
        const activeWrapper = document.querySelector(`.thumbnail-wrapper[data-stream-index="${index}"]`);
        if (activeWrapper) {
            activeWrapper.classList.add('active');
        }
    }

    updateStreamStatus(index, status) {
        const statusElement = document.querySelector(
            `.thumbnail-wrapper[data-stream-index="${index}"] .stream-status`
        );
        
        if (statusElement) {
            statusElement.classList.remove('offline');
            if (status === 'error' || status === 'ended' || status === 'idle') {
                statusElement.classList.add('offline');
            }
        }
    }

    updateMainQuality(quality) {
        const qualityBadge = document.getElementById('main-quality');
        const qualityStat = document.getElementById('main-quality-stat');
        
        if (quality && quality.name) {
            const qualityText = quality.name;
            qualityBadge.textContent = qualityText;
            qualityStat.textContent = qualityText;
        }
    }

    updateStats() {
        const activeStreams = this.players.filter(p => 
            p && p.getState() === window.IVSPlayer.PlayerState.PLAYING
        ).length;

        document.getElementById('active-streams').textContent = 
            `${activeStreams}/${this.streamConfigs.length}`;

        // Update main bitrate
        const mainPlayer = this.players[this.currentMainIndex];
        if (mainPlayer) {
            const quality = mainPlayer.getQuality();
            if (quality && quality.bitrate) {
                document.getElementById('main-bitrate').textContent = 
                    `${Math.round(quality.bitrate / 1000)} kbps`;
            }
        }

        // Buffer health (simplified)
        const bufferHealth = activeStreams === this.streamConfigs.length ? 'Good' : 'Fair';
        document.getElementById('buffer-health').textContent = bufferHealth;
    }

    setupControlButtons() {
        // Play/Pause button
        const playPauseBtn = document.getElementById('play-pause-btn');
        playPauseBtn.addEventListener('click', () => {
            const mainPlayer = this.players[this.currentMainIndex];
            if (!mainPlayer) return;

            if (mainPlayer.isPaused()) {
                mainPlayer.play();
                playPauseBtn.querySelector('.icon').textContent = '⏸️';
            } else {
                mainPlayer.pause();
                playPauseBtn.querySelector('.icon').textContent = '▶️';
            }
        });

        // Mute/Unmute button
        const muteBtn = document.getElementById('mute-unmute-btn');
        muteBtn.addEventListener('click', () => {
            const mainPlayer = this.players[this.currentMainIndex];
            if (!mainPlayer) return;

            if (mainPlayer.isMuted()) {
                mainPlayer.setMuted(false);
                muteBtn.querySelector('.icon').textContent = '🔊';
            } else {
                mainPlayer.setMuted(true);
                muteBtn.querySelector('.icon').textContent = '🔇';
            }
        });

        // Fullscreen button
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        fullscreenBtn.addEventListener('click', () => {
            const mainVideoContainer = document.querySelector('.main-video-container');
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                mainVideoContainer.requestFullscreen();
            }
        });
    }

    setupThumbnailClickHandlers() {
        document.querySelectorAll('.thumbnail-wrapper').forEach((wrapper, index) => {
            wrapper.addEventListener('click', () => {
                this.switchMainStream(index);
            });
        });
    }

    setupConfigPanel() {
        const loadBtn = document.getElementById('load-streams-btn');
        loadBtn.addEventListener('click', () => {
            this.loadStreamsFromForm();
        });
    }

    loadStreamsFromForm() {
        const configs = [];
        
        for (let i = 0; i < 10; i++) {
            const urlInput = document.getElementById(`stream-url-${i}`);
            const url = urlInput.value.trim();
            
            if (url) {
                configs.push({
                    id: `stream-${i}`,
                    name: i === 0 ? 'Main Angle' : `Angle ${i + 1}`,
                    url: url,
                    isMain: i === 0
                });
            }
        }

        if (configs.length === 0) {
            alert('Please enter at least one stream URL');
            return;
        }

        console.log('Loading streams from form:', configs);
        this.streamConfigs = configs;

        // Destroy existing players
        this.players.forEach(player => {
            if (player) player.delete();
        });
        this.players = [];

        // Initialize new players
        this.initializePlayers();
    }

    showConfigPanel() {
        const configPanel = document.querySelector('.config-panel');
        configPanel.scrollIntoView({ behavior: 'smooth' });
    }

    // Cleanup
    destroy() {
        this.players.forEach(player => {
            if (player) player.delete();
        });
        this.players = [];
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.multiAnglePlayer = new MultiAnglePlayer();
    });
} else {
    window.multiAnglePlayer = new MultiAnglePlayer();
}

// Stats update interval
setInterval(() => {
    if (window.multiAnglePlayer) {
        window.multiAnglePlayer.updateStats();
    }
}, 2000);
