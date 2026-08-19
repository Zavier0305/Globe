// 外部音声ファイルに頼らず、Web Audio APIで短い効果音を都度合成する。
// 自動再生ポリシーやAudioContext未対応環境でも例外にならないようtry/catchで無害化する。
let ctx = null

function getContext() {
  if (typeof window === 'undefined') return null
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  if (!ctx) ctx = new AudioContextClass()
  return ctx
}

function tone(freq, startTime, duration, gainValue = 0.15) {
  const audioCtx = getContext()
  if (!audioCtx) return
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

export function playPostSuccessSound() {
  try {
    const audioCtx = getContext()
    if (!audioCtx) return
    const t = audioCtx.currentTime
    tone(523.25, t, 0.18) // C5
    tone(783.99, t + 0.1, 0.22) // G5
  } catch {
    // 無視(効果音は演出のため必須ではない)
  }
}

export function playNewPinSound() {
  try {
    const audioCtx = getContext()
    if (!audioCtx) return
    tone(880, audioCtx.currentTime, 0.15, 0.1) // A5
  } catch {
    // 無視
  }
}
