import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { BottomSheetBackdrop, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useTheme } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';
import { BackdropPressBehavior } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';

type Props = { pressBehavior?: BackdropPressBehavior | undefined };

export const useThemedBackdrop = (opts: Props = {}) => {
  const {
    pressBehavior = 'close'
  } = opts;
  const t = useTheme();
  const bg = alpha(t.colors.text, t.scheme === 'dark' ? 0.25 : 0.30);

  return useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={pressBehavior}
        style={[StyleSheet.absoluteFill, {
          backgroundColor: bg,
        }]}
      />
    ),
    [bg, pressBehavior]
  );
};