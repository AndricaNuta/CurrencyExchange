import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { makeStyles } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';
import { Camera, Image as ImageIcon, Radio } from 'react-native-feather';

const useStyles = makeStyles(t => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: alpha(t.colors.text, t.scheme === 'dark' ? 0.25 : 0.12)
  },
  cardWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 130,
    alignItems: 'center'
  },
  card: {
    width: 200,
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
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  rowPressed: {
    backgroundColor: t.scheme==='dark'
      ? alpha('#FFFFFF',0.06)
      : alpha('#111827',0.06)
  },
  iconWrap: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: t.colors.text
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.border,
    marginHorizontal: 15,
  },
}));

export default function ScanActionsPopover(props: {
  visible: boolean; onClose: () => void; onLive: () => void; onCamera: () => void; onGallery: () => void;
}) {
  const {
    visible, onClose, onLive, onCamera, onGallery
  } = props;
  const s = useStyles();
  const iconColor = s.text.color as string;

  const actions = [
    {
      key: 'live',
      label: 'Scan live',
      onPress: onLive,
      Icon: Radio
    },
    {
      key: 'camera',
      label: 'Take photo',
      onPress: onCamera,
      Icon: Camera
    },
    {
      key: 'gallery',
      label: 'Upload image',
      onPress: onGallery,
      Icon: ImageIcon
    },
  ] as const;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}><View /></Pressable>

      <View style={s.cardWrap}>
        <View style={s.card}>
          {actions.map(({
            key, label, onPress, Icon
          }, idx) => (
            <React.Fragment key={key}>
              <Pressable
                onPress={() => { onClose(); onPress(); }}
                style={({
                  pressed
                }) => [s.row, pressed && s.rowPressed]}
              >
                <View style={s.iconWrap}>
                  <Icon width={20} height={20} color={iconColor} />
                </View>
                <Text style={s.text}>{label}</Text>
              </Pressable>
              {idx < actions.length - 1 && <View style={s.divider} />}
            </React.Fragment>
          ))}
        </View>
      </View>
    </Modal>
  );
}
