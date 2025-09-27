import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { makeStyles } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';

const useStyles = makeStyles(t => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: alpha(t.colors.text, t.scheme === 'dark' ? 0.25 : 0.12)
  },
  cardWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 110,
    alignItems: 'center'
  },
  card: {
    width: 260,
    borderRadius: 16,
    backgroundColor: t.colors.card,
    ...t.shadow.ios,
    ...t.shadow.android,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  rowPressed: {
    backgroundColor: t.scheme==='dark' ? alpha('#FFFFFF',0.06) : alpha('#111827',0.06)
  },
  icon: {
    width: 26,
    fontSize: 18
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: t.colors.text
  },
}));

export default function ScanActionsPopover(props: {
  visible: boolean; onClose: () => void; onLive: () => void; onCamera: () => void; onGallery: () => void;
}) {
  const {
    visible, onClose, onLive, onCamera, onGallery
  } = props;
  const s = useStyles();
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}><View /></Pressable>
      <View style={s.cardWrap}>
        <View style={s.card}>
          {[
            {
              icon: '📡',
              label: 'Scan live',
              onPress: onLive
            },
            {
              icon: '📷',
              label: 'Take photo',
              onPress: onCamera
            },
            {
              icon: '🖼️',
              label: 'Add image',
              onPress: onGallery
            },
          ].map(({
            icon, label, onPress
          }) => (
            <Pressable
              key={label}
              onPress={() => { onClose(); onPress(); }}
              style={({
                pressed
              }) => [s.row, pressed && s.rowPressed]}
            >
              <Text style={s.icon}>{icon}</Text>
              <Text style={s.text}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}
