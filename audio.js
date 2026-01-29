// Audio management using Web Audio API - Epic Edition

const GameAudio = {
    context: null,
    soundEnabled: true,
    musicGain: null,
    reverbNode: null,
    filterNode: null,
    musicOscillators: [],
    musicIntervals: [],
    padOscillators: [],

    // Initialize audio context
    init() {
        if (this.context) return;
        this.context = new (window.AudioContext || window.webkitAudioContext)();
    },

    // Create reverb impulse response
    createReverbImpulse(duration, decay) {
        const length = this.context.sampleRate * duration;
        const impulse = this.context.createBuffer(2, length, this.context.sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        return impulse;
    },

    // Create a rich pad voice with multiple detuned oscillators
    createPadVoice(freq, duration, startTime) {
        const detuneAmounts = [-8, 0, 8]; // Cents of detune
        const oscillators = [];

        detuneAmounts.forEach(detune => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, startTime);
            osc.detune.setValueAtTime(detune, startTime);

            // Slow ADSR envelope for pad
            const attack = 0.8;
            const decay = 0.3;
            const sustainLevel = 0.4;
            const release = 1.0;

            gain.gain.setValueAtTime(0.001, startTime);
            gain.gain.exponentialRampToValueAtTime(0.08, startTime + attack);
            gain.gain.exponentialRampToValueAtTime(0.08 * sustainLevel, startTime + attack + decay);
            gain.gain.setValueAtTime(0.08 * sustainLevel, startTime + duration - release);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(this.filterNode);

            osc.start(startTime);
            osc.stop(startTime + duration);

            oscillators.push(osc);
            this.padOscillators.push(osc);
        });

        return oscillators;
    },

    // Create a lead melody voice with warmth
    createLeadVoice(freq, duration, startTime, velocity = 1.0) {
        if (!freq) return null; // Rest note

        const osc1 = this.context.createOscillator();
        const osc2 = this.context.createOscillator();
        const gain = this.context.createGain();
        const leadFilter = this.context.createBiquadFilter();

        // Main oscillator
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, startTime);

        // Detuned layer for richness
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq, startTime);
        osc2.detune.setValueAtTime(7, startTime);

        // Filter for warmth
        leadFilter.type = 'lowpass';
        leadFilter.frequency.setValueAtTime(2500, startTime);
        leadFilter.Q.setValueAtTime(2, startTime);

        // ADSR for lead
        const attack = 0.03;
        const decay = 0.1;
        const sustainLevel = 0.7;
        const release = 0.15;
        const peakGain = 0.12 * velocity;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(peakGain, startTime + attack);
        gain.gain.exponentialRampToValueAtTime(peakGain * sustainLevel, startTime + attack + decay);
        if (duration > attack + decay + release) {
            gain.gain.setValueAtTime(peakGain * sustainLevel, startTime + duration - release);
        }
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc1.connect(leadFilter);
        osc2.connect(leadFilter);
        leadFilter.connect(gain);
        gain.connect(this.filterNode);

        osc1.start(startTime);
        osc1.stop(startTime + duration + 0.1);
        osc2.start(startTime);
        osc2.stop(startTime + duration + 0.1);

        this.musicOscillators.push(osc1, osc2);
        return [osc1, osc2];
    },

    // Create bass voice
    createBassVoice(freq, duration, startTime) {
        const osc = this.context.createOscillator();
        const subOsc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, startTime);

        // Sub bass one octave down
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(freq / 2, startTime);

        // Punchy envelope
        const attack = 0.02;
        const release = 0.2;
        const peakGain = 0.15;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(peakGain, startTime + attack);
        gain.gain.setValueAtTime(peakGain * 0.8, startTime + duration * 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        subOsc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);
        subOsc.start(startTime);
        subOsc.stop(startTime + duration + 0.1);

        this.musicOscillators.push(osc, subOsc);
    },

    // Create kick drum
    createKick(startTime) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, startTime);
        osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.1);

        gain.gain.setValueAtTime(0.5, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(startTime);
        osc.stop(startTime + 0.2);

        this.musicOscillators.push(osc);
    },

    // Create hi-hat
    createHiHat(startTime, open = false) {
        const duration = open ? 0.15 : 0.05;

        // Use multiple high-frequency oscillators for noise-like sound
        for (let i = 0; i < 3; i++) {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            const filter = this.context.createBiquadFilter();

            osc.type = 'square';
            osc.frequency.setValueAtTime(4000 + Math.random() * 4000, startTime);

            filter.type = 'highpass';
            filter.frequency.setValueAtTime(7000, startTime);

            gain.gain.setValueAtTime(0.03, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start(startTime);
            osc.stop(startTime + duration + 0.05);

            this.musicOscillators.push(osc);
        }
    },

    // Create snare
    createSnare(startTime) {
        // Tone component
        const osc = this.context.createOscillator();
        const oscGain = this.context.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, startTime);
        osc.frequency.exponentialRampToValueAtTime(120, startTime + 0.05);

        oscGain.gain.setValueAtTime(0.25, startTime);
        oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

        osc.connect(oscGain);
        oscGain.connect(this.musicGain);

        osc.start(startTime);
        osc.stop(startTime + 0.15);

        // Noise component
        for (let i = 0; i < 2; i++) {
            const noise = this.context.createOscillator();
            const noiseGain = this.context.createGain();
            const noiseFilter = this.context.createBiquadFilter();

            noise.type = 'square';
            noise.frequency.setValueAtTime(3000 + Math.random() * 2000, startTime);

            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(3000, startTime);
            noiseFilter.Q.setValueAtTime(1, startTime);

            noiseGain.gain.setValueAtTime(0.1, startTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.musicGain);

            noise.start(startTime);
            noise.stop(startTime + 0.15);

            this.musicOscillators.push(noise);
        }

        this.musicOscillators.push(osc);
    },

    // Play jump sound
    playJump() {
        if (!this.soundEnabled) return;
        if (!this.context) this.init();

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(300, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.context.currentTime + 0.1);

        gain.gain.setValueAtTime(0.15, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.1);
    },

    // Play hit sound
    playHit() {
        if (!this.soundEnabled) return;
        if (!this.context) this.init();

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.3);

        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);

        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.3);
    },

    // Start epic background music
    playMusic() {
        if (!this.context) this.init();
        if (!this.soundEnabled) return;

        this.stopMusic();

        const now = this.context.currentTime;
        const bpm = 128;
        const beatDuration = 60 / bpm;
        const barDuration = beatDuration * 4;

        // Create master gain
        this.musicGain = this.context.createGain();
        this.musicGain.gain.setValueAtTime(0.6, now);

        // Create filter for warmth
        this.filterNode = this.context.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.setValueAtTime(3000, now);
        this.filterNode.Q.setValueAtTime(1, now);

        // Create reverb
        this.reverbNode = this.context.createConvolver();
        this.reverbNode.buffer = this.createReverbImpulse(2, 2);

        // Create dry/wet mix for reverb
        const dryGain = this.context.createGain();
        const wetGain = this.context.createGain();
        dryGain.gain.setValueAtTime(0.7, now);
        wetGain.gain.setValueAtTime(0.3, now);

        // Connect audio graph
        this.filterNode.connect(dryGain);
        this.filterNode.connect(this.reverbNode);
        this.reverbNode.connect(wetGain);
        dryGain.connect(this.musicGain);
        wetGain.connect(this.musicGain);
        this.musicGain.connect(this.context.destination);

        // Extended melody in G major (64 notes)
        const melody = [
            // Intro - building (8 notes)
            null, null, 392, 440,
            494, 523, 587, 523,
            // Main theme A (16 notes)
            392, 494, 587, 659,
            587, 523, 494, 440,
            392, 440, 494, 587,
            659, 784, 659, 587,
            // Theme B - higher energy (16 notes)
            784, 880, 784, 659,
            587, 659, 784, 880,
            988, 880, 784, 659,
            587, 523, 494, 440,
            // Variation C (16 notes)
            392, 587, 494, 659,
            523, 784, 587, 880,
            659, 523, 587, 494,
            440, 392, 494, 392,
            // Resolution (8 notes)
            587, 523, 494, 440,
            392, 494, 587, 392
        ];

        // Bass line (32 notes, plays every 2 melody notes)
        const bassLine = [
            98, 98, 98, 98,     // G2
            110, 110, 131, 131, // A2, C3
            98, 98, 147, 147,   // G2, D3
            165, 165, 131, 131, // E3, C3
            196, 196, 165, 165, // G3, E3
            147, 147, 131, 131, // D3, C3
            98, 98, 110, 110,   // G2, A2
            131, 147, 98, 98    // C3, D3, G2
        ];

        // Pad chord progression (one chord per 8 beats)
        const chords = [
            [196, 247, 294, 392],  // G major
            [220, 262, 330, 440],  // A minor
            [196, 247, 294, 392],  // G major
            [262, 330, 392, 523],  // C major
            [196, 247, 294, 392],  // G major
            [220, 262, 330, 440],  // A minor
            [147, 220, 294, 370],  // D major
            [196, 247, 294, 392],  // G major
        ];

        // Schedule all music
        const loopDuration = melody.length * beatDuration;

        const scheduleLoop = (loopStartTime) => {
            // Schedule pads (one chord every 8 beats)
            chords.forEach((chord, i) => {
                const chordStart = loopStartTime + (i * 8 * beatDuration);
                const chordDuration = 8 * beatDuration;
                chord.forEach(freq => {
                    this.createPadVoice(freq, chordDuration, chordStart);
                });
            });

            // Schedule melody
            melody.forEach((note, i) => {
                const noteStart = loopStartTime + (i * beatDuration);
                const velocity = i >= 16 && i < 32 ? 1.2 : 1.0; // Louder in theme B
                this.createLeadVoice(note, beatDuration * 0.9, noteStart, velocity);
            });

            // Schedule bass (every 2 beats)
            bassLine.forEach((note, i) => {
                const noteStart = loopStartTime + (i * 2 * beatDuration);
                this.createBassVoice(note, beatDuration * 1.8, noteStart);
            });

            // Schedule drums
            for (let beat = 0; beat < melody.length; beat++) {
                const beatStart = loopStartTime + (beat * beatDuration);

                // Kick on 1 and 3
                if (beat % 4 === 0 || beat % 4 === 2) {
                    this.createKick(beatStart);
                }

                // Snare on 2 and 4
                if (beat % 4 === 1 || beat % 4 === 3) {
                    this.createSnare(beatStart);
                }

                // Hi-hat on every beat
                this.createHiHat(beatStart, beat % 2 === 1);

                // Extra hi-hat on off-beats for energy
                if (beat >= 8) { // After intro
                    this.createHiHat(beatStart + beatDuration * 0.5, false);
                }
            }
        };

        // Schedule first loop
        scheduleLoop(now + 0.1);

        // Set up looping
        const loopInterval = setInterval(() => {
            if (!this.soundEnabled || !this.musicGain) {
                clearInterval(loopInterval);
                return;
            }
            // Schedule next loop slightly before current one ends
            scheduleLoop(this.context.currentTime + 0.1);
        }, loopDuration * 1000 - 100);

        this.musicIntervals = [loopInterval];
    },

    // Stop music
    stopMusic() {
        this.musicIntervals.forEach(interval => clearInterval(interval));
        this.musicIntervals = [];

        [...this.musicOscillators, ...this.padOscillators].forEach(osc => {
            try { osc.stop(); } catch (e) { }
        });
        this.musicOscillators = [];
        this.padOscillators = [];

        if (this.musicGain) {
            this.musicGain.disconnect();
            this.musicGain = null;
        }
        if (this.filterNode) {
            this.filterNode.disconnect();
            this.filterNode = null;
        }
        if (this.reverbNode) {
            this.reverbNode.disconnect();
            this.reverbNode = null;
        }
    },

    // Toggle sound
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        if (this.soundEnabled) {
            this.playMusic();
        } else {
            this.stopMusic();
        }
        return this.soundEnabled;
    },

    // Check if sound enabled
    isSoundEnabled() {
        return this.soundEnabled;
    }
};
