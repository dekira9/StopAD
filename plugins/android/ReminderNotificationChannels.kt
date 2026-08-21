package com.ilyadylko.StopAD

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ContentResolver
import android.content.Context
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.util.Log

object ReminderNotificationChannels {
  private const val TAG = "ReminderChannels"

  private class ReminderChannel(
    val id: String,
    val name: String,
    val importance: Int,
    val soundResource: String,
    val vibrationPattern: LongArray,
  )

  private val channels = listOf(
    ReminderChannel(
      id = "meds-quiet-v3",
      name = "Medication reminders (quiet)",
      importance = NotificationManager.IMPORTANCE_DEFAULT,
      soundResource = "reminder_quiet",
      vibrationPattern = longArrayOf(0, 120),
    ),
    ReminderChannel(
      id = "meds-normal-v3",
      name = "Medication reminders (normal)",
      importance = NotificationManager.IMPORTANCE_HIGH,
      soundResource = "reminder_normal",
      vibrationPattern = longArrayOf(0, 250, 160, 250),
    ),
    ReminderChannel(
      id = "meds-noticeable-v3",
      name = "Medication reminders (noticeable)",
      importance = NotificationManager.IMPORTANCE_MAX,
      soundResource = "reminder_noticeable",
      vibrationPattern = longArrayOf(0, 400, 120, 400, 120, 400),
    ),
  )

  /** Old channel ids whose sound/settings are frozen by Android and must be abandoned. */
  private val legacyChannelIds = listOf(
    "meds-quiet",
    "meds-normal",
    "meds-noticeable",
    "meds-quiet-v2",
    "meds-normal-v2",
    "meds-noticeable-v2",
  )

  fun ensure(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val manager = context.getSystemService(NotificationManager::class.java) ?: return
    val audioAttributes = AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_NOTIFICATION)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build()

    for (legacyId in legacyChannelIds) {
      try {
        manager.deleteNotificationChannel(legacyId)
      } catch (_: Exception) {
        // Ignore — channel may not exist.
      }
    }

    for (channelConfig in channels) {
      val sound = soundUri(context, channelConfig.soundResource)
      if (sound == null) {
        Log.e(
          TAG,
          "Missing raw/${channelConfig.soundResource}; channel ${channelConfig.id} will use default sound",
        )
      }

      val channel = NotificationChannel(
        channelConfig.id,
        channelConfig.name,
        channelConfig.importance,
      )
      channel.enableVibration(true)
      channel.vibrationPattern = channelConfig.vibrationPattern
      channel.setSound(
        sound ?: android.provider.Settings.System.DEFAULT_NOTIFICATION_URI,
        audioAttributes,
      )
      manager.createNotificationChannel(channel)
    }
  }

  private fun soundUri(context: Context, resourceName: String): Uri? {
    val resourceId = context.resources.getIdentifier(resourceName, "raw", context.packageName)
    if (resourceId == 0) {
      return null
    }
    // Resource-id form is the most reliable for notification channel sounds.
    return Uri.Builder()
      .scheme(ContentResolver.SCHEME_ANDROID_RESOURCE)
      .authority(context.packageName)
      .appendPath(resourceId.toString())
      .build()
  }
}
