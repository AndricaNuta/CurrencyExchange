import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { makeStyles } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';

type Props = {
  width?: number;
  height?: number;
  data: number[];        // e.g. last 7–30 daily rates
  tint: string;          // theme.colors.tint
  strokeWidth?: number;
  rounded?: boolean;
};

const useStyles = makeStyles((_t) =>
  StyleSheet.create({
    wrap: {
      overflow: 'hidden',
      borderRadius: 12
    },
  })
);

export const Sparkline: React.FC<Props> = ({
  width = 260,
  height = 70,
  data,
  tint,
  strokeWidth = 2,
  rounded = true,
}) => {
  const s = useStyles();

  // guard
  if (!data || data.length < 2) {
    return <View style={[s.wrap, {
      width,
      height,
      backgroundColor: 'transparent'
    }]} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return {
      x,
      y
    };
  });

  const d = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  const fillPath = `${d} L ${points[points.length - 1].x} ${height} L 0 ${height} Z`;

  return (
    <View style={[s.wrap, {
      width,
      height
    }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={alpha(tint, 0.28)} />
            <Stop offset="1" stopColor={alpha(tint, 0.02)} />
          </LinearGradient>
        </Defs>

        {/* soft fill */}
        <Path d={fillPath} fill="url(#grad)" />

        {/* line */}
        <Path
          d={d}
          stroke={tint}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap={rounded ? 'round' : 'butt'}
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};
