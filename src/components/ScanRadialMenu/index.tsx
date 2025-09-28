import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { makeStyles, useTheme as useAppTheme } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';
import { Camera, Image as ImageIcon, Radio } from 'react-native-feather';

type Action = {
  key: 'live' | 'camera' | 'gallery';
  onPress: () => void;
  icon: React.ReactNode;
  angleDeg: number;   // where it flies out on the arc
};

export default function ScanRadialMenu(props: {
  visible: boolean;
  onClose: () => void;
  onLive: () => void;
  onCamera: () => void;
  onGallery: () => void;
  anchorBottom: number; // distance from bottom (to sit above your curved bar)
}) {
  const {
    visible, onClose, onLive, onCamera, onGallery, anchorBottom
  } = props;
  const s = useStyles();
  const t = useAppTheme();

  // master progress for open/close
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: 260,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [visible, progress]);

  // actions arranged on a 100–120px radius arc
  const actions: Action[] = useMemo(() => ([
    {
      key: 'live',
      onPress: onLive,
      icon: <Radio width={22} height={22} color={t.colors.text}/>,
      angleDeg: -150
    },
    {
      key: 'camera',
      onPress: onCamera,
      icon: <Camera width={22} height={22} color={t.colors.text}/>,
      angleDeg: -90
    },
    {
      key: 'gallery',
      onPress: onGallery,
      icon: <ImageIcon width={22} height={22} color={t.colors.text}/>,
      angleDeg: -30
    },
  ]), [onLive, onCamera, onGallery, t.colors.text]);

  // Backdrop fade
  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, t.scheme === 'dark' ? 0.25 : 0.12],
  });

  return (
    <View pointerEvents={visible ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
      {/* Backdrop */}
      <Animated.View style={[s.backdrop, {
        opacity: backdropOpacity
      }]} />
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      {/* Action buttons anchored above bottom-center FAB */}
      <View style={[s.anchor, {
        bottom: anchorBottom
      }]}>
        {actions.map((a, idx) => {
          const radius = 100; // distance from FAB center
          const rad = (a.angleDeg * Math.PI) / 180;
          const tx = Math.cos(rad) * radius;
          const ty = Math.sin(rad) * radius;

          const translateX = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, tx]
          });
          const translateY = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, ty]
          });
          const scale = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.6, 1]
          });
          const opacity = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1]
          });

          return (
            <Animated.View
              key={a.key}
              style={[
                s.actionWrap,
                {
                  transform: [{
                    translateX
                  }, {
                    translateY
                  }, {
                    scale
                  }],
                  opacity,
                },
              ]}
            >
              <Pressable
                onPress={() => { onClose(); a.onPress(); }}
                accessibilityRole="button"
                accessibilityLabel={a.key}
                style={({
                  pressed
                }) => [
                  s.actionBtn,
                  pressed && {
                    transform: [{
                      scale: 0.96
                    }]
                  },
                ]}
                hitSlop={12}
              >
                {a.icon}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: alpha(t.colors.text, 1),
  },
  anchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  actionWrap: {
    position: 'absolute',
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.border,
    ...t.shadow.ios,
    ...t.shadow.android,
  },
}));
