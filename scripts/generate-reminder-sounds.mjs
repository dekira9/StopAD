import fs from 'node:fs';
import path from 'node:path';

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(process.cwd(), 'assets', 'Sounds');

function writeWav(file, samples) {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }
  fs.writeFileSync(file, buf);
}

function envelope(index, length, attack = 0.03, release = 0.18) {
  const attackSamples = Math.max(1, Math.floor(length * attack));
  const releaseSamples = Math.max(1, Math.floor(length * release));
  if (index < attackSamples) return index / attackSamples;
  if (index > length - releaseSamples) return Math.max(0, (length - index) / releaseSamples);
  return 1;
}

function tone(freq, seconds, amp) {
  const length = Math.floor(seconds * SAMPLE_RATE);
  const samples = new Float64Array(length);
  for (let i = 0; i < length; i += 1) {
    samples[i] = Math.sin((2 * Math.PI * freq * i) / SAMPLE_RATE) * amp * envelope(i, length);
  }
  return samples;
}

function silence(seconds) {
  return new Float64Array(Math.floor(seconds * SAMPLE_RATE));
}

function concat(...parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Float64Array(length);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
writeWav(path.join(OUT_DIR, 'reminder_quiet.wav'), tone(523.25, 0.28, 0.22));
writeWav(path.join(OUT_DIR, 'reminder_normal.wav'), tone(659.25, 0.42, 0.5));
writeWav(
  path.join(OUT_DIR, 'reminder_noticeable.wav'),
  concat(tone(784.0, 0.26, 0.72), silence(0.07), tone(987.77, 0.38, 0.85)),
);

const androidRaw = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res', 'raw');
if (fs.existsSync(path.join(process.cwd(), 'android'))) {
  fs.mkdirSync(androidRaw, { recursive: true });
  for (const name of ['reminder_quiet.wav', 'reminder_normal.wav', 'reminder_noticeable.wav']) {
    fs.copyFileSync(path.join(OUT_DIR, name), path.join(androidRaw, name));
  }
}
