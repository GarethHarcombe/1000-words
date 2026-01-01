
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, ViewStyle, Image } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Colors from '@/constants/Colors';

const townImages: Record<string, any> = {
  '1': require('@/assets/images/good-icons/CHURCH.png'),
  '2': require('@/assets/images/town-icons/armchair.png'),
  '3': require('@/assets/images/town-icons/love_spoons.png'),
  '4': require('@/assets/images/town-icons/llanfairpg.png'),
  '5': require('@/assets/images/town-icons/welsh_cakes.png'),
  '6': require('@/assets/images/town-icons/rugby.png'),
  '7': require('@/assets/images/town-icons/cottage.png'),
  '8': require('@/assets/images/town-icons/coastal_path.png'),
  '9': require('@/assets/images/town-icons/braces.png'),
  '10': require('@/assets/images/town-icons/snowdonia.png'),
  '11': require('@/assets/images/town-icons/tenby.png'),
  '12': require('@/assets/images/town-icons/music.png'),
  '13': require('@/assets/images/town-icons/gelert.png'),
  '14': require('@/assets/images/town-icons/dafard.png'),
  default: require('@/assets/images/adaptive-icon.png'),
};

type TownProgressProps = {
  wordsSeen: number;
  wordsPracticed: number;
  wordsMastered: number;
  totalWords: number;
  groupKey: string;

  // Optional customisation
  size?: number;                 // diameter
  showLabel?: boolean;           // centre text
  showRings?: boolean;           // show seen + mastered as rings
  style?: ViewStyle;

  // Optional press handlers
  onPress?: () => void;
  onInfoPress?: () => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (Math.PI / 180) * angleDeg;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

/**
 * Creates an SVG path for a filled sector (pie slice) from startAngle to endAngle.
 * Angles are in degrees where 0 is at 3 o'clock; we will pass -90 as the top.
 */
function sectorPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

/**
 * Creates an SVG path for an arc (ring stroke) from startAngle to endAngle.
 */
function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
  ].join(' ');
}

export default function TownProgress({
  wordsSeen,
  wordsPracticed,
  wordsMastered,
  totalWords,
  groupKey,
  size = 69,
  showLabel = true,
  showRings = false,
  style,
  onPress,
  onInfoPress,
}: TownProgressProps) {
  const safeTotal = Math.max(1, totalWords);

  const practicedRaw = wordsPracticed / safeTotal;
  const seenRaw = wordsSeen / safeTotal;
  const masteredRaw = wordsMastered / safeTotal;

  const scoreRaw = (wordsSeen + wordsPracticed  + 1) / (safeTotal * 2 + 1);

  const practiced = clamp(scoreRaw, 0, 1);
  const seen = clamp(seenRaw, 0, 1);
  const mastered = clamp(masteredRaw, 0, 1);

  // Simple Animated.Value to let you "play" with smooth changes
  const anim = useRef(new Animated.Value(practiced)).current;
  const [animatedProgress, setAnimatedProgress] = useState(practiced);

  useEffect(() => {
    const id = anim.addListener(({ value }) => setAnimatedProgress(value));
    Animated.timing(anim, {
      toValue: practiced,
      duration: 350,
      useNativeDriver: false, // we are driving SVG path via JS
    }).start();
    return () => {
      anim.removeListener(id);
    };
  }, [anim, practiced]);

  const r = size / 2;
  const cx = r;
  const cy = r;

  // Leave a tiny inset so the circle looks crisp
  const fillRadius = r - 2;

  // Start at top (-90 deg) and move clockwise by +360
  const startAngle = -90;

  const practicedEndAngle = startAngle + animatedProgress * 360;
  const seenEndAngle = startAngle + seen * 360;
  const masteredEndAngle = startAngle + mastered * 360;

  const paths = useMemo(() => {
    const p: {
      practicedSector?: string;
      seenArc?: string;
      masteredArc?: string;
    } = {};

    if (animatedProgress <= 0) {
      p.practicedSector = undefined;
    } else if (animatedProgress >= 0.9999) {
      p.practicedSector = 'FULL';
    } else {
      p.practicedSector = sectorPath(cx, cy, fillRadius, startAngle, practicedEndAngle);
    }

    if (showRings) {
      if (seen > 0) p.seenArc = arcPath(cx, cy, fillRadius - 8, startAngle, seenEndAngle);
      if (mastered > 0) p.masteredArc = arcPath(cx, cy, fillRadius - 16, startAngle, masteredEndAngle);
    }

    return p;
  }, [animatedProgress, cx, cy, fillRadius, practicedEndAngle, seen, seenEndAngle, mastered, masteredEndAngle, showRings]);

  const backgroundFill = Colors.light.backgroundGrey;
  const practicedColor = Colors.light.upperButtonGradient;
  const ringSeen = Colors.light.button;
  const ringMastered = Colors.light.button;
  const labelColor = Colors.light.text;

  const imgSize = size * 0.5;

  const content = (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image source={townImages[groupKey]} style={{ position: 'absolute', width: imgSize, height: imgSize }} resizeMode="contain" />

      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="practicedGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={practicedColor} stopOpacity="0.55" />
            <Stop offset="1" stopColor={practicedColor} stopOpacity="0.95" />
          </LinearGradient>
        </Defs>

        {/* Base circle */}
        <Circle cx={cx} cy={cy} r={fillRadius} fill={backgroundFill} />

        {/* Practiced fill */}
        {paths.practicedSector === 'FULL' ? (
          <Circle cx={cx} cy={cy} r={fillRadius} fill="url(#practicedGrad)" />
        ) : paths.practicedSector ? (
          <Path d={paths.practicedSector} fill="url(#practicedGrad)" />
        ) : null}

        {/* Optional rings for additional states */}
        {showRings && paths.seenArc ? (
          <Path d={paths.seenArc} stroke={ringSeen} strokeWidth={6} strokeLinecap="round" fill="none" />
        ) : null}

        {showRings && paths.masteredArc ? (
          <Path d={paths.masteredArc} stroke={ringMastered} strokeWidth={6} strokeLinecap="round" fill="none" />
        ) : null}

        {/* Thin outline for crisp edge */}
        <Circle cx={cx} cy={cy} r={fillRadius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={2} />
      </Svg>

      {showLabel ? (
        <View style={styles.centerLabel} pointerEvents="none">
          <Text style={[styles.labelTop, { color: labelColor }]}>
            {Math.round(practiced * 100)}%
          </Text>
          <Text style={[styles.labelBottom, { color: labelColor }]}>
            {wordsPracticed}/{totalWords}
          </Text>
        </View>
      ) : null}

      {onInfoPress ? (
        <TouchableOpacity style={styles.infoButton} onPress={onInfoPress} accessibilityLabel="Progress info">
          <Text style={{ fontSize: 18, color: labelColor }}>i</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelTop: {
    fontSize: 18,
    fontWeight: '700',
  },
  labelBottom: {
    marginTop: 2,
    fontSize: 12,
    opacity: 0.75,
  },
  infoButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
});
