import Svg, { Path } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/** Contour water drops + waves from assets/images/watdrops.svg */
export function WatDropsIcon({ size = 28, color = '#8A9BD2', strokeWidth = 22.68 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 529.32 428.22" fill="none">
      <Path
        d="M7,281.63l27-7.72a155.85,155.85,0,0,1,78.79-1.77l50.69,12a156,156,0,0,0,69.1.66L290,272.38a155.89,155.89,0,0,1,65.3-.2l63.62,13.44a155.93,155.93,0,0,0,63.82.12l39.57-8.2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeMiterlimit={10}
        fill="none"
      />
      <Path
        d="M7,349.2l27-7.71a155.85,155.85,0,0,1,78.79-1.78l50.69,12a155.87,155.87,0,0,0,69.1.66L290,340a155.73,155.73,0,0,1,65.3-.19l63.62,13.43a155.93,155.93,0,0,0,63.82.12l39.57-8.2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeMiterlimit={10}
        fill="none"
      />
      <Path
        d="M7,409.53l27-7.71A156,156,0,0,1,112.86,400l50.69,12a155.87,155.87,0,0,0,69.1.66L290,400.28a155.89,155.89,0,0,1,65.3-.19l63.62,13.43a155.93,155.93,0,0,0,63.82.12l39.57-8.19"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeMiterlimit={10}
        fill="none"
      />
      <Path
        d="M121.64,164.32c0,41.46-24.69,55.15-55.15,55.15s-55.15-13.69-55.15-55.15S66.49,23.39,66.49,23.39,121.64,122.87,121.64,164.32Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeMiterlimit={10}
        fill="none"
      />
      <Path
        d="M319.81,164.32c0,41.46-24.69,55.15-55.15,55.15s-55.15-13.69-55.15-55.15S264.66,23.39,264.66,23.39,319.81,122.87,319.81,164.32Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeMiterlimit={10}
        fill="none"
      />
      <Path
        d="M518,164.32c0,41.46-24.69,55.15-55.15,55.15s-55.15-13.69-55.15-55.15S462.83,23.39,462.83,23.39,518,122.87,518,164.32Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeMiterlimit={10}
        fill="none"
      />
    </Svg>
  );
}
