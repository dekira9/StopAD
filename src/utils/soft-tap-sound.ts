import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
} from 'expo-audio';

// CC0 — KieMae, "Button_Click" from Game Dev SFX Dub Project
// https://freesound.org/s/761863/
const BUTTON_CLICK_SOURCE = require('../../assets/Sounds/761863__kiemae__button_click.wav');

let audioReady: Promise<void> | null = null;
let tapPlayer: AudioPlayer | null = null;

async function ensureAudioReady(): Promise<void> {
  if (!audioReady) {
    audioReady = (async () => {
      await setIsAudioActiveAsync(true);
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
        shouldPlayInBackground: false,
        allowsRecording: false,
        shouldRouteThroughEarpiece: false,
      });
    })().catch((error) => {
      audioReady = null;
      throw error;
    });
  }

  await audioReady;
  await setIsAudioActiveAsync(true);
}

function recreateTapPlayer(): AudioPlayer {
  if (tapPlayer) {
    try {
      tapPlayer.remove();
    } catch {
      // Player may already be released.
    }
    tapPlayer = null;
  }

  // keepAudioSessionActive: finishing the short click must not tear down the session
  // (that was silencing the night-observation white noise and later taps).
  tapPlayer = createAudioPlayer(BUTTON_CLICK_SOURCE, {
    keepAudioSessionActive: true,
    downloadFirst: true,
  });
  tapPlayer.volume = 1;
  return tapPlayer;
}

export async function prepareSoftTapSound(): Promise<void> {
  await ensureAudioReady();
  if (!tapPlayer) {
    recreateTapPlayer();
  }
}

export async function playSoftTapSound(): Promise<void> {
  try {
    await ensureAudioReady();
    const player = tapPlayer ?? recreateTapPlayer();
    await player.seekTo(0);
    player.play();
  } catch (error) {
    console.warn('[soft-tap-sound] play failed, recreating player', error);
    try {
      await ensureAudioReady();
      const player = recreateTapPlayer();
      await player.seekTo(0);
      player.play();
    } catch (retryError) {
      console.warn('[soft-tap-sound] retry failed', retryError);
    }
  }
}
