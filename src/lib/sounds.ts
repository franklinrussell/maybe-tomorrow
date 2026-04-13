// Synthesized whoosh sound via Web Audio API — no asset files needed
export function playWhoosh() {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const duration = 0.45

    // White noise buffer
    const bufferSize = Math.ceil(ctx.sampleRate * duration)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const src = ctx.createBufferSource()
    src.buffer = buffer

    // Bandpass filter sweeping high → low (gives the "whoosh" feel)
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2800, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + duration)
    filter.Q.value = 1.5

    // Quick attack, exponential decay
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    src.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    src.start(ctx.currentTime)
    src.stop(ctx.currentTime + duration)
    src.onended = () => ctx.close()
  } catch {
    // Web Audio unavailable — silent fail
  }
}
