// src/utils/useEvent.ts
import { useEffect } from 'react';
import { TourEvents } from '../screens/onboarding/events';
export function useEvent<T extends keyof TourEvents>(
  evt: T,
  handler: NonNullable<TourEvents[T]> extends undefined ? () => void : (p: any) => void
) {
  useEffect(() => {
    // @ts-ignore
    events.on(evt, handler);
    // @ts-ignore
    return () => events.off(evt, handler);
  }, [evt, handler]);
}
