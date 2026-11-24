import type { AppSettings, BodySide } from '../types';

class SoundCoach {
  private audioCtx: AudioContext | null = null;

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

  private playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType = 'sine',
    volume = 0.18,
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

  playTick(settings: AppSettings): void {
    if (settings.audioMode === 'muted' || !settings.countdownBeeps) return;
    this.playTone(660, 0.09, 'sine', 0.14);
  }

  playRepPulse(settings: AppSettings): void {
    if (settings.audioMode === 'muted') return;
    this.playTone(520, 0.06, 'triangle', 0.09);
  }

  playStartWork(settings: AppSettings): void {
    if (settings.audioMode === 'muted') return;
    this.playTone(587.33, 0.12, 'sine', 0.18, 0);
    this.playTone(880, 0.22, 'sine', 0.2, 0.11);
  }

  playSideSwap(settings: AppSettings): void {
    if (settings.audioMode === 'muted') return;
    this.playTone(523.25, 0.12, 'triangle', 0.16, 0);
    this.playTone(659.25, 0.12, 'triangle', 0.16, 0.13);
    this.playTone(523.25, 0.16, 'triangle', 0.14, 0.26);
  }

  playRest(settings: AppSettings): void {
    if (settings.audioMode === 'muted') return;
    this.playTone(659.25, 0.14, 'sine', 0.15, 0);
    this.playTone(493.88, 0.24, 'sine', 0.15, 0.14);
  }

  playComplete(settings: AppSettings): void {
    if (settings.audioMode === 'muted') return;
    this.playTone(523.25, 0.14, 'sine', 0.18, 0);
    this.playTone(659.25, 0.14, 'sine', 0.18, 0.14);
    this.playTone(783.99, 0.16, 'sine', 0.18, 0.28);
    this.playTone(1046.5, 0.36, 'sine', 0.2, 0.42);
  }

  getSwedishVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return [];
    }
    const voices = window.speechSynthesis.getVoices();
    const swedish = voices.filter((v) =>
      v.lang.toLowerCase().startsWith('sv')
    );
    return swedish.length > 0 ? swedish : voices.slice(0, 8);
  }

  speak(text: string, settings: AppSettings): void {
    if (settings.audioMode !== 'voice-and-sound') return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'sv-SE';
      utterance.rate = settings.voiceRate || 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (settings.voiceURI) {
        const chosen = voices.find((v) => v.voiceURI === settings.voiceURI);
        if (chosen) utterance.voice = chosen;
      } else {
        const swedish =
          voices.find((v) => v.lang.toLowerCase() === 'sv-se') ||
          voices.find((v) => v.lang.toLowerCase().startsWith('sv'));
        if (swedish) utterance.voice = swedish;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis failed gracefully
    }
  }

  stopSpeech(): void {
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
