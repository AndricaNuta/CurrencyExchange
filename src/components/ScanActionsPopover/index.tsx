import React, { useEffect, useRef } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Camera, Image as ImageIcon } from 'react-native-feather';
import { useStyles } from './styles';
import { AppTipContent } from '../TipComponents/AppTipContent';
import { FirstTimeTipPressable, FirstTimeTipPressableHandle } from '../TipComponents/FirstTimeTipPressable';

export default function ScanActionsPopover({
  visible,
  onClose,
  onCamera,
  onGallery,
  showCoachmark = false,
  onCoachmarkSeen,
}: {
  visible: boolean;
  onClose: () => void;
  onLive: () => void;
  onCamera: () => void;
  onGallery: () => void;
  showCoachmark?: boolean;
  onCoachmarkSeen?: () => void;
}) {
  const s = useStyles();
  const iconColor = s.text.color as string;

  const actions = [
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

  const tipRef = useRef<FirstTimeTipPressableHandle>(null);

  const handleModalShow = () => {
    if (showCoachmark) {
      requestAnimationFrame(() => tipRef.current?.open());
    } else {
      tipRef.current?.close();
    }
  };

  // Always close the tip when popover closes
  useEffect(() => {
    if (!visible) tipRef.current?.close();
  }, [visible]);

  const acknowledge = () => {
    tipRef.current?.close();
    onCoachmarkSeen?.();
  };

  const animationType = visible && showCoachmark ? 'none' : 'fade';

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      transparent
      onShow={handleModalShow}
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <Pressable style={s.backdrop} onPress={onClose}>
        <View />
      </Pressable>

      <View style={s.cardWrap} pointerEvents="box-none">
        <FirstTimeTipPressable
          ref={tipRef}
          placement="top"
          content={<AppTipContent
            title="Scan prices fast"
            text="Choose Camera or Upload to convert instantly."
            primaryLabel="OK"
            onPrimaryPress={acknowledge}
            arrowPosition="top" />
          }
          interceptPress={false}
        >
          <View style={s.card}>
            {actions.map(({
              key, label, onPress, Icon
            }, idx) => (
              <React.Fragment key={key}>
                <Pressable
                  onPress={() => { onClose(); acknowledge(); onPress(); }}
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
        </FirstTimeTipPressable>
      </View>
    </Modal>
  );
}
