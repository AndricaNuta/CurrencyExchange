import { useEffect } from 'react';
import { events, TourEvents } from './events';

export function useEvent<T extends keyof TourEvents>(
  evt: T,
  handler: NonNullable<TourEvents[T]> extends undefined ? ()
  => void : (p: any) => void
) {
  useEffect(() => {
    events.on(evt, handler);
    return () => events.off(evt, handler);
  }, [evt, handler]);
}
