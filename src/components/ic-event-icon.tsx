import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/** Notebook + pencil from assets/images/icevent.svg */
export function IcEventIcon({ size = 28, color = '#8B6B52', strokeWidth = 1.75 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 37.75 35.87" fill="none">
      <Line x1="10.24" y1="11.01" x2="19.78" y2="11.01" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Line x1="10.21" y1="15.42" x2="15.21" y2="15.42" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Line x1="10.24" y1="6.56" x2="19.78" y2="6.56" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Path d="M26,.89a1.57,1.57,0,0,1,1.72,1.72" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Path d="M2.69,32.17a2.64,2.64,0,0,1,2.7-2.49" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Path d="M27.71,25.76c0,2.4,0,4.88,0,7.33" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Line x1="0.88" y1="24.03" x2="4.45" y2="24.03" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Line x1="0.88" y1="15.13" x2="4.45" y2="15.12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Line x1="0.88" y1="10.7" x2="4.45" y2="10.7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Line x1="0.88" y1="6.26" x2="4.45" y2="6.26" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Line x1="4.45" y1="19.58" x2="0.88" y2="19.58" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Path d="M27.72,2.61V3.77" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Path d="M4.49.88H26" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Path d="M2.7,2.72A1.64,1.64,0,0,1,4.49.88" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Path d="M2.7,4.68v-2" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Line x1="2.7" y1="10.69" x2="2.7" y2="6.23" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Path d="M13,29.68H27.71" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Path d="M5.19,35a2.73,2.73,0,0,1-2.5-2.8" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Path d="M27.72,22.7c0,1,0,2,0,3.06" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Path d="M27.72,3.77V4.88" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Path d="M2.7,6.23V4.68" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Path d="M2.7,32.28c0-1.54,0-6.65,0-8.13V10.69" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Path d="M5.39,29.68H13" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Path
        d="M27.74,33.09a2,2,0,0,1-.22,1.16,3.36,3.36,0,0,1-.62.52,1.47,1.47,0,0,1-.76.21H5.81c-.19,0-.4,0-.62,0"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeMiterlimit={10}
      />
      <Polyline
        points="29.5 15.32 23 23.14 16.51 26.47 18.73 19.58 30.09 6.22 32.58 3.29 36.88 6.87 34.34 9.81 30.33 6.42"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="18.94" y1="19.75" x2="22.72" y2="22.9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
      <Circle cx="31.94" cy="12.48" r="1.77" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeMiterlimit={10} />
    </Svg>
  );
}
