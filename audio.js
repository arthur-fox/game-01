// Audio management using Web Audio API

const GameAudio = {
    context: null,
    soundEnabled: true,  // Controls ALL audio (music + sound effects)
    musicGain: null,
    musicOscillators: [],
    musicIntervals: [],

    // Initialize audio context (must be called after user interaction)
    init() {
        if (this.context) return;
        this.context = new (window.AudioContext || window.webkitAudioContext)();
    },

    // Play jump sound - short upward pitch sweep
    playJump() {
        if (!this.soundEnabled) return;  // Respect global mute
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
        if (!this.soundEnabled) return;  // Respect global mute
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

    // Play a drum hit (kick or hi-hat style)
    playDrum(isKick) {
        if (!this.context || !this.soundEnabled) return;

        const oscillator = this.context.createOscillator();
        const noiseGain = this.context.createGain();

        oscillator.connect(noiseGain);
        noiseGain.connect(this.musicGain);

        if (isKick) {
            // Kick drum - low frequency punch
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(150, this.context.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.1);
            noiseGain.gain.setValueAtTime(0.4, this.context.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + 0.1);
        } else {
            // Hi-hat style - short noise burst using high frequency
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(800 + Math.random() * 400, this.context.currentTime);
            noiseGain.gain.setValueAtTime(0.08, this.context.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);
            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + 0.05);
        }
    },

    // Start background music - energetic chiptune style
    playMusic() {
        if (!this.context) this.init();
        if (!this.soundEnabled) return;

        this.stopMusic();

        // Create a master gain for music
        this.musicGain = this.context.createGain();
        this.musicGain.gain.setValueAtTime(0.12, this.context.currentTime);
        this.musicGain.connect(this.context.destination);

        // Catchy melody - more varied and energetic
        const melody = [
            392, 440, 494, 523,  // G A B C
            587, 523, 494, 440,  // D C B A
            392, 494, 587, 659,  // G B D E
            587, 494, 440, 392,  // D B A G
            523, 587, 659, 698,  // C D E F
            784, 698, 659, 587,  // G F E D
            523, 659, 784, 880,  // C E G A
            784, 659, 587, 523   // G E D C
        ];

        // Bass line - root notes
        const bass = [
            98, 98, 110, 110,    // G2 G2 A2 A2
            123, 123, 110, 110,  // B2 B2 A2 A2
            98, 98, 147, 147,    // G2 G2 D3 D3
            131, 131, 98, 98,    // C3 C3 G2 G2
            131, 131, 147, 147,  // C3 C3 D3 D3
            165, 165, 147, 147,  // E3 E3 D3 D3
            131, 131, 165, 165,  // C3 C3 E3 E3
            196, 196, 131, 131   // G3 G3 C3 C3
        ];

        let noteIndex = 0;
        const noteDuration = 0.15; // Faster tempo

        const playMelodyNote = () => {
            if (!this.soundEnabled || !this.musicGain) return;

            // Melody voice
            const osc1 = this.context.createOscillator();
            const gain1 = this.context.createGain();
            osc1.connect(gain1);
            gain1.connect(this.musicGain);
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(melody[noteIndex], this.context.currentTime);
            gain1.gain.setValueAtTime(0.35, this.context.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + noteDuration * 0.8);
            osc1.start(this.context.currentTime);
            osc1.stop(this.context.currentTime + noteDuration);
            this.musicOscillators.push(osc1);

            // Harmony - octave below on every other note
            if (noteIndex % 2 === 0) {
                const osc2 = this.context.createOscillator();
                const gain2 = this.context.createGain();
                osc2.connect(gain2);
                gain2.connect(this.musicGain);
                osc2.type = 'triangle';
                osc2.frequency.setValueAtTime(melody[noteIndex] / 2, this.context.currentTime);
                gain2.gain.setValueAtTime(0.2, this.context.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + noteDuration * 0.6);
                osc2.start(this.context.currentTime);
                osc2.stop(this.context.currentTime + noteDuration);
                this.musicOscillators.push(osc2);
            }

            noteIndex = (noteIndex + 1) % melody.length;
        };

        let bassIndex = 0;
        const playBassNote = () => {
            if (!this.soundEnabled || !this.musicGain) return;

            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            osc.connect(gain);
            gain.connect(this.musicGain);
            osc.type = 'square';
            osc.frequency.setValueAtTime(bass[bassIndex], this.context.currentTime);
            gain.gain.setValueAtTime(0.25, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + noteDuration * 1.8);
            osc.start(this.context.currentTime);
            osc.stop(this.context.currentTime + noteDuration * 2);
            this.musicOscillators.push(osc);

            bassIndex = (bassIndex + 1) % bass.length;
        };

        let drumBeat = 0;
        const playDrumBeat = () => {
            if (!this.soundEnabled || !this.musicGain) return;

            // Kick on 1 and 3, hi-hat on all beats
            const isKickBeat = drumBeat % 4 === 0 || drumBeat % 4 === 2;
            this.playDrum(isKickBeat);
            if (!isKickBeat) {
                this.playDrum(false); // Hi-hat
            }
            drumBeat++;
        };

        // Start all parts
        playMelodyNote();
        playBassNote();
        playDrumBeat();

        // Melody plays on every beat
        const melodyInterval = setInterval(() => {
            if (this.soundEnabled && this.musicGain) {
                playMelodyNote();
            }
        }, noteDuration * 1000);

        // Bass plays every 2 beats
        const bassInterval = setInterval(() => {
            if (this.soundEnabled && this.musicGain) {
                playBassNote();
            }
        }, noteDuration * 2000);

        // Drums play every beat
        const drumInterval = setInterval(() => {
            if (this.soundEnabled && this.musicGain) {
                playDrumBeat();
            }
        }, noteDuration * 1000);

        this.musicIntervals = [melodyInterval, bassInterval, drumInterval];
    },

    // Stop background music
    stopMusic() {
        // Clear all intervals
        this.musicIntervals.forEach(interval => {
            clearInterval(interval);
        });
        this.musicIntervals = [];

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

    // Toggle all sound on/off
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;

        if (this.soundEnabled) {
            this.playMusic();
        } else {
            this.stopMusic();
        }

        return this.soundEnabled;
    },

    // Check if sound is enabled
    isSoundEnabled() {
        return this.soundEnabled;
    }
};
