import Svg, { Circle, Line, Path, Polygon } from 'react-native-svg';

import { Meds99Icon } from '@/components/meds99-icon';

type Props = {
  size?: number;
  accentColor?: string;
  strokeColor?: string;
  handFill?: string;
};

const ACCENT = '#8A9BD2';
const STROKE = '#000000';

/** Hand with tablet and capsule — from assets/images/meds99.svg */
export function FooterMedsIcon({
  size = 20,
  accentColor = '#C4CDE8',
  strokeColor = STROKE,
  handFill = '#FFFFFF',
}: Props) {
  return <Meds99Icon size={size} accentColor={accentColor} strokeColor={strokeColor} handFill={handFill} />;
}
/** 3×3 dot grid for footer menu button. */
export function FooterMenuDotsIcon({ size = 20, color = STROKE }: { size?: number; color?: string }) {
  const dots = [0, 1, 2].flatMap((row) =>
    [0, 1, 2].map((col) => ({ cx: 5 + col * 5, cy: 5 + row * 5 })),
  );

  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      {dots.map((dot, index) => (
        <Circle key={index} cx={dot.cx} cy={dot.cy} r={1.75} fill={color} />
      ))}
    </Svg>
  );
}

/** Exact paths from assets/images/menu.svg */
export function FooterMenuIcon({ size = 32, accentColor = ACCENT, strokeColor = STROKE }: Props) {
  const line = {
    fill: 'none' as const,
    stroke: strokeColor,
    strokeWidth: 7,
    strokeMiterlimit: 10,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 147.4 138.13" fill="none">
      <Line {...line} x1="39.33" y1="15.46" x2="147.4" y2="15.46" />
      <Path
        fill="#FFFFFF"
        d="M15.46,28.92A13.46,13.46,0,1,1,28.92,15.46,13.47,13.47,0,0,1,15.46,28.92Z"
      />
      <Path
        fill={strokeColor}
        d="M15.46,4A11.46,11.46,0,1,1,4,15.46,11.47,11.47,0,0,1,15.46,4m0-4A15.46,15.46,0,1,0,30.92,15.46,15.46,15.46,0,0,0,15.46,0Z"
      />
      <Line {...line} x1="39.33" y1="69.06" x2="147.4" y2="69.06" />
      <Path
        fill={accentColor}
        d="M15.46,82.53A13.47,13.47,0,1,1,28.92,69.06,13.48,13.48,0,0,1,15.46,82.53Z"
      />
      <Path
        fill={strokeColor}
        d="M15.46,57.6A11.47,11.47,0,1,1,4,69.06,11.47,11.47,0,0,1,15.46,57.6m0-4A15.47,15.47,0,1,0,30.92,69.06,15.46,15.46,0,0,0,15.46,53.6Z"
      />
      <Line {...line} x1="39.33" y1="122.66" x2="147.4" y2="122.66" />
      <Circle cx="15.46" cy="122.66" r="13.46" fill="#FFFFFF" />
      <Path
        fill={strokeColor}
        d="M15.46,111.2A11.47,11.47,0,1,1,4,122.66,11.47,11.47,0,0,1,15.46,111.2m0-4a15.47,15.47,0,1,0,15.46,15.46A15.46,15.46,0,0,0,15.46,107.2Z"
      />
    </Svg>
  );
}

/** Person icon — head and shoulders with fill + stroke in one glyph. */
export function MenuPersonIcon({
  size = 24,
  fillColor = ACCENT,
  strokeColor = STROKE,
}: {
  size?: number;
  fillColor?: string;
  strokeColor?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.75" fill={fillColor} stroke={strokeColor} strokeWidth={1.4} />
      <Path
        d="M5.5 20.25c0-3.45 2.9-6.25 6.5-6.25s6.5 2.8 6.5 6.25"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Exact paths from assets/images/sos.svg */
export function FooterSosIcon({ size = 36, accentColor = ACCENT, strokeColor = STROKE }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 154.4 156" fill="none">
      <Path
        d="M127.33,31.73C134,41.17,141.21,47.44,149,60.29c4.72,7.79-.11,27.87-5.63,36.86C135.66,109.71,129,110.5,129,110.5L26.23,113.44"
        fill="none"
        stroke="#333333"
        strokeWidth={7}
        strokeLinejoin="round"
        strokeDasharray="13.75 10 13.75 10 13.75 10"
      />
      <Path
        d="M28.84,113.94S3.5,106.75,3.5,79.63c0-27.78,21.2-25.12,24.4-30.84,2.34-4.17-1-10.82,6-18.53,7.61-8.44,17.43-2.69,20.68-6.43,6.09-7,10.63-13.47,17.48-17.19,9.77-5.29,23.12-2.92,30,0s18.48,14,22.88,21.85"
        fill="none"
        stroke={strokeColor}
        strokeWidth={7}
        strokeMiterlimit={10}
      />
      <Polygon
        points="100.72 70.95 73.9 73.29 98.35 41.72 77.3 25.9 55.71 77.38 51.54 87.31 60.64 87.42 87.95 87.76 58.42 143.96 106.94 84.53 119.34 69.33 100.72 70.95"
        fill={accentColor}
        stroke={strokeColor}
        strokeWidth={2.89}
        strokeMiterlimit={10}
      />
    </Svg>
  );
}
