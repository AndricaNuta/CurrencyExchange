import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export type AppTipContentProps = {
  title?: string;
  text: string;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  maxWidth?: number;
  width?:number;
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
  showArrow = true,
  arrowPosition = 'bottom',
}) => {
  const t = useTheme();
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
      Animated.timing(scale, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }),
    ]).start();
  }, []);

  const bg = t.scheme === 'dark' ? 'rgba(20,20,26,0.98)' : t.colors.surface;
  const border = t.colors.border;
  const textColor = t.colors.text;
  const subColor = t.colors.subtext;

  const Arrow = () => {
    if (!showArrow) return null;

    // triangle sizes (tweak if you like)
    const TRI_W = 10;
    const TRI_H = 8;

    const wrappers = {
      bottom: {
        position: 'absolute',
        bottom: -TRI_H,
        alignSelf: 'center' as const
      },
      top:    {
        position: 'absolute',
        top:    -TRI_H,
        alignSelf: 'center' as const
      },
      left:   {
        position: 'absolute',
        left:   -TRI_H,
        top: 14
      },
      right:  {
        position: 'absolute',
        right:  -TRI_H,
        top: 14
      },
    };

    if (arrowPosition === 'bottom') {
      return (
        <View style={wrappers.bottom}>
          {/* border triangle (slightly bigger, behind) */}
          <View style={{
            position: 'absolute',
            bottom: -1, // tiny offset to create a crisp border seam
            width: 0,
            height: 0,
            borderLeftWidth: TRI_W + 1,
            borderRightWidth: TRI_W + 1,
            borderTopWidth: TRI_H + 1,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: border,
          }} />
          {/* fill triangle (front) */}
          <View style={{
            width: 0,
            height: 0,
            borderLeftWidth: TRI_W,
            borderRightWidth: TRI_W,
            borderTopWidth: TRI_H,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: bg,
          }} />
        </View>
      );
    }

    if (arrowPosition === 'top') {
      return (
        <View style={wrappers.top}>
          <View style={{
            position: 'absolute',
            top: -1,
            width: 0,
            height: 0,
            borderLeftWidth: TRI_W + 1,
            borderRightWidth: TRI_W + 1,
            borderBottomWidth: TRI_H + 1,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: border,
          }} />
          <View style={{
            width: 0,
            height: 0,
            borderLeftWidth: TRI_W,
            borderRightWidth: TRI_W,
            borderBottomWidth: TRI_H,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: bg,
          }} />
        </View>
      );
    }

    // left/right (optional)
    // Similar idea with borderTopWidth/borderBottomWidth and borderRight/LeftColor.

    return null;
  };

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{
          scale
        }],
        maxWidth,
        backgroundColor: bg,
        borderRadius: 22,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 16,
        shadowOffset: {
          width: 0,
          height: 10
        },
        elevation: 8,
      }}
      accessibilityRole="alert"
    >
      <Arrow />
      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: border
      }}>
        {!!title && (
          <Text style={{
            color: textColor,
            fontSize: 16,
            fontWeight: '800',
            marginBottom: 6
          }}>
            {title}
          </Text>
        )}
        <Text style={{
          color: subColor,
          fontSize: 14,
          lineHeight: 20
        }}>
          {text}
        </Text>

        {(primaryLabel || secondaryLabel) && (
          <View style={{
            flexDirection: 'row',
            gap: 10,
            marginTop: 12
          }}>
            {!!primaryLabel && (
              <Pressable
                onPress={onPrimaryPress}
                accessibilityRole="button"
                accessibilityLabel={primaryLabel}
                style={({
                  pressed
                }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 14,
                  backgroundColor: pressed ? t.colors.primaryMuted : t.colors.primary,
                })}
                android_ripple={{
                  color: t.colors.primaryMuted
                }}
                hitSlop={6}
              >
                <Text style={{
                  color: t.colors.onPrimary,
                  fontWeight: '800'
                }}>{primaryLabel}</Text>
              </Pressable>
            )}
            {!!secondaryLabel && (
              <Pressable
                onPress={onSecondaryPress}
                accessibilityRole="button"
                accessibilityLabel={secondaryLabel}
                style={({
                  pressed
                }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: border,
                  backgroundColor: pressed
                    ? (t.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')
                    : 'transparent',
                })}
                hitSlop={6}
              >
                <Text style={{
                  color: textColor,
                  fontWeight: '700'
                }}>{secondaryLabel}</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
};
