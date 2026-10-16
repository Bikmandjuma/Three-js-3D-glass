/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeatherType } from '../types/terrarium';

class ProceduralTerrariumAudio {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private rainGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private cricketGain: GainNode | null = null;
  private rainNode: AudioNode | null = null;
  private cricketInterval: number | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.setupSoundscape();
    } catch {
      // AudioContext unavailable or blocked
    }
  }

  private setupSoundscape() {
    if (!this.ctx) return;

    // Master gains
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.0;
    this.rainGain.connect(this.ctx.destination);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.0;
    this.ambientGain.connect(this.ctx.destination);

    this.cricketGain = this.ctx.createGain();
    this.cricketGain.gain.value = 0.0;
    this.cricketGain.connect(this.ctx.destination);

    // Rain White Noise Generator
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Bandpass filter to simulate rain drops hitting glass & foliage
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 850;

    whiteNoise.connect(filter);
    filter.connect(this.rainGain);
    whiteNoise.start();
    this.rainNode = whiteNoise;

    // Cricket chirp loops
    this.cricketInterval = window.setInterval(() => {
      if (this.isMuted || !this.cricketGain || !this.ctx || this.cricketGain.gain.value <= 0.01) return;
      this.chirp();
    }, 2800);
  }

  private chirp() {
    if (!this.ctx || !this.cricketGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const chirpGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(4600, now);
    osc.frequency.exponentialRampToValueAtTime(5200, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(4800, now + 0.12);

    chirpGain.gain.setValueAtTime(0, now);
    chirpGain.gain.linearRampToValueAtTime(0.08, now + 0.03);
    chirpGain.gain.linearRampToValueAtTime(0, now + 0.14);

    osc.connect(chirpGain);
    chirpGain.connect(this.cricketGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playSpritzSound() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    // Burst of misty high-passed noise
    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2200;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  public setWeatherAndDay(weather: WeatherType, timeOfDay: number) {
    if (!this.ctx || !this.rainGain || !this.ambientGain || !this.cricketGain) return;

    const isNight = timeOfDay < 5.5 || timeOfDay > 20.0;
    const isRaining = weather === 'rain' || weather === 'thunderstorm';

    const targetRainVol = this.isMuted ? 0.0 : isRaining ? (weather === 'thunderstorm' ? 0.22 : 0.12) : 0.0;
    const targetCricketVol = this.isMuted ? 0.0 : isNight || weather === 'fireflies' ? 0.15 : 0.0;

    const now = this.ctx.currentTime;
    this.rainGain.gain.setTargetAtTime(targetRainVol, now, 0.4);
    this.cricketGain.gain.setTargetAtTime(targetCricketVol, now, 0.5);
  }

  public toggleMute(): boolean {
    this.resume();
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.rainGain && this.cricketGain) {
      this.rainGain.gain.value = 0.0;
      this.cricketGain.gain.value = 0.0;
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.isMuted && this.rainGain && this.cricketGain) {
      this.rainGain.gain.value = 0.0;
      this.cricketGain.gain.value = 0.0;
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public dispose() {
    if (this.cricketInterval) clearInterval(this.cricketInterval);
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const terrariumAudio = new ProceduralTerrariumAudio();
