import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Camera, Image as ImageIcon, } from 'react-native-feather';
import { useStyles } from './styles';

export default function ScanActionsPopover(props: {
  visible: boolean;
  onClose: () => void;
  onLive: () => void;
  onCamera: () => void;
  onGallery: () => void;
}) {
  const {
    visible, onClose, onLive, onCamera, onGallery
  } = props;
  const s = useStyles();
  const iconColor = s.text.color as string;

  const actions = [
  /*  {
      key: 'live',
      label: 'Scan live',
      onPress: onLive,
      Icon: Radio
   }, */
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
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} presentationStyle="fullScreen">
      <Pressable style={s.backdrop} onPress={onClose}>
        <View />
      </Pressable>
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
