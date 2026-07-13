import { format } from 'date-fns';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppLabels } from '@/constants/i18n';
import { useAppSystemChromeRestore } from '@/hooks/use-system-chrome';
import { startShushSound, stopShushSound } from '@/utils/shush-sound';
import type { SleepLog } from '@/utils/sleep-log';
import {
  buildSleepLogFromNightEvents,
  type NightObservationEvent,
} from '@/utils/sleep-night-observation';
import { playSoftTapSound } from '@/utils/soft-tap-sound';

const AWAKE_BG = '#1f1f1f';
const AWAKE_TEXT = '#4a4a4a';
const ASLEEP_BG = '#3d2f00';
const ASLEEP_TEXT = '#6b5520';
const FINISH_TEXT = '#555555';

type Props = {
  labels: AppLabels;
  onClose: () => void;
  onFinish: (log: SleepLog) => void;
};

function recordEvent(type: NightObservationEvent['type'], events: NightObservationEvent[]): NightObservationEvent[] {
  return [...events, { type, time: format(new Date(), 'HH:mm') }];
}

function applyNightObservationChrome() {
  void SystemUI.setBackgroundColorAsync(AWAKE_BG);
  if (Platform.OS !== 'android') return;
  RNStatusBar.setTranslucent(true);
  RNStatusBar.setBackgroundColor('transparent');
  RNStatusBar.setBarStyle('light-content', true);
  NavigationBar.setHidden(true);
}

export function SleepNightObservationOverlay({ labels, onClose, onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const restoreAppChrome = useAppSystemChromeRestore();
  const [events, setEvents] = useState<NightObservationEvent[]>([]);
  const screen = Dimensions.get('screen');

  const activateChrome = useCallback(() => {
    applyNightObservationChrome();
  }, []);

  useEffect(() => {
    activateChrome();
    const retry = setTimeout(activateChrome, 50);
    void activateKeepAwakeAsync('sleep-night-observation');
    return () => {
      clearTimeout(retry);
      deactivateKeepAwake('sleep-night-observation');
      void stopShushSound();
      restoreAppChrome();
    };
  }, [activateChrome, restoreAppChrome]);

  const handleAwakePress = () => {
    void playSoftTapSound();
    setEvents((prev) => recordEvent('awake', prev));
    void startShushSound();
  };

  const handleAsleepPress = () => {
    void playSoftTapSound();
    setEvents((prev) => recordEvent('asleep', prev));
    void stopShushSound();
  };

  const handleFinish = () => {
    void stopShushSound();
    const nightLog = buildSleepLogFromNightEvents(events);
    if (nightLog) {
      onFinish(nightLog);
    }
    onClose();
  };

  return (
    <View
      style={[
        styles.overlay,
        {
          width: screen.width,
          height: screen.height,
          top: -insets.top,
        },
      ]}>
      <ExpoStatusBar style="light" translucent />
      {Platform.OS === 'android' ? (
        <RNStatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      ) : null}
      {Platform.OS === 'android' ? <NavigationBar hidden style="light" /> : null}
      <View style={styles.root}>
        <Pressable style={[styles.half, styles.awakeHalf]} onPress={handleAwakePress}>
          <View style={[styles.halfInner, { paddingTop: insets.top }]}>
            <Text style={styles.awakeText}>{labels.sleepNightObservationAwake}</Text>
          </View>
        </Pressable>

        <Pressable style={[styles.half, styles.asleepHalf]} onPress={handleAsleepPress}>
          <View style={styles.halfInner}>
            <Text style={styles.asleepText}>{labels.sleepNightObservationAsleep}</Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.finishButton, { top: insets.top + 86 }]}
          onPress={handleFinish}
          hitSlop={12}>
          <Text style={styles.finishText}>{labels.sleepNightObservationFinish}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  root: {
    flex: 1,
    backgroundColor: ASLEEP_BG,
  },
  half: {
    flex: 1,
  },
  halfInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  awakeHalf: {
    backgroundColor: AWAKE_BG,
  },
  asleepHalf: {
    backgroundColor: ASLEEP_BG,
  },
  awakeText: {
    color: AWAKE_TEXT,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  asleepText: {
    color: ASLEEP_TEXT,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  finishButton: {
    position: 'absolute',
    right: 16,
    zIndex: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  finishText: {
    color: FINISH_TEXT,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
