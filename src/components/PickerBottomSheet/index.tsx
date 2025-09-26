import React, { useMemo, useCallback } from 'react';
import { Text, View, Pressable, useWindowDimensions } from 'react-native';
import {BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetFlatList,
  useBottomSheetSpringConfigs,} from '@gorhom/bottom-sheet';
import { Search } from 'react-native-feather';
import { usePickerStyles } from './styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Item = {
  key: string;
  label: string;
  left?: React.ReactNode;
  right?: React.ReactNode
};

type Props = {
  title: string;
  items: Item[];
  onSelect: (key: string) => void;
  search?: { value: string; set: (v: string) => void; autoCapitalize?: 'none' | 'characters' };
  snapPoints?: Array<number | `${number}%`>;
  onDismiss?: () => void;
  initialIndex?: 0 | 1;
};

export const PickerBottomSheet = React.forwardRef<BottomSheetModal, Props>(
  (
    {
      title,
      items,
      onSelect,
      search,
      snapPoints,
      onDismiss,
      initialIndex = 0,
    },
    ref
  ) => {
    const {
      height
    } = useWindowDimensions();
    const styles = usePickerStyles();
    // convert % → px and ensure we return [small,big]
    const resolvedSnapPoints = useMemo(() => {
      const sp = (snapPoints?.length ? snapPoints : ['45%', '80%']) as Array<
        number | `${number}%`
      >;
      const toPx = (v: number | `${number}%`) =>
        typeof v === 'number' ? v : Math.round((parseFloat(v) / 100) * height);
      const px = sp.map(toPx).sort((a, b) => a - b);
      return px;
    }, [snapPoints, height]);

    const anim = useBottomSheetSpringConfigs({
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
      [onSelect, styles.left, styles.row, styles.rowLabel, styles.rowPressed]
    );
    const insets = useSafeAreaInsets();
    return (
      <BottomSheetModal
        topInset={insets.top + 8}
        ref={ref}
        snapPoints={resolvedSnapPoints}
        index={initialIndex}
        enableDynamicSizing={false}
        enablePanDownToClose
        animationConfigs={anim}
        onDismiss={onDismiss}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
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
          style={styles.flex}
          contentContainerStyle={styles.flatlistContainerStyle}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={24}
          maxToRenderPerBatch={24}
          windowSize={7}
          ListEmptyComponent={
            <View style={styles.emptyListView}>
              <Text style={styles.emptyListText}>No results</Text>
            </View>
          }
        />
      </BottomSheetModal>
    );
  }
);
