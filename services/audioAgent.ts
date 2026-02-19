
/**
 * Audio Agent
 * Generates procedural UI sounds using the Web Audio API.
 * This avoids the need for external MP3 assets and allows for dynamic sound shaping.
 */

class AudioAgent {
    private ctx: AudioContext | null = null;
    // Updated type to handle multiple nodes for complex textures
    private activeNodes: { 
        sources: AudioScheduledSourceNode[]; 
        gains: GainNode[];
    } | null = null;
    
    private isMuted: boolean = false;

    constructor() {
        // Initialize lazily to respect browser autoplay policies
    }

    private getContext(): AudioContext {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.ctx;
    }

    public setMuted(muted: boolean) {
        this.isMuted = muted;
        if (muted) {
            this.stopProcessing(); // Immediately silence loop if muted
        }
    }

    public async resumeContext() {
        const ctx = this.getContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
    }

    /**
     * SUCCESS: A crisp, ascending "ding" or "chime"
     * Composition: Dual Sine waves, slightly detuned, fast decay.
     */
    public playSuccess() {
        if (this.isMuted) return;
        this.resumeContext();
        const ctx = this.getContext();
        const t = ctx.currentTime;

        // Primary Tone
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, t); // A5
        osc1.frequency.exponentialRampToValueAtTime(1760, t + 0.1); // Slide up to A6
        
        gain1.gain.setValueAtTime(0.1, t);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 1.5); // Long resonant tail

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(t);
        osc1.stop(t + 1.5);

        // Sparkle Tone (Higher harmonic)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1760, t);
        osc2.frequency.linearRampToValueAtTime(2200, t + 0.1);
        
        gain2.gain.setValueAtTime(0.05, t);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(t);
        osc2.stop(t + 0.8);
    }

    /**
     * ERROR: A soft, low-frequency "thud"
     * Composition: Triangle wave, rapid pitch drop, low pass filter.
     */
    public playError() {
        if (this.isMuted) return;
        this.resumeContext();
        const ctx = this.getContext();
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle'; // Softer than square, richer than sine
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.3); // Pitch drop

        // Low pass to remove harshness
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.4);
    }

    /**
     * PROCESSING: "Deep Work" Ambient Texture
     * 1. Pulse: Low freq sine (60Hz) modulated at 60 BPM (1Hz)
     * 2. Grain: High freq FM synthesis for "computer chatter"
     * 3. Noise: Filtered white noise for "data stream" texture
     */
    public startProcessing() {
        if (this.isMuted || this.activeNodes) return;
        this.resumeContext();
        const ctx = this.getContext();
        const t = ctx.currentTime;

        const sources: AudioScheduledSourceNode[] = [];
        const gains: GainNode[] = [];

        // --- LAYER 1: Minimalist Pulse (Heartbeat) ---
        const pulseCarrier = ctx.createOscillator();
        const pulseGain = ctx.createGain();
        const pulseLfo = ctx.createOscillator(); // Modulator for rhythm
        const pulseLfoGain = ctx.createGain();

        pulseCarrier.type = 'sine';
        pulseCarrier.frequency.value = 60; // Deep low end (60Hz)

        pulseLfo.type = 'sine'; 
        pulseLfo.frequency.value = 1; // 1Hz = 60 BPM

        // LFO modulates the gain of the carrier
        pulseGain.gain.value = 0; // Start silent
        pulseLfoGain.gain.value = 0.08; // Pulse intensity (Volume)

        pulseLfo.connect(pulseLfoGain);
        pulseLfoGain.connect(pulseGain.gain);
        
        pulseCarrier.connect(pulseGain);
        pulseGain.connect(ctx.destination);

        pulseCarrier.start(t);
        pulseLfo.start(t);
        sources.push(pulseCarrier, pulseLfo);
        gains.push(pulseGain); // Track for fade out

        // --- LAYER 2: Digital "Grain" (Sci-Fi Chatter) ---
        // FM Synthesis: Carrier modulated by a fast square wave
        const grainCarrier = ctx.createOscillator();
        const grainModulator = ctx.createOscillator();
        const grainModGain = ctx.createGain();
        const grainOutGain = ctx.createGain();
        const grainPanner = ctx.createStereoPanner();

        grainCarrier.type = 'sine';
        grainCarrier.frequency.value = 2500; // High pitch base

        grainModulator.type = 'square';
        grainModulator.frequency.value = 15; // Fast "chatter" rate

        grainModGain.gain.value = 1000; // High modulation depth for rich harmonics

        grainOutGain.gain.value = 0.008; // Very subtle volume
        grainPanner.pan.value = 0.4; // Slightly to the right

        // FM Routing: Modulator -> Gain -> Carrier Frequency
        grainModulator.connect(grainModGain);
        grainModGain.connect(grainCarrier.frequency);
        
        grainCarrier.connect(grainOutGain);
        grainOutGain.connect(grainPanner);
        grainPanner.connect(ctx.destination);

        grainCarrier.start(t);
        grainModulator.start(t);
        sources.push(grainCarrier, grainModulator);
        gains.push(grainOutGain);

        // --- LAYER 3: Data Stream (White Noise Texture) ---
        const bufferSize = ctx.sampleRate * 2; // 2 seconds buffer
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 400; // Soft/Brown noise feel

        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.02; // Background hum level

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noiseSource.start(t);
        sources.push(noiseSource);
        gains.push(noiseGain);

        // Store references
        this.activeNodes = { sources, gains };
    }

    public stopProcessing() {
        if (this.activeNodes) {
            const ctx = this.getContext();
            const t = ctx.currentTime;
            const { sources, gains } = this.activeNodes;
            
            // Fade out all gains to avoid clicks
            gains.forEach(gainNode => {
                try {
                    gainNode.gain.cancelScheduledValues(t);
                    gainNode.gain.setTargetAtTime(0, t, 0.2); // 200ms fade out
                } catch(e) {}
            });
            
            // Stop sources after fade
            setTimeout(() => {
                sources.forEach(source => {
                    try {
                        source.stop();
                        source.disconnect();
                    } catch (e) { /* ignore if already stopped */ }
                });
            }, 300);

            this.activeNodes = null;
        }
    }
}

export const audioAgent = new AudioAgent();
