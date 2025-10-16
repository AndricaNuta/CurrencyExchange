import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutRectangle } from 'react-native';


export type SpotlightShape = 'circle' | 'rounded';
export type SpotlightStep = {
id: string; // target id to highlight
title: string;
description?: string;
shape?: SpotlightShape; // default 'rounded'
cornerRadius?: number; // for rounded
padding?: number; // extra padding around hole
};


export type TargetInfo = LayoutRectangle & { mounted: boolean };


export type SpotlightContextType = {
// targets discovered via <SpotlightTarget id="..." />
targets: Record<string, TargetInfo | undefined>;
registerTarget: (id: string, layout: LayoutRectangle) => void;
unregisterTarget: (id: string) => void;


// tour state
visible: boolean;
steps: SpotlightStep[];
activeIndex: number;
start: (steps: SpotlightStep[], startIndex?: number) => void;
next: () => void;
prev: () => void;
stop: () => void;
};
export const SpotlightContext = createContext<SpotlightContextType | null>(null);


export const SpotlightProvider: React.FC<{ children: React.ReactNode }>= ({
  children
}) => {
  const [targets, setTargets] = useState<Record<string, TargetInfo | undefined>>({});
  const [visible, setVisible] = useState(false);
  const [steps, setSteps] = useState<SpotlightStep[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const lastLayoutsRef = useRef<Record<string, LayoutRectangle>>({});

  const targetsRef = useRef<Record<string, TargetInfo | undefined>>({});
  useEffect(() => { targetsRef.current = targets; }, [targets]);

  const registerTarget = useCallback((id: string, layout: LayoutRectangle) => {
    const prev = targetsRef.current[id];
    // shallow-equality guard
    if (prev &&
        prev.x === layout.x &&
        prev.y === layout.y &&
        prev.width === layout.width &&
        prev.height === layout.height &&
        prev.mounted === true) {
      return; // no change => no state update
    }

    lastLayoutsRef.current[id] = layout;
    setTargets(t => ({
      ...t,
      [id]: {
        ...layout,
        mounted: true
      },
    }));
  }, []);

  const unregisterTarget = useCallback((id: string) => {
    const prev = targetsRef.current[id];
    if (!prev || prev.mounted === false) return; // nothing to do
    setTargets(t => ({
      ...t,
      [id]: t[id] ? {
        ...(t[id] as TargetInfo),
        mounted: false
      } : undefined,
    }));
  }, []);


  const start = useCallback((newSteps: SpotlightStep[], startIndex: number = 0) => {
    setSteps(newSteps);
    setActiveIndex(startIndex);
    setVisible(true);
  }, []);


  const stop = useCallback(() => {
    setVisible(false);
    setSteps([]);
    setActiveIndex(0);
  }, []);


  const next = useCallback(() => {
    setActiveIndex(i => (i + 1 < steps.length ? i + 1 : i));
  }, [steps.length]);


  const prev = useCallback(() => {
    setActiveIndex(i => (i - 1 >= 0 ? i - 1 : i));
  }, []);


  const value = useMemo<SpotlightContextType>(() => ({
    targets,
    registerTarget,
    unregisterTarget,
    visible,
    steps,
    activeIndex,
    start,
    next,
    prev,
    stop,
  }), [targets, visible, steps, activeIndex, start, next, prev, stop, registerTarget, unregisterTarget]);


  return (
    <SpotlightContext.Provider value={value}>
      {children}
    </SpotlightContext.Provider>
  );
};