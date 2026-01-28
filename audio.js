// Audio management using Web Audio API

const GameAudio = {
    context: null,
    musicEnabled: true,
    musicGain: null,
    musicOscillators: [],
    musicInterval: null,

    // Initialize audio context (must be called after user interaction)
    init() {
        if (this.context) return;
        this.context = new (window.AudioContext || window.webkitAudioContext)();
    },

    // Play jump sound - short upward pitch sweep
    playJump() {
        if (!this.context) this.init();

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(300, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, this.context.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.15, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.1);
    },

    // Play hit sound - low thud/buzz
    playHit() {
        if (!this.context) this.init();

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.3);
    },

    // Start background music - simple looping melody
    playMusic() {
        if (!this.context) this.init();
        if (!this.musicEnabled) return;

        this.stopMusic();

        // Create a master gain for music
        this.musicGain = this.context.createGain();
        this.musicGain.gain.setValueAtTime(0.08, this.context.currentTime);
        this.musicGain.connect(this.context.destination);

        // Simple melody notes (frequencies)
        const melody = [
            262, 294, 330, 294, // C D E D
            262, 294, 330, 392, // C D E G
            330, 294, 262, 294, // E D C D
            330, 392, 440, 392  // E G A G
        ];

        let noteIndex = 0;
        const noteDuration = 0.25; // seconds per note

        const playNote = () => {
            if (!this.musicEnabled || !this.musicGain) return;

            const oscillator = this.context.createOscillator();
            const noteGain = this.context.createGain();

            oscillator.connect(noteGain);
            noteGain.connect(this.musicGain);

            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(melody[noteIndex], this.context.currentTime);

            noteGain.gain.setValueAtTime(0.5, this.context.currentTime);
            noteGain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + noteDuration * 0.9);

            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + noteDuration);

            this.musicOscillators.push(oscillator);

            noteIndex = (noteIndex + 1) % melody.length;
        };

        // Play first note immediately
        playNote();

        // Continue playing notes
        this.musicInterval = setInterval(() => {
            if (this.musicEnabled && this.musicGain) {
                playNote();
            }
        }, noteDuration * 1000);
    },

    // Stop background music
    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }

        // Stop any playing oscillators
        this.musicOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {
                // Already stopped
            }
        });
        this.musicOscillators = [];

        if (this.musicGain) {
            this.musicGain.disconnect();
            this.musicGain = null;
        }
    },

    // Toggle music on/off
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;

        if (this.musicEnabled) {
            this.playMusic();
        } else {
            this.stopMusic();
        }

        return this.musicEnabled;
    },

    // Check if music is enabled
    isMusicEnabled() {
        return this.musicEnabled;
    }
};
