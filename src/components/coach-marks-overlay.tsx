import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { BackHandler, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

import { FooterMenuDotsIcon } from '@/components/footer-bar-icons';
import type { AppLabels } from '@/constants/i18n';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';

export type CoachMarkTarget = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  visible: boolean;
  step: 0 | 1;
  panicTarget: CoachMarkTarget | null;
  infoTarget: CoachMarkTarget | null;
  labels: AppLabels;
  onNext: () => void;
  onDismiss: () => void;
};

const PADDING = 10;

function SpotlightHole({ target, overlayColor }: { target: CoachMarkTarget; overlayColor: string }) {
  const left = Math.max(0, target.x - PADDING);
  const top = Math.max(0, target.y - PADDING);
  const width = target.width + PADDING * 2;
  const height = target.height + PADDING * 2;
  const right = left + width;
  const bottom = top + height;

  return (
    <>
      <View style={[styles.shade, { top: 0, left: 0, right: 0, height: top, backgroundColor: overlayColor }]} />
      <View style={[styles.shade, { top: bottom, left: 0, right: 0, bottom: 0, backgroundColor: overlayColor }]} />
      <View style={[styles.shade, { top, left: 0, width: left, height, backgroundColor: overlayColor }]} />
      <View
        style={[styles.shade, { top, left: right, right: 0, height, backgroundColor: overlayColor }]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.highlightRing,
          {
            top,
            left,
            width,
            height,
            // Match circular footer buttons (36×36 with radius 18).
            borderRadius: Math.max(width, height) / 2,
            borderColor: 'rgba(255,255,255,0.95)',
          },
        ]}
      />
    </>
  );
}

export function CoachMarksOverlay({
  visible,
  step,
  panicTarget,
  infoTarget,
  labels,
  onNext,
  onDismiss,
}: Props) {
  const { modal: theme } = useAppChromeTheme();

  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onDismiss();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onDismiss]);

  const target = step === 0 ? panicTarget : infoTarget;
  const title = step === 0 ? labels.coachMarkPanicTitle : labels.coachMarkInfoTitle;
  const body = step === 0 ? labels.coachMarkPanicBody : labels.coachMarkInfoBody;
  const actionLabel = step === 0 ? labels.coachMarkNext : labels.coachMarkGotIt;

  if (!visible || !target) return null;

  const tooltipAbove = target.y > Dimensions.get('window').height * 0.45;
  const tooltipTop = tooltipAbove ? Math.max(24, target.y - PADDING - 168) : target.y + target.height + PADDING + 12;

  return (
    <View style={styles.root}>
      {/* Swallows taps anywhere outside the tooltip, including the spotlight hole. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={() => {}} />

      <SpotlightHole target={target} overlayColor={theme.modalOverlay} />

      <View
        style={[
          styles.tooltip,
          {
            top: tooltipTop,
            backgroundColor: theme.modalBg,
            borderColor: theme.subtlePanelBorder,
          },
        ]}>
        <View style={styles.tooltipHeader}>
          {step === 0 ? (
            <Ionicons name="pulse" size={18} color={theme.activeBg} />
          ) : (
            <FooterMenuDotsIcon size={18} color={theme.icon} />
          )}
          <Text style={[styles.tooltipTitle, { color: theme.text }]}>{title}</Text>
        </View>
        <Text style={[styles.tooltipBody, { color: theme.textSecondary }]}>{body}</Text>
        <Pressable
          onPress={step === 0 ? onNext : onDismiss}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.activeBg, borderColor: theme.activeBg },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.actionButtonText, { color: theme.activeText }]}>{actionLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 900,
    elevation: 900,
  },
  shade: { position: 'absolute' },
  highlightRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  tooltip: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tooltipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tooltipTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  tooltipBody: { fontSize: 14, lineHeight: 20 },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
  },
  actionButtonText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  pressed: { opacity: 0.75 },
});
