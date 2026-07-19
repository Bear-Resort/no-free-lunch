// Tiny WebAudio synth plus one music bed. All triggers happen on user gestures
// (or after one), so the context resumes cleanly.

let ctx: AudioContext | null = null;
let muted = typeof localStorage !== "undefined" && localStorage.getItem("nfl-muted") === "1";
type MusicMode = "home" | "game";

const MUSIC_SRC = `${import.meta.env.BASE_URL}audio/moon_ending.wav`;
const MUSIC_VOLUME: Record<MusicMode, number> = {
  home: 0.32,
  game: 0.055,
};

let music: HTMLAudioElement | null = null;
let musicMode: MusicMode | null = null;
let musicUnlockQueued = false;

function ac(): AudioContext {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  localStorage.setItem("nfl-muted", m ? "1" : "0");
  if (m) {
    stopAmbient();
    stopAgentChatter();
    stopHeartbeat();
    music?.pause();
  } else if (musicMode) {
    startMusic(musicMode);
  }
}

function ensureMusic(): HTMLAudioElement {
  if (music) return music;
  const el = new Audio(MUSIC_SRC);
  el.loop = true;
  el.preload = "auto";
  el.volume = 0;
  music = el;
  return el;
}

function queueMusicUnlock() {
  if (musicUnlockQueued || typeof window === "undefined") return;
  musicUnlockQueued = true;
  const retry = () => {
    musicUnlockQueued = false;
    window.removeEventListener("pointerdown", retry);
    window.removeEventListener("keydown", retry);
    if (musicMode) void startMusic(musicMode);
  };
  window.addEventListener("pointerdown", retry, { once: true });
  window.addEventListener("keydown", retry, { once: true });
}

export function startMusic(mode: MusicMode) {
  musicMode = mode;
  if (muted) return;
  try {
    const el = ensureMusic();
    el.volume = MUSIC_VOLUME[mode];
    const play = el.play();
    if (play) void play.catch(queueMusicUnlock);
  } catch {
    queueMusicUnlock();
  }
}

export function stopMusic() {
  musicMode = null;
  music?.pause();
}

/* A heartbeat that starts when James says the name, and quickens until
   the door slams. Whose heart? That is the question. */
let heartbeatTimer: number | null = null;

export function startHeartbeat() {
  if (muted || heartbeatTimer !== null) return;
  let interval = 950;
  const thump = () => {
    tone(58, 0.12, "sine", 0.3);
    tone(46, 0.1, "sine", 0.22, 0.16);
    interval = Math.max(500, interval - 26); // the panic rises
    heartbeatTimer = window.setTimeout(thump, interval);
  };
  thump();
}

export function stopHeartbeat() {
  if (heartbeatTimer !== null) {
    clearTimeout(heartbeatTimer);
    heartbeatTimer = null;
  }
}

/* A barely-there forest at night: looped brown noise through a slowly
   breathing lowpass. Starts silent, fades in; the digital ending kills it. */
let ambient: {
  gain: GainNode;
  src: AudioBufferSourceNode;
  lfo: OscillatorNode;
} | null = null;

export function startAmbient() {
  if (muted || ambient) return;
  try {
    const a = ac();
    const dur = 4;
    const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.5;
    }
    const src = a.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = a.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 240;
    const lfo = a.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = a.createGain();
    lfoGain.gain.value = 90;
    lfo.connect(lfoGain).connect(filter.frequency);
    const gain = a.createGain();
    gain.gain.setValueAtTime(0, a.currentTime);
    gain.gain.linearRampToValueAtTime(0.02, a.currentTime + 3);
    src.connect(filter).connect(gain).connect(a.destination);
    src.start();
    lfo.start();
    ambient = { gain, src, lfo };
  } catch {
    /* audio unavailable — the forest stays silent */
  }
}

export function stopAmbient() {
  const nodes = ambient;
  if (!nodes) return;
  ambient = null;
  try {
    const a = ac();
    nodes.gain.gain.linearRampToValueAtTime(0.0001, a.currentTime + 0.8);
    setTimeout(() => {
      try {
        nodes.src.stop();
        nodes.lfo.stop();
      } catch {
        /* already stopped */
      }
    }, 900);
  } catch {
    /* audio unavailable */
  }
}

let chatterTimer: number | null = null;
let chatterWanted = false;

function scheduleChatter() {
  if (!chatterWanted || muted || chatterTimer !== null) return;
  chatterTimer = window.setTimeout(() => {
    chatterTimer = null;
    if (!chatterWanted || muted) return;
    const notes = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < notes; i++) {
      const freq = 620 + Math.random() * 920;
      const delay = i * (0.045 + Math.random() * 0.06);
      const slideTo = freq * (0.7 + Math.random() * 0.8);
      tone(
        freq,
        0.035 + Math.random() * 0.035,
        Math.random() > 0.55 ? "square" : "triangle",
        0.016,
        delay,
        slideTo,
      );
    }
    scheduleChatter();
  }, 2400 + Math.random() * 6500);
}

export function startAgentChatter() {
  chatterWanted = true;
  if (muted) return;
  scheduleChatter();
}

export function stopAgentChatter() {
  chatterWanted = false;
  if (chatterTimer !== null) {
    clearTimeout(chatterTimer);
    chatterTimer = null;
  }
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  peak = 0.12,
  delay = 0,
  slideTo?: number,
) {
  if (muted) return;
  try {
    const a = ac();
    const t0 = a.currentTime + delay;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    /* audio unavailable — stay silent */
  }
}

export const sfx = {
  /** Pickaxe thud — dirt. */
  drill() {
    tone(140, 0.09, "square", 0.07);
    tone(70, 0.14, "sine", 0.14);
  },
  /** Gold strike — bright two-note chime. */
  gold() {
    tone(660, 0.12, "sine", 0.12);
    tone(990, 0.18, "sine", 0.1, 0.07);
    tone(1320, 0.22, "sine", 0.06, 0.14);
  },
  /** Machine engaging. */
  machine() {
    tone(180, 0.16, "triangle", 0.09, 0, 320);
  },
  /** Failed attempt. */
  bad() {
    tone(220, 0.18, "sawtooth", 0.06, 0, 150);
    tone(110, 0.24, "sine", 0.1, 0.05);
  },
  /** Map reveal swell. */
  reveal() {
    tone(392, 0.3, "sine", 0.08, 0, 523);
  },
  /** Victory arpeggio. */
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, "sine", 0.1, i * 0.11));
  },
  /** Dialogue voice blip, Undertale-style — one per typed letter. */
  blip(base = 300) {
    tone(base * (0.92 + Math.random() * 0.2), 0.045, "square", 0.035);
  },
  /** A very human scream, from a very unnatural throat. */
  scream() {
    tone(760, 0.7, "sawtooth", 0.07, 0, 210);
    tone(590, 0.65, "sawtooth", 0.06, 0.05, 170);
    tone(940, 0.5, "square", 0.03, 0.02, 320);
  },
  /** CRT giving up the ghost. */
  powerDown() {
    tone(420, 0.7, "sawtooth", 0.08, 0, 42);
    tone(210, 0.85, "sine", 0.12, 0.05, 30);
  },
  /** The door refuses you — a heavy slam through the floorboards. */
  crash() {
    if (muted) return;
    try {
      const a = ac();
      const t0 = a.currentTime;
      const dur = 0.45;
      const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      }
      const src = a.createBufferSource();
      src.buffer = buf;
      const filter = a.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(500, t0);
      filter.frequency.exponentialRampToValueAtTime(90, t0 + dur);
      const gain = a.createGain();
      gain.gain.setValueAtTime(0.28, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filter).connect(gain).connect(a.destination);
      src.start(t0);
      src.stop(t0 + dur);
    } catch {
      /* audio unavailable — stay silent */
    }
    tone(50, 0.8, "sine", 0.3);
    tone(37, 1.0, "sine", 0.2, 0.04);
  },
  /** Wind through the trees — filtered noise swell. */
  wind() {
    if (muted) return;
    try {
      const a = ac();
      const t0 = a.currentTime;
      const dur = 2.4;
      const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = a.createBufferSource();
      src.buffer = buf;
      const filter = a.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 0.8;
      filter.frequency.setValueAtTime(220, t0);
      filter.frequency.exponentialRampToValueAtTime(850, t0 + dur * 0.45);
      filter.frequency.exponentialRampToValueAtTime(200, t0 + dur);
      const gain = a.createGain();
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.09, t0 + dur * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filter).connect(gain).connect(a.destination);
      src.start(t0);
      src.stop(t0 + dur);
    } catch {
      /* audio unavailable — stay silent */
    }
  },
};
