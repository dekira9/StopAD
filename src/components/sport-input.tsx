import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AppLabels } from '@/constants/i18n';
import { formatSectionTitle, daySectionLabelStyle, weekBodyTextStyle, weekServiceTextStyle } from '@/constants/typography';
import {
  createSportActivity,
  formatSportDuration,
  parseSportLog,
  serializeSportLog,
  SPORT_ACTIVITY_TYPES,
  SPORT_ACTIVITY_LABEL_KEYS,
  type SportActivity,
  type SportActivityType,
  type SportLog,
} from '@/utils/sport-log';

type ThemeSlice = {
  text: string;
  textSecondary: string;
  activeBg: string;
  activeText: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  sectionLabelBg: string;
  rowBorder: string;
  iconMuted: string;
};

type Props = {
  label: string;
  value: string;
  labels: AppLabels;
  theme: ThemeSlice;
  onChange: (value: string) => void;
};

function parseDurationInput(value: string, max: number): number {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  const parsed = Number.parseInt(digits, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(max, parsed);
}

function parseStepsInput(value: string): number | undefined {
  const digits = value.replace(/\D/g, '');
  if (!digits) return undefined;
  const parsed = Number.parseInt(digits, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return undefined;
  return parsed;
}

export function SportInput({ label, value, labels, theme, onChange }: Props) {
  const log = useMemo(() => parseSportLog(value), [value]);

  const updateLog = (nextLog: SportLog) => {
    onChange(serializeSportLog(nextLog));
  };

  const updateActivity = (id: string, patch: Partial<SportActivity>) => {
    updateLog({
      activities: log.activities.map((activity) => (activity.id === id ? { ...activity, ...patch } : activity)),
    });
  };

  const addActivity = () => {
    const nextLog = {
      activities: [...log.activities, createSportActivity(log.activities.length)],
    };
    updateLog(nextLog);
  };

  const removeActivity = (id: string) => {
    updateLog({
      activities: log.activities.filter((activity) => activity.id !== id),
    });
  };

  const renderActivityCard = (activity: SportActivity) => {
    const durationLabel = formatSportDuration(activity.hours, activity.minutes, labels);

    return (
      <View
        key={activity.id}
        style={[styles.activityCard, { borderColor: theme.inactiveBorder, backgroundColor: theme.inactiveBg }]}>
        <View style={styles.activityHeader}>
          <Text style={[styles.activityTitle, { color: theme.textSecondary }]}>{labels.sportActivityType}</Text>
          <Pressable
            onPress={() => removeActivity(activity.id)}
            hitSlop={6}
            style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}>
            <Ionicons name="remove-circle" size={20} color={theme.iconMuted} />
          </Pressable>
        </View>

        <View style={styles.typeGrid}>
          {SPORT_ACTIVITY_TYPES.map((type: SportActivityType) => {
            const selected = activity.type === type;
            const typeLabel = labels[SPORT_ACTIVITY_LABEL_KEYS[type] as keyof AppLabels];
            return (
              <Pressable
                key={type}
                onPress={() =>
                  updateActivity(activity.id, {
                    type,
                    steps: type === 'walking' ? activity.steps : undefined,
                    otherNote: type === 'other' ? activity.otherNote ?? '' : '',
                  })
                }
                style={({ pressed }) => [
                  styles.typeChip,
                  {
                    borderColor: selected ? theme.activeBg : theme.inactiveBorder,
                    backgroundColor: selected ? theme.activeBg : theme.inactiveBg,
                  },
                  pressed && styles.pressed,
                ]}>
                <Text
                  style={[
                    styles.typeChipText,
                    { color: selected ? theme.activeText : theme.inactiveText },
                  ]}
                  numberOfLines={2}>
                  {typeLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activity.type === 'other' ? (
          <TextInput
            value={activity.otherNote ?? ''}
            onChangeText={(text) => updateActivity(activity.id, { otherNote: text })}
            placeholder={labels.sportOtherPlaceholder}
            placeholderTextColor={theme.textSecondary}
            style={[styles.otherInput, { color: theme.text, borderColor: theme.inactiveBorder }]}
          />
        ) : null}

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{labels.sportDuration}</Text>
        <View style={styles.durationRow}>
          <TextInput
            value={activity.hours > 0 ? String(activity.hours) : ''}
            onChangeText={(text) => updateActivity(activity.id, { hours: parseDurationInput(text, 23) })}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            style={[styles.durationInput, { color: theme.text, borderColor: theme.inactiveBorder }]}
          />
          <Text style={[styles.durationUnit, { color: theme.textSecondary }]}>{labels.sleepHoursShort}</Text>
          <TextInput
            value={activity.minutes > 0 ? String(activity.minutes) : ''}
            onChangeText={(text) => updateActivity(activity.id, { minutes: parseDurationInput(text, 59) })}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            style={[styles.durationInput, { color: theme.text, borderColor: theme.inactiveBorder }]}
          />
          <Text style={[styles.durationUnit, { color: theme.textSecondary }]}>{labels.sleepMinutesShort}</Text>
        </View>

        {activity.type === 'walking' ? (
          <>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{labels.sportSteps}</Text>
            <TextInput
              value={activity.steps ? String(activity.steps) : ''}
              onChangeText={(text) => updateActivity(activity.id, { steps: parseStepsInput(text) })}
              placeholder={`... ${labels.sportStepsPlaceholder.toLocaleLowerCase()}`}
              placeholderTextColor={theme.iconMuted}
              keyboardType="number-pad"
              style={[styles.stepsInput, { color: theme.text, borderColor: theme.inactiveBorder }]}
            />
          </>
        ) : null}

        {durationLabel ? (
          <Text style={[styles.durationSummary, { color: theme.text }]}>
            {labels.sportDurationTotal}: {durationLabel}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.sectionBlock}>
      <Text style={[styles.sectionLabel, { backgroundColor: theme.sectionLabelBg }]}>
        {formatSectionTitle(label)}
      </Text>

      <View style={styles.content}>
        {log.activities.map((activity) => renderActivityCard(activity))}

        <Pressable
          onPress={addActivity}
          style={({ pressed }) => [
            styles.addButton,
            { borderColor: theme.inactiveBorder, backgroundColor: theme.inactiveBg },
            pressed && styles.pressed,
          ]}>
          <Ionicons name="add-circle-outline" size={16} color={theme.activeBg} />
          <Text style={[styles.addButtonText, { color: theme.activeBg }]}>
            {labels.sportAddActivity.toLocaleLowerCase()}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBlock: {},
  sectionLabel: {
    ...daySectionLabelStyle,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
  },
  activityCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityTitle: {
    ...weekServiceTextStyle,
  },
  removeBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 7,
    minWidth: '30%',
    flexGrow: 1,
    maxWidth: '48%',
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 17,
  },
  fieldLabel: {
    ...weekServiceTextStyle,
    marginTop: 2,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationInput: {
    width: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    ...weekBodyTextStyle,
    textAlign: 'center',
  },
  durationUnit: {
    fontSize: 13,
    fontWeight: '500',
    marginRight: 4,
  },
  stepsInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...weekBodyTextStyle,
    lineHeight: 20,
  },
  otherInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...weekBodyTextStyle,
  },
  durationSummary: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  addButtonText: {
    ...weekBodyTextStyle,
  },
  pressed: { opacity: 0.7 },
});
