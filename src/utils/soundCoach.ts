import type { AppSettings, BodySide, VoiceCoachId } from '../types';

export type VoiceCue =
  | '3'
  | '2'
  | '1'
  | 'start'
  | 'halfway'
  | 'stop'
  | 'swap'
  | 'done';

const ALL_CUES: VoiceCue[] = [
  '3',
  '2',
  '1',
  'start',
  'halfway',
  'stop',
  'swap',
  'done',
];

const FALLBACK_TEXT: Record<VoiceCue, string> = {
  '3': 'Tre',
  '2': 'Två',
  '1': 'Ett',
  start: 'Kör!',
  halfway: 'Halvvägs',
  stop: 'Stopp',
  swap: 'Byt sida',
  done: 'Klart! Bra jobbat.',
};

class SoundCoach {
  private audioCtx: AudioContext | null = null;
  private bufferCache = new Map<string, AudioBuffer>();
  private loadingPromises = new Map<string, Promise<AudioBuffer | null>>();
  private activeSource: AudioBufferSourceNode | null = null;
  private previewTimers: number[] = [];

  /** Unlock Web Audio on first user interaction (essential for iOS/Android Safari/Chrome) */
  unlock(): void {
    try {
      if (!this.audioCtx) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        void this.audioCtx.resume();
      }
    } catch {
      // AudioContext unavailable
    }
  }

  private getAudioUrl(voice: VoiceCoachId, cue: VoiceCue): string {
    return `./audio/${voice}/${cue}.mp3`;
  }

  private async loadCueBuffer(
    voice: VoiceCoachId,
    cue: VoiceCue
  ): Promise<AudioBuffer | null> {
    const cacheKey = `${voice}:${cue}`;
    const cached = this.bufferCache.get(cacheKey);
    if (cached) return cached;

    const existingPromise = this.loadingPromises.get(cacheKey);
    if (existingPromise) return existingPromise;

    const promise = (async () => {
      try {
        this.unlock();
        if (!this.audioCtx) return null;
        const res = await fetch(this.getAudioUrl(voice, cue));
        if (!res.ok) return null;
        const arrayBuf = await res.arrayBuffer();
        const decoded = await this.audioCtx.decodeAudioData(arrayBuf);
        this.bufferCache.set(cacheKey, decoded);
        return decoded;
      } catch {
        return null;
      } finally {
        this.loadingPromises.delete(cacheKey);
      }
    })();

    this.loadingPromises.set(cacheKey, promise);
    return promise;
  }

  /** Preload all short cues for the selected neural voice so playback has zero latency */
  preloadVoice(voice: VoiceCoachId): void {
    this.unlock();
    ALL_CUES.forEach((cue) => {
      void this.loadCueBuffer(voice, cue);
    });
  }

  private playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType = 'sine',
    volume = 0.14,
    delaySec = 0
  ): void {
    try {
      this.unlock();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime + delaySec;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + durationSec + 0.02);
    } catch {
      // Ignore audio errors
    }
  }

  private speakFallback(cue: VoiceCue): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(FALLBACK_TEXT[cue]);
      utterance.lang = 'sv-SE';
      const voices = window.speechSynthesis.getVoices();
      const swedish = voices.find((v) => v.lang.toLowerCase().startsWith('sv'));
      if (swedish) utterance.voice = swedish;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech fallback error
    }
  }

  /** Plays a pre-recorded natural Swedish neural voice cue */
  playCue(cue: VoiceCue, settings: AppSettings): void {
    if (settings.audioMode !== 'voice-and-sound') return;

    const voice: VoiceCoachId = settings.voiceCoach || 'sofie';
    this.unlock();

    void this.loadCueBuffer(voice, cue).then((buffer) => {
      if (buffer && this.audioCtx) {
        try {
          if (this.activeSource) {
            try {
              this.activeSource.stop();
            } catch {
              // Already stopped
            }
          }
          const source = this.audioCtx.createBufferSource();
          source.buffer = buffer;

          const gain = this.audioCtx.createGain();
          gain.gain.value = 1.05;

          source.connect(gain);
          gain.connect(this.audioCtx.destination);
          source.start(0);
          this.activeSource = source;
          return;
        } catch {
          // Fall through to HTMLAudioElement fallback
        }
      }

      // Fallback to HTMLAudioElement if Web Audio decode wasn't available
      try {
        const audio = new Audio(this.getAudioUrl(voice, cue));
        void audio.play().catch(() => this.speakFallback(cue));
      } catch {
        this.speakFallback(cue);
      }
    });
  }

  /** Plays a short 3-2-1-Kör preview in Settings */
  playVoicePreview(settings: AppSettings): void {
    this.stopAll();
    this.unlock();
    const voice: VoiceCoachId = settings.voiceCoach || 'sofie';
    this.preloadVoice(voice);

    const sequence: { delayMs: number; cue: VoiceCue }[] = [
      { delayMs: 0, cue: '3' },
      { delayMs: 750, cue: '2' },
      { delayMs: 1500, cue: '1' },
      { delayMs: 2250, cue: 'start' },
    ];

    sequence.forEach(({ delayMs, cue }) => {
      const id = window.setTimeout(() => {
        if (cue === 'start') {
          this.playStartWork(settings);
        } else {
          this.playTick(settings);
        }
        this.playCue(cue, settings);
      }, delayMs);
      this.previewTimers.push(id);
    });
  }

  playTick(settings: AppSettings): void {
    if (settings.audioMode === 'muted' || !settings.countdownBeeps) return;
    this.playTone(620, 0.075, 'sine', 0.11);
  }

  playRepPulse(settings: AppSettings): void {
    if (settings.audioMode === 'muted') return;
    this.playTone(500, 0.055, 'triangle', 0.08);
  }

  playStartWork(settings: AppSettings): void {
    if (settings.audioMode === 'muted') return;
    this.playTone(587.33, 0.11, 'sine', 0.14, 0);
    this.playTone(880, 0.2, 'sine', 0.15, 0.1);
  }

  playSideSwap(settings: AppSettings): void {
    if (settings.audioMode === 'muted') return;
    this.playTone(523.25, 0.11, 'triangle', 0.13, 0);
    this.playTone(659.25, 0.15, 'triangle', 0.13, 0.11);
  }

  playRest(settings: AppSettings): void {
    if (settings.audioMode === 'muted') return;
    this.playTone(659.25, 0.13, 'sine', 0.12, 0);
    this.playTone(493.88, 0.22, 'sine', 0.12, 0.13);
  }

  playComplete(settings: AppSettings): void {
    if (settings.audioMode === 'muted') return;
    this.playTone(523.25, 0.13, 'sine', 0.14, 0);
    this.playTone(659.25, 0.13, 'sine', 0.14, 0.13);
    this.playTone(783.99, 0.15, 'sine', 0.14, 0.26);
    this.playTone(1046.5, 0.34, 'sine', 0.16, 0.4);
  }

  stopAll(): void {
    this.previewTimers.forEach((id) => window.clearTimeout(id));
    this.previewTimers = [];
    if (this.activeSource) {
      try {
        this.activeSource.stop();
      } catch {
        // Ignore
      }
      this.activeSource = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const soundCoach = new SoundCoach();

export function formatSideSwedish(side: BodySide): string {
  if (side === 'left') return 'vänster sida';
  if (side === 'right') return 'höger sida';
  return '';
}

/** Keeps the phone screen awake during an active physio workout */
export async function requestScreenWakeLock(): Promise<WakeLockSentinel | null> {
  try {
    if ('wakeLock' in navigator && navigator.wakeLock) {
      return await navigator.wakeLock.request('screen');
    }
  } catch {
    // Wake Lock not supported or denied
  }
  return null;
}
