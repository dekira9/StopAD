import { writeFileSync } from 'node:fs';
import gifenc from 'gifenc';

const { GIFEncoder, quantize, applyPalette } = gifenc;

const WIDTH = 40;
const HEIGHT = 32;
const FRAMES = 8;
const PIXEL_FORMAT = 'rgba4444';
const CACHE_FILE_NAME = 'walking-person-side-v3.gif';

const encoder = GIFEncoder();

function createFrameBuffer() {
  const rgba = new Uint8Array(WIDTH * HEIGHT * 4);
  for (let index = 0; index < rgba.length; index += 4) {
    rgba[index] = 255;
    rgba[index + 1] = 255;
    rgba[index + 2] = 255;
    rgba[index + 3] = 0;
  }
  return rgba;
}

function setPixel(rgba, x, y, r = 0, g = 0, b = 0, a = 255) {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= WIDTH || py >= HEIGHT) return;
  const index = (py * WIDTH + px) * 4;
  rgba[index] = r;
  rgba[index + 1] = g;
  rgba[index + 2] = b;
  rgba[index + 3] = a;
}

function drawThickPixel(rgba, x, y) {
  setPixel(rgba, x, y);
  setPixel(rgba, x + 1, y);
  setPixel(rgba, x, y + 1);
}

function drawLine(rgba, x0, y0, x1, y1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    drawThickPixel(rgba, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
  }
}

function drawCircle(rgba, cx, cy, radius) {
  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      if (x * x + y * y <= radius * radius) {
        setPixel(rgba, cx + x, cy + y);
      }
    }
  }
}

function limbPoints(hipX, hipY, footX, footY, kneeForward = 1) {
  const midX = (hipX + footX) / 2 + kneeForward * 1.8;
  const midY = (hipY + footY) / 2 - 1.2;
  return { kneeX: midX, kneeY: midY };
}

function drawLeg(rgba, hipX, hipY, footX, footY, kneeForward) {
  const { kneeX, kneeY } = limbPoints(hipX, hipY, footX, footY, kneeForward);
  drawLine(rgba, hipX, hipY, kneeX, kneeY);
  drawLine(rgba, kneeX, kneeY, footX, footY);
}

function drawArm(rgba, shoulderX, shoulderY, handX, handY) {
  drawLine(rgba, shoulderX, shoulderY, handX, handY);
}

function drawFrame(frameIndex) {
  const rgba = createFrameBuffer();
  const phase = (frameIndex / FRAMES) * Math.PI * 2;
  const swing = Math.sin(phase);

  const groundY = HEIGHT - 3;
  const hipX = 20;
  const hipY = 20;
  const shoulderX = 20;
  const shoulderY = 11;
  const headX = 21;
  const headY = 5;

  drawLine(rgba, 6, groundY, WIDTH - 6, groundY);

  drawCircle(rgba, headX, headY, 3.2);
  drawLine(rgba, headX, headY + 3, shoulderX, shoulderY);
  drawLine(rgba, shoulderX, shoulderY, hipX, hipY);

  const frontFootX = hipX + 5.5 + swing * 4.2;
  const backFootX = hipX - 4.8 - swing * 4.2;
  const frontFootY = groundY;
  const backFootY = groundY - (Math.abs(swing) > 0.65 ? 1.5 : 0);

  drawLeg(rgba, hipX, hipY, frontFootX, frontFootY, 1);
  drawLeg(rgba, hipX, hipY, backFootX, backFootY, -1);

  const frontArmX = shoulderX + 4.5 + swing * 3.8;
  const frontArmY = shoulderY + 6.5 + Math.abs(swing) * 0.8;
  const backArmX = shoulderX - 4.2 - swing * 3.8;
  const backArmY = shoulderY + 5.5 - Math.abs(swing) * 0.5;

  drawArm(rgba, shoulderX, shoulderY, frontArmX, frontArmY);
  drawArm(rgba, shoulderX, shoulderY, backArmX, backArmY);

  return rgba;
}

function findTransparentIndex(palette) {
  const index = palette.findIndex((color) => color.length === 4 && color[3] === 0);
  return index >= 0 ? index : 0;
}

for (let frame = 0; frame < FRAMES; frame += 1) {
  const rgba = drawFrame(frame);
  const palette = quantize(rgba, 256, {
    format: PIXEL_FORMAT,
    oneBitAlpha: true,
    clearAlpha: true,
    clearAlphaThreshold: 127,
    clearAlphaColor: 0xff,
  });
  const index = applyPalette(rgba, palette, PIXEL_FORMAT);
  const transparentIndex = findTransparentIndex(palette);

  encoder.writeFrame(index, WIDTH, HEIGHT, {
    palette,
    delay: 110,
    transparent: true,
    transparentIndex,
    dispose: 2,
  });
}

encoder.finish();
writeFileSync(new URL(`../assets/images/${CACHE_FILE_NAME}`, import.meta.url), Buffer.from(encoder.bytes()));
writeFileSync(new URL('../assets/images/walking-person.gif', import.meta.url), Buffer.from(encoder.bytes()));
