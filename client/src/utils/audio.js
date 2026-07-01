// Sound Player using Web Audio API buffer decoding for zero-latency, reliable playback

let audioCtx = null;
const audioBuffers = {};

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Web Audio API Synthesizer Fallbacks
const playSyntheticMove = () => {
  try {
    console.log("🎵 playSyntheticMove fallback triggered");
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(400, now + 0.05);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  } catch (e) {
    console.error('Synthetic move audio error:', e);
  }
};

const playSyntheticCapture = () => {
  try {
    console.log("🎵 playSyntheticCapture fallback triggered");
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.linearRampToValueAtTime(200, now + 0.15);
    gain.gain.setValueAtTime(0.85, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch (e) {
    console.error('Synthetic capture audio error:', e);
  }
};

const playSyntheticSpell = (spellId) => {
  try {
    console.log("🎵 playSyntheticSpell fallback triggered");
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    if (spellId === 'freeze') {
      const freqs = [987.77, 880, 783.99, 587.33];
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.4, now + index * 0.08 + 0.01);
        gain.gain.linearRampToValueAtTime(0.001, now + index * 0.08 + 0.18);
        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.18);
      });
    } else if (spellId === 'double_move') {
      [0, 0.12].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now + delay);
        osc.frequency.linearRampToValueAtTime(800, now + delay + 0.1);
        gain.gain.setValueAtTime(0.4, now + delay);
        gain.gain.linearRampToValueAtTime(0.001, now + delay + 0.1);
        osc.start(now + delay);
        osc.stop(now + delay + 0.1);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(1100, now + 0.25);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    console.error('Synthetic spell audio error:', e);
  }
};

const playSyntheticGameOver = (outcome) => {
  try {
    console.log("🎵 playSyntheticGameOver fallback triggered");
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    if (outcome === 'win') {
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.4, now + index * 0.12 + 0.02);
        gain.gain.linearRampToValueAtTime(0.001, now + index * 0.12 + 0.4);
        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 0.4);
      });
    } else if (outcome === 'lose') {
      const notes = [392.00, 311.13, 261.63, 196.00];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.15);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.4, now + index * 0.15 + 0.02);
        gain.gain.linearRampToValueAtTime(0.001, now + index * 0.15 + 0.5);
        osc.start(now + index * 0.15);
        osc.stop(now + index * 0.15 + 0.5);
      });
    } else {
      const notes = [349.23, 440.00];
      notes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      });
    }
  } catch (e) {
    console.error('Synthetic game over audio error:', e);
  }
};

// Check browser Ogg capability
const canPlayOgg = () => {
  try {
    const audio = document.createElement('audio');
    return !!(audio.canPlayType && audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''));
  } catch (e) {
    return false;
  }
};

// Load and decode file into AudioBuffer (cached)
const loadAndDecodeSound = async (filePath) => {
  if (audioBuffers[filePath]) return audioBuffers[filePath];
  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const ctx = getAudioContext();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    audioBuffers[filePath] = audioBuffer;
    return audioBuffer;
  } catch (e) {
    console.warn(`Failed to decode audio file: ${filePath}`, e);
    return null;
  }
};

// Play sound file using Web Audio buffer source
const playAudioFile = async (baseName, syntheticFallback) => {
  const useOgg = canPlayOgg();
  const ext = useOgg ? 'ogg' : 'mp3';
  const filePath = `/sounds/${baseName}.${ext}`;
  
  console.log(`🎵 WebAudio decoding sound: ${filePath}`);
  
  let buffer = await loadAndDecodeSound(filePath);
  
  if (!buffer && useOgg) {
    const fallbackPath = `/sounds/${baseName}.mp3`;
    console.log(`🎵 Ogg decode failed, trying backup: ${fallbackPath}`);
    buffer = await loadAndDecodeSound(fallbackPath);
  }
  
  if (buffer) {
    try {
      const ctx = getAudioContext();
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      
      source.buffer = buffer;
      source.connect(gain);
      gain.connect(ctx.destination);
      
      // Massive volume boost (up to 25x) to amplify very quiet Lichess standard files for clear laptop speaker output
      let volumeMultiplier = 1.0;
      if (baseName === 'move') {
        volumeMultiplier = 25.0; // 2500% volume amplification
      } else if (baseName === 'capture') {
        volumeMultiplier = 15.0; // 1500% volume amplification
      } else if (baseName === 'win' || baseName === 'lose' || baseName === 'draw') {
        volumeMultiplier = 10.0; // 1000% volume amplification
      }
      
      gain.gain.setValueAtTime(volumeMultiplier, ctx.currentTime);
      source.start(0);
      console.log(`🔊 Playing audio: ${filePath} at volume multiplier ${volumeMultiplier}`);
    } catch (playError) {
      console.warn('Buffer source play failed, falling back to synth:', playError);
      syntheticFallback();
    }
  } else {
    syntheticFallback();
  }
};

// Primary Sound Handlers
export const playMoveSound = () => {
  playAudioFile('move', playSyntheticMove);
};

export const playCaptureSound = () => {
  playAudioFile('capture', playSyntheticCapture);
};

export const playSpellSound = (spellId) => {
  playAudioFile(spellId, () => playSyntheticSpell(spellId));
};

export const playGameOverSound = (outcome) => {
  let fileName = outcome === 'win' ? 'win' : (outcome === 'lose' ? 'lose' : 'draw');
  playAudioFile(fileName, () => playSyntheticGameOver(outcome));
};
