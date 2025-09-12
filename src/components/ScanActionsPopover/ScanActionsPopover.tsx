import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export default function ScanActionsPopover({
  visible, onClose, onLive, onCamera, onGallery,
}: {
  visible: boolean; onClose: () => void;
  onLive: () => void; onCamera: () => void; onGallery: () => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={S.backdrop} onPress={onClose}>
        <View />
      </Pressable>
      <View style={S.cardWrap}>
        <View style={S.card}>
          <Row icon="📡" label="Scan live"  onPress={() => { onClose(); onLive(); }} />
          <Row icon="📷" label="Take photo" onPress={() => { onClose(); onCamera(); }} />
          <Row icon="🖼️" label="Add image"  onPress={() => { onClose(); onGallery(); }} />
        </View>
      </View>
    </Modal>
  );
}
function Row({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.row, pressed && S.rowPressed]}>
      <Text style={S.icon}>{icon}</Text>
      <Text style={S.text}>{label}</Text>
    </Pressable>
  );
}
const S = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.12)' },
  cardWrap: { position: 'absolute', left: 0, right: 0, bottom: 110, alignItems: 'center' },
  card: {
    width: 260, borderRadius: 16, backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 10 }, elevation: 6,
    paddingVertical: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  rowPressed: { backgroundColor: '#F6F7FA' },
  icon: { width: 26, fontSize: 18 },
  text: { fontSize: 15, fontWeight: '600' },
});
