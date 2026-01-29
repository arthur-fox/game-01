// Audio management using Web Audio API - High Energy Edition

const GameAudio = {
    context: null,
    soundEnabled: true,
    musicGain: null,
    reverbNode: null,
    filterNode: null,
    musicOscillators: [],
    musicIntervals: [],

    init() {
        if (this.context) return;
        this.context = new (window.AudioContext || window.webkitAudioContext)();
    },

    // Short reverb for punch
    createReverbImpulse(duration, decay) {
        const length = this.context.sampleRate * duration;
        const impulse = this.context.createBuffer(2, length, this.context.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        return impulse;
    },

    // Aggressive lead synth - bright and cutting
    createLead(freq, duration, startTime, velocity = 1.0) {
        if (!freq) return;

        const osc1 = this.context.createOscillator();
        const osc2 = this.context.createOscillator();
        const osc3 = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();

        // Bright sawtooth stack
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, startTime);

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(freq, startTime);
        osc2.detune.setValueAtTime(10, startTime);

        osc3.type = 'square';
        osc3.frequency.setValueAtTime(freq * 2, startTime); // Octave up for brightness

        // Bright filter with resonance
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(4000, startTime);
        filter.Q.setValueAtTime(4, startTime);

        // Punchy envelope
        const peakGain = 0.15 * velocity;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
        gain.gain.setValueAtTime(peakGain * 0.8, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc1.connect(filter);
        osc2.connect(filter);
        osc3.connect(filter);
        filter.connect(gain);
        gain.connect(this.filterNode);

        [osc1, osc2, osc3].forEach(osc => {
            osc.start(startTime);
            osc.stop(startTime + duration + 0.05);
            this.musicOscillators.push(osc);
        });
    },

    // Punchy bass with distortion character
    createBass(freq, duration, startTime) {
        const osc = this.context.createOscillator();
        const subOsc = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, startTime);

        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(freq / 2, startTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, startTime);
        filter.Q.setValueAtTime(8, startTime);

        // Super punchy
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.15, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(filter);
        subOsc.connect(gain);
        filter.connect(gain);
        gain.connect(this.musicGain);

        [osc, subOsc].forEach(o => {
            o.start(startTime);
            o.stop(startTime + duration + 0.05);
            this.musicOscillators.push(o);
        });
    },

    // Hard-hitting kick
    createKick(startTime) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, startTime);
        osc.frequency.exponentialRampToValueAtTime(35, startTime + 0.08);

        gain.gain.setValueAtTime(0.7, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(startTime);
        osc.stop(startTime + 0.15);
        this.musicOscillators.push(osc);

        // Click transient for punch
        const click = this.context.createOscillator();
        const clickGain = this.context.createGain();
        click.type = 'square';
        click.frequency.setValueAtTime(1000, startTime);
        clickGain.gain.setValueAtTime(0.3, startTime);
        clickGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.01);
        click.connect(clickGain);
        clickGain.connect(this.musicGain);
        click.start(startTime);
        click.stop(startTime + 0.02);
        this.musicOscillators.push(click);
    },

    // Aggressive snare
    createSnare(startTime) {
        // Body
        const osc = this.context.createOscillator();
        const oscGain = this.context.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, startTime);
        osc.frequency.exponentialRampToValueAtTime(100, startTime + 0.03);
        oscGain.gain.setValueAtTime(0.4, startTime);
        oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);
        osc.connect(oscGain);
        oscGain.connect(this.musicGain);
        osc.start(startTime);
        osc.stop(startTime + 0.1);
        this.musicOscillators.push(osc);

        // Noise burst
        for (let i = 0; i < 4; i++) {
            const noise = this.context.createOscillator();
            const noiseGain = this.context.createGain();
            const noiseFilter = this.context.createBiquadFilter();

            noise.type = 'sawtooth';
            noise.frequency.setValueAtTime(2000 + Math.random() * 3000, startTime);

            noiseFilter.type = 'highpass';
            noiseFilter.frequency.setValueAtTime(2000, startTime);

            noiseGain.gain.setValueAtTime(0.15, startTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.musicGain);
            noise.start(startTime);
            noise.stop(startTime + 0.12);
            this.musicOscillators.push(noise);
        }
    },

    // Fast hi-hats
    createHiHat(startTime, open = false) {
        const duration = open ? 0.1 : 0.03;

        for (let i = 0; i < 4; i++) {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            const filter = this.context.createBiquadFilter();

            osc.type = 'square';
            osc.frequency.setValueAtTime(6000 + Math.random() * 6000, startTime);

            filter.type = 'highpass';
            filter.frequency.setValueAtTime(8000, startTime);

            gain.gain.setValueAtTime(open ? 0.06 : 0.04, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            osc.start(startTime);
            osc.stop(startTime + duration + 0.02);
            this.musicOscillators.push(osc);
        }
    },

    // Crash cymbal for impact
    createCrash(startTime) {
        for (let i = 0; i < 8; i++) {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(3000 + Math.random() * 5000, startTime);

            gain.gain.setValueAtTime(0.08, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

            osc.connect(gain);
            gain.connect(this.musicGain);
            osc.start(startTime);
            osc.stop(startTime + 0.9);
            this.musicOscillators.push(osc);
        }
    },

    // Arpeggio synth for energy
    createArp(freq, duration, startTime) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, startTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, startTime);
        filter.Q.setValueAtTime(5, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.08, startTime + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.filterNode);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);
        this.musicOscillators.push(osc);
    },

    playJump() {
        if (!this.soundEnabled) return;
        if (!this.context) this.init();

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(400, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.context.currentTime + 0.08);

        gain.gain.setValueAtTime(0.15, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.08);

        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.08);
    },

    playHit() {
        if (!this.soundEnabled) return;
        if (!this.context) this.init();

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.context.currentTime + 0.2);

        gain.gain.setValueAtTime(0.4, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);

        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.2);
    },

    playMusic() {
        if (!this.context) this.init();
        if (!this.soundEnabled) return;

        this.stopMusic();

        const now = this.context.currentTime;
        const bpm = 160; // Fast tempo!
        const beatDuration = 60 / bpm;
        const sixteenth = beatDuration / 4;

        // Master gain
        this.musicGain = this.context.createGain();
        this.musicGain.gain.setValueAtTime(0.5, now);

        // Brighter filter
        this.filterNode = this.context.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.setValueAtTime(5000, now);
        this.filterNode.Q.setValueAtTime(1, now);

        // Short punchy reverb
        this.reverbNode = this.context.createConvolver();
        this.reverbNode.buffer = this.createReverbImpulse(0.8, 3);

        const dryGain = this.context.createGain();
        const wetGain = this.context.createGain();
        dryGain.gain.setValueAtTime(0.85, now);
        wetGain.gain.setValueAtTime(0.15, now);

        this.filterNode.connect(dryGain);
        this.filterNode.connect(this.reverbNode);
        this.reverbNode.connect(wetGain);
        dryGain.connect(this.musicGain);
        wetGain.connect(this.musicGain);
        this.musicGain.connect(this.context.destination);

        // High energy melody in E minor - driving and intense
        const melody = [
            // Phrase 1 - Aggressive start
            659, 659, 784, 659, 587, 659, null, 659,
            784, 784, 880, 784, 659, 784, 659, 587,
            // Phrase 2 - Building
            659, 784, 880, 988, 880, 784, 659, 784,
            880, 988, 1047, 988, 880, 784, 659, 587,
            // Phrase 3 - Peak intensity
            988, 988, 1047, 988, 880, 988, 880, 784,
            880, 880, 988, 880, 784, 659, 784, 880,
            // Phrase 4 - Resolution with power
            659, 784, 880, 784, 659, 587, 659, 784,
            880, 784, 659, 587, 494, 587, 659, 659
        ];

        // Driving bass line - eighth notes for energy
        const bassPattern = [
            82, null, 82, 82, 98, null, 98, 82,
            110, null, 110, 98, 82, null, 82, 98,
            82, null, 82, 82, 98, null, 98, 110,
            123, null, 123, 110, 98, null, 82, 82,
            130, null, 130, 123, 110, null, 110, 98,
            110, null, 110, 98, 82, null, 98, 110,
            82, null, 82, 82, 98, null, 98, 82,
            110, null, 98, 82, 65, null, 82, 82
        ];

        // Fast arpeggio pattern
        const arpNotes = [330, 392, 494, 659, 494, 392, 330, 392];

        const loopDuration = melody.length * beatDuration;

        const scheduleLoop = (loopStartTime) => {
            // Crash at start of each loop
            this.createCrash(loopStartTime);

            // Schedule melody
            melody.forEach((note, i) => {
                const noteStart = loopStartTime + (i * beatDuration);
                const velocity = (i >= 32 && i < 48) ? 1.3 : 1.0;
                this.createLead(note, beatDuration * 0.85, noteStart, velocity);
            });

            // Schedule bass (eighth notes)
            bassPattern.forEach((note, i) => {
                if (note) {
                    const noteStart = loopStartTime + (i * beatDuration / 2);
                    this.createBass(note, beatDuration * 0.4, noteStart);
                }
            });

            // Schedule arpeggios (16th notes)
            for (let bar = 0; bar < 16; bar++) {
                const barStart = loopStartTime + (bar * 4 * beatDuration);
                for (let i = 0; i < 16; i++) {
                    const arpNote = arpNotes[i % 8];
                    // Transpose up in later sections
                    const transpose = bar >= 8 ? 1.5 : 1;
                    this.createArp(arpNote * transpose, sixteenth * 0.8, barStart + (i * sixteenth));
                }
            }

            // Schedule drums
            for (let beat = 0; beat < melody.length; beat++) {
                const beatStart = loopStartTime + (beat * beatDuration);

                // Four-on-the-floor kick
                this.createKick(beatStart);

                // Snare on 2 and 4
                if (beat % 4 === 2) {
                    this.createSnare(beatStart);
                }

                // Hi-hats on every eighth note
                this.createHiHat(beatStart, false);
                this.createHiHat(beatStart + beatDuration / 2, beat % 2 === 0);

                // Extra 16th note hats for intensity in second half
                if (beat >= 32) {
                    this.createHiHat(beatStart + beatDuration / 4, false);
                    this.createHiHat(beatStart + beatDuration * 3 / 4, false);
                }
            }
        };

        scheduleLoop(now + 0.1);

        const loopInterval = setInterval(() => {
            if (!this.soundEnabled || !this.musicGain) {
                clearInterval(loopInterval);
                return;
            }
            scheduleLoop(this.context.currentTime + 0.1);
        }, loopDuration * 1000 - 100);

        this.musicIntervals = [loopInterval];
    },

    stopMusic() {
        this.musicIntervals.forEach(interval => clearInterval(interval));
        this.musicIntervals = [];

        this.musicOscillators.forEach(osc => {
            try { osc.stop(); } catch (e) { }
        });
        this.musicOscillators = [];

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

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        if (this.soundEnabled) {
            this.playMusic();
        } else {
            this.stopMusic();
        }
        return this.soundEnabled;
    },

    isSoundEnabled() {
        return this.soundEnabled;
    }
};
