'use client';
// The renderer. Reads a UIPlan and draws it with tokens and the tier ladder, nothing else.
// Stability rules live here: keyed by block id, unchanged blocks do not re-render, tier moves
// animate in place, entries and exits are visible, pin and dismiss are one click.
import { Component, memo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Block, UIPlan } from '@/lib/validate';
import { TIERS } from '@/lib/vocabulary';
import { REGISTRY } from './blocks';
import { useApp } from './Ctx';

interface Props {
  plan: UIPlan;
  prev: UIPlan | null;
  pinned: Set<string>;
  dismissed: Set<string>;
  onPin: (id: string) => void;
  onDismiss: (id: string) => void;
  onRestore: (id: string) => void;
  reshape: boolean; // M17: more than half changed, make the transition explicit
}

// A block that throws must not take the screen down. It shows its why and a quiet note.
class BlockBoundary extends Component<{ children: ReactNode; id: string }, { err: string | null }> {
  state = { err: null as string | null };
  static getDerivedStateFromError(e: unknown) { return { err: e instanceof Error ? e.message : String(e) }; }
  componentDidUpdate(prev: { id: string }) { if (prev.id !== this.props.id && this.state.err) this.setState({ err: null }); }
  render() { return this.state.err ? <div className="blk-hint">This part could not be drawn ({this.state.err}).</div> : this.props.children; }
}

// Only re-render a block when its plan entry changed (M15 line one: nothing changed, nothing moves).
const Body = memo(function Body({ block }: { block: Block }) {
  const C = REGISTRY[block.component];
  if (!C) return <div className="blk-body">Unknown component {block.component}</div>;
  return <C block={block} />;
}, (a, b) => JSON.stringify(a.block) === JSON.stringify(b.block));

export function Renderer({ plan, prev, pinned, dismissed, onPin, onDismiss, onRestore, reshape }: Props) {
  const { composite, draft, busy, submitTurn, skipTurn, send } = useApp();
  // Room-photo turn: photo.upload at hero (not an inspiration drop). Its Next lives below the blocks.
  const roomPhoto = plan.blocks.find(b => b.tier === 'hero' && b.component === 'photo.upload' && (b.props as { kind?: string } | undefined)?.kind !== 'inspiration');
  const sendPhoto = () => {
    if (!draft.uploadId || busy) return;
    (document.activeElement as HTMLElement | null)?.blur?.();
    send(`I uploaded a photo of the ${draft.uploadScene || 'room'} (photo id ${draft.uploadId})`);
  };
  const visible = plan.blocks.filter(b => !dismissed.has(b.id));
  const ordered = [...visible].sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier));
  const prevById = new Map((prev?.blocks ?? []).map(b => [b.id, b]));
  const gone = [...dismissed].filter(id => plan.blocks.some(b => b.id === id));

  return (
    <section className={`frame frame-${plan.frame}`} aria-live="polite">
      {plan.question && !plan.blocks.some(b => b.component === 'question.text' || b.component === 'photo.upload') ? <p className="question">{plan.question}</p> : null}
      <div className="blocks">
        <AnimatePresence initial={false}>
          {ordered.map((b, i) => {
            const was = prevById.get(b.id);
            const changed = !!was && JSON.stringify(was) !== JSON.stringify(b);
            const moved = !!was && was.tier !== b.tier;
            return (
              <motion.article
                key={b.id}
                layout
                data-block={b.id}
                data-tier={b.tier}
                className={`blk tier-${b.tier} ${pinned.has(b.id) ? 'blk-pinned' : ''} ${changed ? 'blk-changed' : ''}`}
                initial={reshape ? { opacity: 0, x: 48, filter: 'blur(10px)' } : { opacity: 0, y: 28, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(6px)', transition: { duration: 0.22 } }}
                transition={{ layout: { type: 'spring', stiffness: 200, damping: 28 }, opacity: { duration: 0.5, delay: i * 0.11 }, y: { type: 'spring', stiffness: 160, damping: 22, delay: i * 0.11 }, x: { type: 'spring', stiffness: 160, damping: 22, delay: i * 0.11 }, filter: { duration: 0.6, delay: i * 0.11 } }}
              >
                <header className="blk-head">
                  <span className="why" title="Why is this here">{b.why}</span>
                </header>
                <BlockBoundary id={b.id + JSON.stringify(b.props)}><Body block={b} /></BlockBoundary>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>
      {composite ? (
        <div className="turn-actions">
          <button className="btn-skip" type="button" disabled={busy} onClick={skipTurn}>Skip</button>
          <button className="btn-next" type="button" disabled={busy || (!draft.answer.trim() && !draft.uploadId)} onClick={submitTurn}>Next</button>
        </div>
      ) : roomPhoto && draft.uploadId ? (
        <div className="turn-actions">
          <button className="btn-next" type="button" disabled={busy} onClick={sendPhoto}>Next</button>
        </div>
      ) : null}
      {gone.length ? (
        <div className="undo">
          {gone.map(id => <button key={id} className="tool" onClick={() => onRestore(id)}>bring back {id}</button>)}
        </div>
      ) : null}
    </section>
  );
}
