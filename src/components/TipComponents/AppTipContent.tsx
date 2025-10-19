import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing, Platform } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';
import { useStyles } from './styles';

export type AppTipContentProps = {
  title?: string;
  text: string;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  maxWidth?: number;
  width?: number;
  showArrow?: boolean;
  arrowPosition?: 'top' | 'bottom' | 'left' | 'right';
};

export const AppTipContent: React.FC<AppTipContentProps> = ({
  title,
  text,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
  maxWidth = 300,
  width,
  showArrow = true,
  arrowPosition = 'bottom',
}) => {
  const t = useTheme();
  const s = useStyles();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }),
      Animated.timing(scale,   {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }),
    ]).start();
  }, [opacity, scale]);

  const bg       = t.colors.card;
  const border   = t.colors.border;
  const titleCol = t.colors.text;
  const textCol  = t.colors.subtext;
  const tint     = t.colors.tint;
  const onTint   = t.colors.onTint;

  const Arrow = () => {
    if (!showArrow) return null;
    const TRI_W = 10, TRI_H = 8;

    const wrap: Record<'top'|'bottom'|'left'|'right', object> = {
      bottom: {
        position: 'absolute',
        bottom: -TRI_H,
        alignSelf: 'center'
      },
      top:    {
        position: 'absolute',
        top:    -TRI_H,
        alignSelf: 'center'
      },
      left:   {
        position: 'absolute',
        left:   -TRI_H,
        top: 16
      },
      right:  {
        position: 'absolute',
        right:  -TRI_H,
        top: 16
      },
    };

    if (arrowPosition === 'bottom' || arrowPosition === 'top') {
      const isBottom = arrowPosition === 'bottom';
      return (
        <View style={wrap[arrowPosition]}>
          {/* border seam */}
          <View
            style={{
              position: 'absolute',
              [isBottom ? 'bottom' : 'top']: -1,
              width: 0,
              height: 0,
              borderLeftWidth: TRI_W + 1,
              borderRightWidth: TRI_W + 1,
              [isBottom ? 'borderTopWidth' : 'borderBottomWidth']: TRI_H + 1,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              [isBottom ? 'borderTopColor' : 'borderBottomColor']: border,
            } as any}
          />
          {/* fill */}
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: TRI_W,
              borderRightWidth: TRI_W,
              [isBottom ? 'borderTopWidth' : 'borderBottomWidth']: TRI_H,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              [isBottom ? 'borderTopColor' : 'borderBottomColor']: bg,
            } as any}
          />
        </View>
      );
    }

    // left / right
    const isRight = arrowPosition === 'right';
    return (
      <View style={wrap[arrowPosition]}>
        {/* border */}
        <View
          style={{
            position: 'absolute',
            [isRight ? 'right' : 'left']: -1,
            width: 0,
            height: 0,
            borderTopWidth: TRI_W + 1,
            borderBottomWidth: TRI_W + 1,
            [isRight ? 'borderLeftWidth' : 'borderRightWidth']: TRI_H + 1,
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
            [isRight ? 'borderLeftColor' : 'borderRightColor']: border,
          } as any}
        />
        {/* fill */}
        <View
          style={{
            width: 0,
            height: 0,
            borderTopWidth: TRI_W,
            borderBottomWidth: TRI_W,
            [isRight ? 'borderLeftWidth' : 'borderRightWidth']: TRI_H,
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
            [isRight ? 'borderLeftColor' : 'borderRightColor']: bg,
          } as any}
        />
      </View>
    );
  };

  return (
    <Animated.View
      accessibilityRole="alert"
      style={[
        s.container,
        Platform.select({
          ios: t.shadow.ios,
          android: t.shadow.android
        }),
        {
          opacity,
          transform: [{
            scale
          }],
          maxWidth,
          ...(width ? {
            width
          } : null),
          backgroundColor: bg
        },
      ]}
    >
      <Arrow />
      <View style={[s.inner, {
        borderColor: border
      }]}>
        {!!title && (
          <Text
            style={[
              s.title,
              {
                color: titleCol,
                fontSize: t.typography.title.size,
                lineHeight: t.typography.title.lineHeight,
                fontWeight: t.typography.title.weight as any
              },
            ]}
          >
            {title}
          </Text>
        )}

        <Text
          style={[
            s.text,
            {
              color: textCol,
              fontSize: t.typography.body.size,
              lineHeight: t.typography.body.lineHeight,
              fontWeight: t.typography.body.weight as any
            },
          ]}
        >
          {text}
        </Text>

        {(primaryLabel || secondaryLabel) && (
          <View style={s.actions}>
            {!!primaryLabel && (
              <Pressable
                onPress={onPrimaryPress}
                accessibilityRole="button"
                accessibilityLabel={primaryLabel}
                style={({
                  pressed
                }) => [
                  s.primaryBtn,
                  {
                    backgroundColor: pressed ? alpha(tint, 0.85) : tint
                  },
                ]}
                android_ripple={{
                  color: alpha(tint, 0.2)
                }}
                hitSlop={6}
              >
                <Text style={[s.primaryLabel, {
                  color: onTint
                }]}>{primaryLabel}</Text>
              </Pressable>
            )}

            {!!secondaryLabel && (
              <Pressable
                onPress={onSecondaryPress}
                accessibilityRole="button"
                accessibilityLabel={secondaryLabel}
                style={({
                  pressed
                }) => [
                  s.secondaryBtn,
                  {
                    borderColor: border,
                    backgroundColor: pressed
                      ? (t.scheme === 'dark' ? alpha('#FFFFFF', 0.06) : alpha('#000000', 0.04))
                      : 'transparent',
                  },
                ]}
                hitSlop={6}
              >
                <Text style={[s.secondaryLabel, {
                  color: titleCol
                }]}>{secondaryLabel}</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
};
