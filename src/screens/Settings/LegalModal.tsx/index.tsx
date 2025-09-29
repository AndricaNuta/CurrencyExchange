import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, ScrollView, Pressable, StyleSheet, Animated, Easing, Linking } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { alpha } from '../../../theme/tokens';

type Props = {
  visible: boolean;
  title: string;
  content: string;
  onClose: () => void;
  primaryLabel?: string;
  onPrimary?: () => void;
};

const urlOrEmailRE = /(\bhttps?:\/\/[^\s)]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;

function AutoLinkedText({
  text
}: { text: string }) {
  const parts = text.split(urlOrEmailRE);
  return (
    <Text style={styles.body}>
      {parts.map((part, i) => {
        const isLink = urlOrEmailRE.test(part);
        // reset lastIndex because of .test with /g
        urlOrEmailRE.lastIndex = 0;

        if (!isLink) return <Text key={i}>{part}</Text>;

        const href = part.includes('@') && !part.startsWith('http') ? `mailto:${part}` : part;
        return (
          <Text
            key={i}
            style={styles.link}
            accessibilityRole="link"
            onPress={() => Linking.openURL(href)}
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

export const LegalDialog: React.FC<Props> = ({
  visible,
  title,
  content,
  onClose,
  primaryLabel = 'Got it',
  onPrimary,
}) => {
  const t = useTheme();
  const scale = useRef(new Animated.Value(0.96)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 16,
          stiffness: 220,
          mass: 0.6,
          useNativeDriver: true
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true
        }),
        Animated.timing(scale, {
          toValue: 0.96,
          duration: 120,
          useNativeDriver: true
        }),
      ]).start();
    }
  }, [visible, opacity, scale]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop (brand-tinted, not pure black) */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: alpha(t.colors.text, t.scheme === 'dark' ? 0.28 : 0.22)
          },
        ]}
      />

      <Animated.View
        style={[
          styles.centerWrap,
          {
            opacity,
            transform: [{
              scale
            }]
          },
        ]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: t.colors.card,
              borderColor: alpha(t.colors.text, 0.06),
              shadowColor: '#000',
            },
          ]}
        >

          {/* Top accent bar */}
          <View style={[styles.accent, {
            backgroundColor: alpha(t.colors.tint, 0.18)
          }]} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, {
              color: t.colors.text
            }]}>{title}</Text>
            {/* <Pressable onPress={onClose} hitSlop={10} style={styles.close}>
              <Text style={[styles.closeTxt, {
                color: t.colors.tint
              }]}>Close</Text>
            </Pressable>*/}
          </View>

          {/* Divider */}
          <View style={[styles.divider, {
            backgroundColor: alpha(t.colors.text, 0.06)
          }]} />

          {/* Content */}
          <ScrollView
            style={{
              maxHeight: 420
            }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 8
            }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.body, {
              color: alpha(t.colors.text, 0.9)
            }]}>{typeof content === 'string' ? <AutoLinkedText text={content} /> : content}</Text>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            {/*  <Pressable onPress={onClose} style={[styles.ghostBtn, {
              backgroundColor: alpha(t.colors.text, 0.06)
            }]}>
              <Text style={[styles.ghostTxt, {
                color: t.colors.text
              }]}>Cancel</Text>
            </Pressable>*/}
            <Pressable
              onPress={onPrimary ?? onClose}
              style={[styles.primaryBtn, {
                backgroundColor: t.colors.tint
              }]}
            >
              <Text style={[styles.primaryTxt, {
                color: '#fff'
              }]}>{primaryLabel}</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 22,               // more “puffy”
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    // soft lift
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8
    },
    elevation: 6,

  },
  accent: {
    height: 10,
    width: '100%',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '800'
  },
  close: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10
  },
  closeTxt: {
    fontSize: 15,
    fontWeight: '700'
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%'
  },
  body: {
    fontSize: 15,
    lineHeight: 22.5
  },
  actions: {
    padding: 12,
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  ghostBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  ghostTxt: {
    fontSize: 15,
    fontWeight: '700'
  },
  primaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryTxt: {
    fontSize: 15,
    fontWeight: '800'
  },
  link: {
    textDecorationLine: 'underline'
  },
});
