import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

// CC0 — KieMae, "Button_Click" from Game Dev SFX Dub Project
// https://freesound.org/s/761863/
const BUTTON_CLICK_SOURCE = require('@/assets/Sounds/761863__kiemae__button_click.wav');

let audioModeConfigured = false;
let tapPlayer: AudioPlayer | null = null;

async function ensureAudioMode(): Promise<void> {
  if (audioModeConfigured) return;

  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'mixWithOthers',
    shouldPlayInBackground: false,
  });
  audioModeConfigured = true;
}

function getTapPlayer(): AudioPlayer {
  if (!tapPlayer) {
    tapPlayer = createAudioPlayer(BUTTON_CLICK_SOURCE);
    tapPlayer.volume = 1;
  }
  return tapPlayer;
}

export async function playSoftTapSound(): Promise<void> {
  await ensureAudioMode();
  const player = getTapPlayer();
  await player.seekTo(0);
  player.play();
}
