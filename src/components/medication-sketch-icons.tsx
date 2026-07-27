import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

type IconProps = {
  size?: number;
  /** Include soft rounded tile behind the glyph (as in the sketch). */
  withTile?: boolean;
};

const MINT = '#7DB89A';
const MINT_LIGHT = '#B8E0CB';
const MINT_MID = '#8FCBB0';
const MINT_DEEP = '#6BA88A';
const TILE = '#F4F6F4';
const LINE = '#D5E0D8';
const WHITE = '#FFFFFF';

function Tile({ size }: { size: number }) {
  return <Rect width={size} height={size} rx={size * 0.23} fill={TILE} />;
}

/** Capsule — half mint / half white, diagonal. */
export function PillCapsuleIcon({ size = 48, withTile = true }: IconProps) {
  const s = 96;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${s} ${s}`} fill="none">
      <Defs>
        <LinearGradient id="capMint" x1="28" y1="20" x2="68" y2="72" gradientUnits="userSpaceOnUse">
          <Stop stopColor={MINT_LIGHT} />
          <Stop offset="1" stopColor={MINT} />
        </LinearGradient>
        <LinearGradient id="capWhite" x1="24" y1="28" x2="56" y2="78" gradientUnits="userSpaceOnUse">
          <Stop stopColor={WHITE} />
          <Stop offset="1" stopColor="#E8EEEA" />
        </LinearGradient>
      </Defs>
      {withTile ? <Tile size={s} /> : null}
      <G rotation={-42} origin="48, 48">
        <Rect x="34" y="18" width="28" height="30" rx="14" fill="url(#capMint)" />
        <Rect x="34" y="48" width="28" height="30" rx="14" fill="url(#capWhite)" />
        <Rect x="34" y="46.5" width="28" height="3" fill="#D7E4DC" />
        <Ellipse cx="43" cy="28" rx="5" ry="8" fill={WHITE} opacity={0.45} />
      </G>
    </Svg>
  );
}

/** Blister pack — 2×3 mint tablets. */
export function BlisterPackSketchIcon({ size = 48, withTile = true }: IconProps) {
  const s = 96;
  const pills = [
    [40, 36],
    [56, 36],
    [40, 48],
    [56, 48],
    [40, 60],
    [56, 60],
  ] as const;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${s} ${s}`} fill="none">
      <Defs>
        <LinearGradient id="pack" x1="24" y1="20" x2="72" y2="76" gradientUnits="userSpaceOnUse">
          <Stop stopColor={WHITE} />
          <Stop offset="1" stopColor="#E8EEEA" />
        </LinearGradient>
        <RadialGradient id="pill" cx="50%" cy="35%" rx="65%" ry="65%">
          <Stop stopColor="#C5EBD6" />
          <Stop offset="1" stopColor={MINT} />
        </RadialGradient>
      </Defs>
      {withTile ? <Tile size={s} /> : null}
      <G rotation={-18} origin="48, 48">
        <Rect x="28" y="22" width="40" height="52" rx="8" fill="url(#pack)" stroke={LINE} strokeWidth="1.5" />
        {pills.map(([cx, cy]) => (
          <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="6.2" fill="url(#pill)" />
        ))}
        {pills.map(([cx, cy]) => (
          <Circle key={`h-${cx}-${cy}`} cx={cx - 2} cy={cy - 2} r="2" fill={WHITE} opacity={0.5} />
        ))}
      </G>
    </Svg>
  );
}

/** Medicine bottle with cross label. */
export function PillBottleIcon({ size = 48, withTile = true }: IconProps) {
  const s = 96;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${s} ${s}`} fill="none">
      <Defs>
        <LinearGradient id="bottle" x1="30" y1="24" x2="68" y2="80" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#C5EBD6" />
          <Stop offset="0.55" stopColor={MINT_MID} />
          <Stop offset="1" stopColor={MINT_DEEP} />
        </LinearGradient>
        <RadialGradient id="dot" cx="40%" cy="35%" rx="65%" ry="65%">
          <Stop stopColor="#D8F2E4" />
          <Stop offset="1" stopColor={MINT} />
        </RadialGradient>
      </Defs>
      {withTile ? <Tile size={s} /> : null}
      <Rect x="36" y="16" width="24" height="12" rx="3" fill="#F7FAF8" stroke={LINE} strokeWidth="1" />
      <Path d="M34 24h28v4c0 1.5-1 2.5-2.5 2.5H36.5C35 30.5 34 29.5 34 28v-4z" fill="#EEF3F0" />
      <Path
        d="M30 32c0-2 1.5-3.5 3.5-3.5h29c2 0 3.5 1.5 3.5 3.5v40c0 6-5 11-11 11H41c-6 0-11-5-11-11V32z"
        fill="url(#bottle)"
        opacity={0.92}
      />
      <Rect x="36" y="42" width="24" height="22" rx="3" fill={WHITE} />
      <Path d="M45.5 48.5h5v4.5h4.5v5H50.5v4.5h-5V58H41v-5h4.5v-4.5z" fill={MINT} />
      <Circle cx="38" cy="70" r="2.4" fill="url(#dot)" />
      <Circle cx="45" cy="73" r="2.2" fill="url(#dot)" />
      <Circle cx="52" cy="69.5" r="2.3" fill="url(#dot)" />
      <Circle cx="58" cy="72.5" r="2.1" fill="url(#dot)" />
      <Circle cx="41" cy="75.5" r="1.8" fill="url(#dot)" />
      <Ellipse cx="40" cy="40" rx="4" ry="10" fill={WHITE} opacity={0.28} />
    </Svg>
  );
}

/** Calendar with intake checkmarks + capsule badge. */
export function CalendarPillIcon({ size = 48, withTile = true }: IconProps) {
  const s = 96;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${s} ${s}`} fill="none">
      <Defs>
        <LinearGradient id="calHead" x1="24" y1="18" x2="72" y2="36" gradientUnits="userSpaceOnUse">
          <Stop stopColor={MINT_LIGHT} />
          <Stop offset="1" stopColor={MINT} />
        </LinearGradient>
        <LinearGradient id="badgeMint" x1="0" y1="0" x2="1" y2="1">
          <Stop stopColor={MINT_LIGHT} />
          <Stop offset="1" stopColor={MINT} />
        </LinearGradient>
      </Defs>
      {withTile ? <Tile size={s} /> : null}
      <Rect x="22" y="22" width="48" height="52" rx="8" fill={WHITE} stroke={LINE} strokeWidth="1.2" />
      <Path d="M22 30c0-4.4 3.6-8 8-8h32c4.4 0 8 3.6 8 8v10H22V30z" fill="url(#calHead)" />
      <Circle cx="34" cy="22" r="3.2" fill="#F7FAF8" stroke="#C5D2CA" strokeWidth="1.2" />
      <Circle cx="58" cy="22" r="3.2" fill="#F7FAF8" stroke="#C5D2CA" strokeWidth="1.2" />
      <Path
        d="M34 48l2.2 2.2 4.2-4.5"
        stroke={MINT}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M50 48l2.2 2.2 4.2-4.5"
        stroke={MINT}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="32" y="56" width="6" height="5" rx="1.2" fill="#E8EEEA" />
      <Rect x="42" y="56" width="6" height="5" rx="1.2" fill="#E8EEEA" />
      <G transform="translate(58, 58)">
        <Circle cx="10" cy="10" r="12" fill={WHITE} stroke={LINE} strokeWidth="1.5" />
        <G rotation={-40} origin="10, 10">
          <Rect x="6.5" y="2.5" width="7" height="7.5" rx="3.5" fill="url(#badgeMint)" />
          <Rect x="6.5" y="10" width="7" height="7.5" rx="3.5" fill={TILE} />
        </G>
      </G>
    </Svg>
  );
}

/** Mint notification bell with ringing arcs. */
export function NotificationBellIcon({ size = 48, withTile = true }: IconProps) {
  const s = 96;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${s} ${s}`} fill="none">
      <Defs>
        <LinearGradient id="bellGrad" x1="30" y1="18" x2="68" y2="78" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#C5EBD6" />
          <Stop offset="0.45" stopColor={MINT_MID} />
          <Stop offset="1" stopColor={MINT_DEEP} />
        </LinearGradient>
      </Defs>
      {withTile ? <Tile size={s} /> : null}
      <Path
        d="M48 18c-1.8 0-3.2 1.4-3.2 3.2v2.1c-9.2 1.6-16 9.6-16 19.2v12.4c0 2.4-1 4.7-2.7 6.3l-2.4 2.3c-1.3 1.2-.4 3.5 1.4 3.5h45.8c1.8 0 2.7-2.3 1.4-3.5l-2.4-2.3c-1.7-1.6-2.7-3.9-2.7-6.3V42.5c0-9.6-6.8-17.6-16-19.2v-2.1C51.2 19.4 49.8 18 48 18z"
        fill="url(#bellGrad)"
      />
      <Path d="M41 70c1.6 3.2 4 5 7 5s5.4-1.8 7-5" stroke="#5F977C" strokeWidth="3" strokeLinecap="round" />
      <Ellipse cx="42" cy="34" rx="5" ry="10" fill={WHITE} opacity={0.32} />
      <Path
        d="M24 34c-3.5 3-5.5 7.2-5.5 12"
        stroke={MINT_MID}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M19 30c-5 4.2-7.8 10-7.8 16.2"
        stroke="#A8D5B8"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity={0.85}
      />
      <Path
        d="M72 34c3.5 3 5.5 7.2 5.5 12"
        stroke={MINT_MID}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M77 30c5 4.2 7.8 10 7.8 16.2"
        stroke="#A8D5B8"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity={0.85}
      />
    </Svg>
  );
}
