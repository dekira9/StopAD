import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { cacheDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const SAMPLE_RATE = 22050;
const MAX_DURATION_SEC = 3;
const MAX_AMPLITUDE = 0.16;
const LP_CUTOFF_HZ = 400;
const FADE_IN_SEC = 0.5;
const SUSTAIN_END_SEC = 1.5;
const CACHE_FILE_NAME = 'shush-exhale-3s-v2.wav';

type PinkNoiseState = {
  b0: number;
  b1: number;
  b2: number;
  b3: number;
  b4: number;
  b5: number;
  b6: number;
};

type LowPassState = {
  y: number;
};

function createPinkNoiseState(): PinkNoiseState {
  return { b0: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0 };
}

function createLowPassState(): LowPassState {
  return { y: 0 };
}

function nextPinkNoiseSample(state: PinkNoiseState): number {
  const white = Math.random() * 2 - 1;
  state.b0 = 0.99886 * state.b0 + white * 0.0555179;
  state.b1 = 0.99332 * state.b1 + white * 0.0750759;
  state.b2 = 0.969 * state.b2 + white * 0.153852;
  state.b3 = 0.8665 * state.b3 + white * 0.3104856;
  state.b4 = 0.55 * state.b4 + white * 0.5329522;
  state.b5 = -0.7616 * state.b5 - white * 0.016898;
  const pink = state.b0 + state.b1 + state.b2 + state.b3 + state.b4 + state.b5 + state.b6 + white * 0.5362;
  state.b6 = white * 0.115926;
  return pink * 0.11;
}

function lowPassSample(input: number, state: LowPassState, cutoffHz: number): number {
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const alpha = (1 / SAMPLE_RATE) / (rc + 1 / SAMPLE_RATE);
  state.y += alpha * (input - state.y);
  return state.y;
}

function smoothstep(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function masterEnvelope(timeSec: number): number {
  if (timeSec < FADE_IN_SEC) {
    return smoothstep(timeSec / FADE_IN_SEC);
  }

  if (timeSec < SUSTAIN_END_SEC) {
    return 1;
  }

  if (timeSec >= MAX_DURATION_SEC) {
    return 0;
  }

  const fadeOutProgress = (timeSec - SUSTAIN_END_SEC) / (MAX_DURATION_SEC - SUSTAIN_END_SEC);
  return (1 + Math.cos(fadeOutProgress * Math.PI)) / 2;
}

export function synthesizeShushSamples(sampleCount: number): Float32Array {
  const samples = new Float32Array(sampleCount);
  const noise = createPinkNoiseState();
  const lowPass = createLowPassState();

  for (let index = 0; index < sampleCount; index += 1) {
    const timeSec = index / SAMPLE_RATE;
    const envelope = masterEnvelope(timeSec);
    const filtered = lowPassSample(nextPinkNoiseSample(noise), lowPass, LP_CUTOFF_HZ);
    samples[index] = filtered * envelope * MAX_AMPLITUDE;
  }

  return samples;
}

function encodeWav(samples: Float32Array): Uint8Array {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(binary);
  }

  throw new Error('Base64 encoding is unavailable');
}

let cachedUri: string | null = null;
let nativePlayer: AudioPlayer | null = null;
let webContext: AudioContext | null = null;
let webSource: AudioBufferSourceNode | null = null;
let audioModeConfigured = false;

async function ensureAudioMode(): Promise<void> {
  if (audioModeConfigured) return;

  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'mixWithOthers',
    shouldPlayInBackground: false,
  });
  audioModeConfigured = true;
}

async function getShushUri(): Promise<string> {
  if (cachedUri) return cachedUri;

  const samples = synthesizeShushSamples(SAMPLE_RATE * MAX_DURATION_SEC);
  const wavBytes = encodeWav(samples);

  if (Platform.OS === 'web') {
    const blob = new Blob([new Uint8Array(wavBytes)], { type: 'audio/wav' });
    cachedUri = URL.createObjectURL(blob);
    return cachedUri;
  }

  const fileUri = `${cacheDirectory}${CACHE_FILE_NAME}`;
  await writeAsStringAsync(fileUri, bytesToBase64(wavBytes), { encoding: 'base64' });
  cachedUri = fileUri;
  return fileUri;
}

function stopWebPlayback(): void {
  if (webSource) {
    try {
      webSource.stop();
    } catch {
      // Source may already be stopped.
    }
    webSource.disconnect();
    webSource = null;
  }

  if (webContext) {
    void webContext.close();
    webContext = null;
  }
}

function stopNativePlayback(): void {
  if (!nativePlayer) return;
  nativePlayer.pause();
  nativePlayer.remove();
  nativePlayer = null;
}

export async function stopShushSound(): Promise<void> {
  stopWebPlayback();
  stopNativePlayback();
}

export async function startShushSound(): Promise<void> {
  await stopShushSound();
  await ensureAudioMode();

  if (Platform.OS === 'web') {
    const uri = await getShushUri();
    const context = new AudioContext();
    webContext = context;

    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(context.destination);
    source.onended = () => {
      if (webSource === source) {
        webSource = null;
      }
    };
    source.start(0);
    webSource = source;
    return;
  }

  const uri = await getShushUri();
  const player = createAudioPlayer({ uri });
  nativePlayer = player;
  player.volume = 1;
  await player.seekTo(0);
  player.play();
}
