import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
} from 'expo-audio';

import { REMINDER_SOUND_CONFIG, type ReminderSoundId } from '@/constants/reminder-sounds';

let audioReady: Promise<void> | null = null;
let previewPlayer: AudioPlayer | null = null;
let previewSoundId: ReminderSoundId | null = null;

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

function releasePreviewPlayer() {
  if (!previewPlayer) return;
  try {
    previewPlayer.remove();
  } catch {
    // Player may already be released.
  }
  previewPlayer = null;
  previewSoundId = null;
}

function recreatePreviewPlayer(soundId: ReminderSoundId): AudioPlayer {
  releasePreviewPlayer();
  // downloadFirst starts the player with a null source and loads later,
  // so the first play() is silent. Local assets must load synchronously.
  previewPlayer = createAudioPlayer(REMINDER_SOUND_CONFIG[soundId].preview, {
    keepAudioSessionActive: true,
    downloadFirst: false,
  });
  previewPlayer.volume = 1;
  previewSoundId = soundId;
  return previewPlayer;
}

async function waitUntilLoaded(player: AudioPlayer, timeoutMs = 2500): Promise<void> {
  if (player.isLoaded) return;
  const started = Date.now();
  while (!player.isLoaded && Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
}

export async function playReminderSoundPreview(soundId: ReminderSoundId): Promise<void> {
  try {
    await ensureAudioReady();
    const player =
      previewSoundId === soundId && previewPlayer && previewPlayer.isLoaded
        ? previewPlayer
        : recreatePreviewPlayer(soundId);
    await waitUntilLoaded(player);
    await player.seekTo(0);
    player.play();
  } catch (error) {
    console.warn('[reminder-sound] preview failed', error);
    try {
      await ensureAudioReady();
      const player = recreatePreviewPlayer(soundId);
      await waitUntilLoaded(player);
      await player.seekTo(0);
      player.play();
    } catch (retryError) {
      console.warn('[reminder-sound] preview retry failed', retryError);
    }
  }
}
