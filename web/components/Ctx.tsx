'use client';
import { createContext, useContext } from 'react';
import type { Persona } from '@/lib/data';

export interface Draft { answer: string; uploadId: string | null; uploadScene: string }

export interface Ctx {
  persona: Persona;
  send: (message: string) => void;   // a block answering, submitting or uploading is a new turn
  busy: boolean;
  restart: () => void;        // start a brand new design
  designDone: boolean;        // the current plan shows a render
  // Composite turn: a question.text plus an optional inspiration photo.upload share ONE Skip/Next
  // pair rendered below the blocks. Blocks write into the draft, the page composes the message.
  composite: boolean;
  draft: Draft;
  setDraft: (partial: Partial<Draft>) => void;
  submitTurn: () => void;
  skipTurn: () => void;
}
export const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error('AppCtx missing');
  return c;
};
