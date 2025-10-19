import React, { useEffect, useRef } from 'react';
import { GestureResponderEvent, Modal, Pressable, Text, View } from 'react-native';
import { Camera, Image as ImageIcon } from 'react-native-feather';
import { useStyles } from './styles';
import { AppTipContent } from '../TipComponents/AppTipContent';
import { FirstTimeTipAnchor, FirstTimeTipAnchorHandle } from '../TipComponents/FirstTimeTipAnchor';
import { FirstTimeTipPressable } from '../TipComponents/FirstTimeTipPressable';

export default function ScanActionsPopover({
  visible,
  onClose,
  onLive,
  onCamera,
  onGallery,
  showCoachmark = false,   // parent decides if this is the first guided open
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

  const tipRef = useRef<FirstTimeTipAnchorHandle>(null);

  // When modal shows (content rendered & measurable), open the tip immediately.
  const handleModalShow = () => {
    if (showCoachmark) {
      // same frame as visibility → no visible lag
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

  // Disable Modal fade ONLY on the first guided open to avoid ~300ms delay
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
        {/* Anchor the tip to the card (no press interception) */}
        <FirstTimeTipPressable
          ref={tipRef}
          placement="top"
          content={<AppTipContent
            title="Scan prices fast"
            text="Choose Camera or Upload to convert instantly."
            primaryLabel="OK"
            onPrimaryPress={acknowledge}
            arrowPosition="top" />}

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
