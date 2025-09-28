import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { BottomSheetBackdrop, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useTheme } from '../../theme/ThemeProvider';
import { alpha } from '../../theme/tokens';

export const useThemedBackdrop = () => {
  const t = useTheme();
  const bg = alpha(t.colors.text, t.scheme === 'dark' ? 0.25 : 0.30)

  return useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        style={[StyleSheet.absoluteFill, {
          backgroundColor: bg
        }]}
      />
    ),
    [bg]
  );
};