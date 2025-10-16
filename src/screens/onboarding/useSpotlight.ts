import { useContext, useMemo } from 'react';
import { SpotlightContext, SpotlightStep } from './SpotlightProvider';


export const useSpotlight = () => {
  const ctx = useContext(SpotlightContext);
  if (!ctx) throw new Error('useSpotlight must be used inside <SpotlightProvider>');


  const current = useMemo(() => ctx.steps[ctx.activeIndex], [ctx.steps, ctx.activeIndex]);
  const currentTarget = current ? ctx.targets[current.id] : undefined;


  return {
    ...ctx,
    current,
    currentTarget,
  };
};