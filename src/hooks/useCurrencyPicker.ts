import { useCallback, useRef, useState } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

type Mode = 'from' | 'to' | 'lang' | null;

export function useCurrencyPicker() {
  const modalRef = useRef<BottomSheetModal>(null);
  const [mode, setMode] = useState<Mode>(null);
  const isOpenRef = useRef(false);
  const pendingModeRef = useRef<Mode>(null);

  const presentMode = useCallback((next: Exclude<Mode, null>) => {
    if (!isOpenRef.current) {
      setMode(next);
      modalRef.current?.present();
      isOpenRef.current = true;
      return;
    }
    if (mode === next) { modalRef.current?.present(); return; }
    pendingModeRef.current = next; modalRef.current?.dismiss();
  }, [mode]);

  const handleDismiss = useCallback(() => {
    isOpenRef.current = false;
    const next = pendingModeRef.current as Exclude<Mode, null> | null;
    if (next) {
      pendingModeRef.current = null; setMode(next);
      requestAnimationFrame(() => {
        modalRef.current?.present();
        isOpenRef.current = true;
      });
    } else { setMode(null); }
  }, []);

  return {
    modalRef,
    mode,
    setMode,
    presentMode,
    handleDismiss
  };
}
