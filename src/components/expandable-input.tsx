import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle } from 'react-native';

import { weekBodyTextStyle } from '@/constants/typography';

type ExpandableInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  expandKey: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  selection?: { start: number; end: number };
  iconMuted: string;
  placeholder?: string;
  placeholderStyle?: StyleProp<TextStyle>;
  placeholderTextColor?: string;
  color: string;
  opacity?: number;
  textDecorationLine?: 'none' | 'line-through';
  style?: TextInputProps['style'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
};

export function ExpandableInput({
  value,
  onChangeText,
  isExpanded,
  onToggleExpand,
  onFocus,
  onBlur,
  selection,
  iconMuted,
  placeholder,
  placeholderStyle,
  placeholderTextColor,
  color,
  opacity = 1,
  textDecorationLine = 'none',
  style,
  returnKeyType = 'default',
  onSubmitEditing,
  blurOnSubmit,
}: ExpandableInputProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const canExpand = useMemo(() => {
    if (!value) return false;
    if (value.includes('\n')) return true;
    if (containerWidth <= 0) return false;
    return contentWidth > containerWidth + 1;
  }, [value, containerWidth, contentWidth]);

  const showToggle = isExpanded || canExpand;

  return (
    <View style={styles.row}>
      <View
        style={[styles.inputWrap, !isExpanded && styles.inputWrapCollapsed]}
        onLayout={(event) => {
          const nextWidth = event.nativeEvent.layout.width;
          if (nextWidth !== containerWidth) {
            setContainerWidth(nextWidth);
          }
        }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          multiline={isExpanded}
          numberOfLines={isExpanded ? undefined : 1}
          scrollEnabled={isExpanded}
          textAlignVertical={isExpanded ? 'top' : 'center'}
          selection={!isExpanded && !isFocused ? { start: 0, end: 0 } : selection}
          placeholder={placeholderStyle ? undefined : placeholder}
          placeholderTextColor={placeholderTextColor}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          onContentSizeChange={(event) => {
            const nextWidth = event.nativeEvent.contentSize.width;
            if (nextWidth !== contentWidth) {
              setContentWidth(nextWidth);
            }
          }}
          style={[
            styles.input,
            !isExpanded && styles.inputCollapsed,
            isExpanded && styles.inputExpanded,
            style,
            { color, opacity, textDecorationLine },
          ]}
        />
        {placeholderStyle && !value ? (
          <View
            pointerEvents="none"
            style={[
              styles.placeholderRow,
              !isExpanded && styles.placeholderRowCollapsed,
              isExpanded && styles.placeholderRowExpanded,
            ]}>
            <Text
              style={[
                styles.placeholderText,
                !isExpanded && styles.placeholderTextCollapsed,
              placeholderStyle,
              { color: placeholderTextColor },
            ]}>
              {placeholder}
            </Text>
          </View>
        ) : null}
      </View>
      {showToggle ? (
        <Pressable onPress={onToggleExpand} hitSlop={6} style={({ pressed }) => [styles.expandBtn, pressed && styles.expandPressed]}>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={iconMuted} />
        </Pressable>
      ) : (
        <View style={styles.expandSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    overflow: 'hidden',
  },
  inputWrap: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  inputWrapCollapsed: {
    maxHeight: 20,
  },
  input: {
    ...weekBodyTextStyle,
    width: '100%',
    lineHeight: 20,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlign: 'left',
  },
  inputCollapsed: {
    maxHeight: 20,
  },
  inputExpanded: {
    minHeight: 76,
    paddingTop: 4,
    paddingBottom: 4,
  },
  placeholderRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  placeholderRowCollapsed: {
    top: 0,
  },
  placeholderRowExpanded: {
    top: 4,
  },
  placeholderText: {
    flex: 1,
  },
  placeholderTextCollapsed: {
    lineHeight: 20,
  },
  expandBtn: {
    width: 18,
    height: 18,
    marginLeft: 6,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
  expandSpacer: {
    width: 24,
  },
});
