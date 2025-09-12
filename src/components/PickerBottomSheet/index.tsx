import React, { useMemo, useCallback } from 'react';
import { Text, View, Pressable } from 'react-native';
import {BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetFlatList,
  useBottomSheetSpringConfigs,} from '@gorhom/bottom-sheet';
import { Search } from 'react-native-feather';
import { styles } from './styles';

type Item = {
  key: string;
  label: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
};
type Props = {
  title: string;
  items: Item[];
  onSelect: (key: string) => void;
  search?: {
    value: string;
    set: (v: string) => void;
    autoCapitalize?: 'none' | 'characters';
  };
  snapPoint?: string;
  onDismiss?: () => void;
};

export const PickerBottomSheet = React.forwardRef<BottomSheetModal, Props>(
  ({
    title, items, onSelect, search, snapPoint = '45%', onDismiss
  }, ref) => {
    const snapPoints = useMemo(() => [snapPoint], [snapPoint]);
    const fast = useBottomSheetSpringConfigs({
      damping: 18,
      mass: 0.6,
      stiffness: 450,
      overshootClamping: true,
    });

    const keyExtractor = useCallback((it: Item) => it.key, []);
    const renderItem = useCallback(
      ({
        item
      }: { item: Item }) => (
        <Pressable
          style={({
            pressed
          }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => onSelect(item.key)}
        >
          {item.left ? <View style={styles.left}>{item.left}</View> : null}
          <Text style={styles.rowLabel}>{item.label}</Text>
          {item.right}
        </Pressable>
      ),
      [onSelect],
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        animationConfigs={fast}
        enablePanDownToClose
        onDismiss={onDismiss}
        keyboardBehavior="extend"
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>

          {search && (
            <View style={styles.searchWrap}>
              <Search color="#6B7280" />
              <BottomSheetTextInput
                value={search.value}
                onChangeText={search.set}
                placeholder="Search"
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
                autoCapitalize={search.autoCapitalize ?? 'none'}
              />
            </View>
          )}
        </View>

        <BottomSheetFlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={24}
          maxToRenderPerBatch={24}
          windowSize={7}
        />
      </BottomSheetModal>
    );
  },
);
