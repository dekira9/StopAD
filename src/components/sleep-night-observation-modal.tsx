import { format } from 'date-fns';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import type { AppLabels } from '@/constants/i18n';
import { useAppSystemChromeRestore } from '@/hooks/use-system-chrome';
import { prepareShushSound, startShushSound, stopShushSound } from '@/utils/shush-sound';
import type { SleepLog } from '@/utils/sleep-log';
import {
  buildSleepLogFromNightEvents,
  type NightObservationEvent,
} from '@/utils/sleep-night-observation';
import { playSoftTapSound, prepareSoftTapSound } from '@/utils/soft-tap-sound';

const AWAKE_BG = '#32280a';
const AWAKE_TEXT = '#5c4a1c';
const ASLEEP_BG = '#1f1f1f';
const ASLEEP_TEXT = '#4a4a4a';
const FINISH_ACCENT = ASLEEP_TEXT;

type ActiveZone = 'asleep' | 'awake' | null;

function SunriseIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="3" y1="16.5" x2="21" y2="16.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <Path
        d="M7.5 16.5a4.5 4.5 0 0 1 9 0"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <Line x1="12" y1="4.2" x2="12" y2="7.2" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <Line x1="6.2" y1="6.8" x2="8.2" y2="8.8" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <Line x1="17.8" y1="6.8" x2="15.8" y2="8.8" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <Line x1="4.2" y1="12.2" x2="7.2" y2="12.2" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <Line x1="16.8" y1="12.2" x2="19.8" y2="12.2" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

function CrescentMoonIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15.5 3.5a8.5 8.5 0 1 0 5 14.8A7.2 7.2 0 0 1 15.5 3.5Z"
        stroke={color}
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Circle ~80% screen width with soft glow inward and outward. */
function PressGlowRing({ size, color, visible }: { size: number; color: string; visible: boolean }) {
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 280 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, visible]);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.glowWrap,
        {
          width: size,
          height: size,
          opacity: anim,
          transform: [
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.86, 1],
              }),
            },
          ],
        },
      ]}>
      <Svg width={size} height={size}>
        {/* Outer glow */}
        <Circle cx={cx} cy={cy} r={r + 10} stroke={color} strokeWidth={22} opacity={0.06} fill="none" />
        <Circle cx={cx} cy={cy} r={r + 4} stroke={color} strokeWidth={14} opacity={0.1} fill="none" />
        <Circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={8} opacity={0.18} fill="none" />
        {/* Core ring */}
        <Circle cx={cx} cy={cy} r={r - 2} stroke={color} strokeWidth={2.2} opacity={0.55} fill="none" />
        {/* Inner glow */}
        <Circle cx={cx} cy={cy} r={r - 10} stroke={color} strokeWidth={10} opacity={0.14} fill="none" />
        <Circle cx={cx} cy={cy} r={r - 18} stroke={color} strokeWidth={16} opacity={0.07} fill="none" />
      </Svg>
    </Animated.View>
  );
}

type Props = {
  labels: AppLabels;
  onClose: () => void;
  onFinish: (log: SleepLog) => void;
};

function recordEvent(type: NightObservationEvent['type'], events: NightObservationEvent[]): NightObservationEvent[] {
  return [...events, { type, time: format(new Date(), 'HH:mm') }];
}

function applyNightObservationChrome() {
  void SystemUI.setBackgroundColorAsync(ASLEEP_BG);
  if (Platform.OS !== 'android') return;
  RNStatusBar.setTranslucent(true);
  RNStatusBar.setBackgroundColor('transparent');
  RNStatusBar.setBarStyle('dark-content', true);
  NavigationBar.setHidden(true);
}

export function SleepNightObservationOverlay({ labels, onClose, onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const restoreAppChrome = useAppSystemChromeRestore();
  const eventsRef = useRef<NightObservationEvent[]>([]);
  const screen = Dimensions.get('screen');
  const [activeZone, setActiveZone] = useState<ActiveZone>(null);
  const [pressedZone, setPressedZone] = useState<ActiveZone>(null);
  const glowSize = screen.width * 0.8;

  const activateChrome = useCallback(() => {
    applyNightObservationChrome();
  }, []);

  useEffect(() => {
    activateChrome();
    const retry = setTimeout(activateChrome, 50);
    void activateKeepAwakeAsync('sleep-night-observation');
    void Promise.all([prepareSoftTapSound(), prepareShushSound()]).catch((error) => {
      console.warn('[night-observation] audio prepare failed', error);
    });

    return () => {
      clearTimeout(retry);
      deactivateKeepAwake('sleep-night-observation');
      void stopShushSound();
      restoreAppChrome();
    };
  }, [activateChrome, restoreAppChrome]);

  const pushEvent = (type: NightObservationEvent['type']) => {
    eventsRef.current = recordEvent(type, eventsRef.current);
  };

  const handleAwakePress = () => {
    void playSoftTapSound();
    pushEvent('awake');
    setActiveZone('awake');
    void startShushSound();
  };

  const handleAsleepPress = () => {
    void playSoftTapSound();
    pushEvent('asleep');
    setActiveZone('asleep');
    void stopShushSound();
  };

  const handleFinish = () => {
    void stopShushSound();
    const nightLog = buildSleepLogFromNightEvents(eventsRef.current);
    if (nightLog) {
      onFinish(nightLog);
    }
    onClose();
  };

  const asleepGlow = pressedZone === 'asleep' || activeZone === 'asleep';
  const awakeGlow = pressedZone === 'awake' || activeZone === 'awake';

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
      <ExpoStatusBar style="dark" />
      {Platform.OS === 'android' ? (
        <RNStatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      ) : null}
      {Platform.OS === 'android' ? <NavigationBar hidden style="dark" /> : null}
      <View style={styles.root}>
        <Pressable
          style={[styles.half, styles.asleepHalf]}
          onPress={handleAsleepPress}
          onPressIn={() => setPressedZone('asleep')}
          onPressOut={() => setPressedZone(null)}>
          <View style={[styles.halfInner, { paddingTop: insets.top }]}>
            <View style={styles.labelStage}>
              <PressGlowRing size={glowSize} color={ASLEEP_TEXT} visible={asleepGlow} />
              <View style={styles.labelRow}>
                <CrescentMoonIcon size={66} color={ASLEEP_TEXT} />
                <Text style={styles.asleepText}>{labels.sleepNightObservationAsleep}</Text>
              </View>
            </View>
          </View>
        </Pressable>

        <Pressable
          style={[styles.half, styles.awakeHalf]}
          onPress={handleAwakePress}
          onPressIn={() => setPressedZone('awake')}
          onPressOut={() => setPressedZone(null)}>
          <View style={styles.halfInner}>
            <View style={styles.labelStage}>
              <PressGlowRing size={glowSize} color={AWAKE_TEXT} visible={awakeGlow} />
              <View style={styles.labelRow}>
                <CrescentMoonIcon size={66} color={AWAKE_TEXT} />
                <Text style={styles.awakeText}>{labels.sleepNightObservationAwake}</Text>
              </View>
            </View>
          </View>
        </Pressable>

        <View style={[styles.finishBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable style={styles.finishButton} onPress={handleFinish} hitSlop={12}>
            <SunriseIcon size={20} color={FINISH_ACCENT} />
            <Text style={styles.finishText}>{labels.sleepNightObservationFinish}</Text>
          </Pressable>
        </View>
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
    backgroundColor: AWAKE_BG,
  },
  half: {
    flex: 1,
  },
  halfInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWrap: {
    position: 'absolute',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 1,
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
  finishBar: {
    backgroundColor: ASLEEP_BG,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  finishButton: {
    minHeight: 60,
    borderRadius: 18,
    backgroundColor: '#242424',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    borderTopColor: 'rgba(255,255,255,0.16)',
    borderBottomColor: 'rgba(0,0,0,0.55)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  finishText: {
    color: FINISH_ACCENT,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
