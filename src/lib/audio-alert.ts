/**
 * Audio Chime Synthesizer for Mogent AI
 * Uses the Web Audio API to synthesize a crisp, uplifting dual-chord cash-register sound
 * Zero external audio files, zero network latency, 100% reliable in all modern browsers.
 */

export function playOrderChime() {
  try {
    if (typeof window === "undefined") return;
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    // Sound sequence: 523.25Hz (C5) -> 659.25Hz (E5) -> 783.99Hz (G5) -> 1046.5Hz (C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const now = ctx.currentTime;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      // Volume envelope (quick attack, smooth decay)
      gain.gain.setValueAtTime(0.001, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.18, now + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.4);
    });
  } catch (err) {
    // Ignore audio autoplay restrictions if user has not interacted with the page yet
    console.debug("Audio chime could not play:", err);
  }
}
