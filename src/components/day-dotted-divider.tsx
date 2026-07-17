import { StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

type Props = {
  color: string;
};

export function DayDottedDivider({ color }: Props) {
  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no">
      <Svg width="100%" height={8} viewBox="0 0 100 8" preserveAspectRatio="none">
        <Line
          x1={0}
          y1={4}
          x2={100}
          y2={4}
          stroke={color}
          strokeWidth={2.5}
          strokeDasharray="0.1 6"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginVertical: 20,
    marginHorizontal: 16,
  },
});
