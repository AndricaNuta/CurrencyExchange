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
    const base = {
      width: 14,
      height: 14,
      backgroundColor: bg,
      borderColor: border
    } as const;
    const map = {
      bottom: {
        transform: [{
          rotate: '45deg'
        }],
        position: 'absolute',
        bottom: -7,
        alignSelf: 'center',
        borderLeftWidth: 1,
        borderBottomWidth: 1
      },
      top: {
        transform: [{
          rotate: '45deg'
        }],
        position: 'absolute',
        top: -7,
        alignSelf: 'center',
        borderTopWidth: 1,
        borderRightWidth: 1
      },
      left: {
        transform: [{
          rotate: '45deg'
        }],
        position: 'absolute',
        left: -7,
        top: 14,
        borderLeftWidth: 1,
        borderTopWidth: 1
      },
      right: {
        transform: [{
          rotate: '45deg'
        }],
        position: 'absolute',
        right: -7,
        top: 14,
        borderRightWidth: 1,
        borderBottomWidth: 1
      },
    } as const;
    // @ts-ignore
    return <View style={[base, map[arrowPosition]]} />;
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
