import Svg, { Path } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/** Crescent moon from assets/images/icmoonday2.svg */
export function IcMoonDayIcon({ size = 28, color = '#6F63C4', strokeWidth = 2 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 27.45 28.6" fill="none">
      <Path
        d="M26.45,21.23A13.81,13.81,0,0,1,9.56,1,13.82,13.82,0,1,0,26.45,21.23Z"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
