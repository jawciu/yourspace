'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from 'motion/react';
import { AppCtx, type Draft } from '@/components/Ctx';
import { Renderer } from '@/components/Renderer';
import { uploadedPreviews } from '@/components/blocks';
import { PERSONAS, personaById } from '@/lib/data';
import type { UIPlan } from '@/lib/validate';
import type { Turn } from '@/lib/prompt';

interface LogEntry { at: string; message: string; source: string; fixtureKey?: string; verdict: { ok: boolean; errors: string[]; warnings: string[]; changedShare: number }; plan: UIPlan | null; reason?: string }

const IDEAS = [
  "I've just bought a 1960s house. I'm into mid-century and sustainability, where do I start?",
  'The kitchen is dark and I cook every night. Open it up and make it warm.',
  'Turn the back garden into somewhere we actually sit in the evening.',
  'Make the house cheaper to heat without it looking like a retrofit.',
  'My bedroom faces north and feels cold. Cosy, not twee.',
];
const FOLLOW_UPS: Record<string, string[]> = {
  'start': ['Outside, and £40k to £100k over two years'],
  'exterior': ['Show me the living room', 'Save this plan'],
  'living': ['Less orange, more timber', 'Save this plan'],
  'living:timber': ['Save this plan', 'What about the garden?'],
  'saved': ['The kitchen'],
};
const spring = { type: 'spring' as const, stiffness: 220, damping: 28, mass: 0.9 };
const MIN_THINK_MS = 0; // no artificial floor: the model call is the only wait

// What the system says it is doing while the plan is being made. Keyed by what was asked.
function stepsFor(message: string, stage: string): string[] {
  const m = message.toLowerCase();
  if (/save/.test(m)) return ['Saving every render and every number', 'Working out what comes next'];
  if (/photo|uploaded/.test(m)) return ['Reading the photo', 'Drafting the design in your style', 'Pricing it and picking what to buy', 'Rendering it'];
  if (/\b(less|more|darker|lighter|instead)\b/.test(m)) return ['Re-rendering with your note', 'Keeping everything else where it is'];
  if (stage || /answer|yes|no\b|about|maybe|roughly|£/.test(m)) return ['Noting that down', 'Working out what to ask next'];
  return ['Reading what you want to achieve', 'Working out the one thing to ask first'];
}

function Working({ steps }: { steps: string[] }) {
  const [n, setN] = useState(0);
  useEffect(() => { setN(0); const t = setInterval(() => setN(x => (x + 1) % Math.max(1, steps.length)), 900); return () => clearInterval(t); }, [steps]);
  const text = steps[n] ?? steps[0] ?? 'Working on it';
  return (
    <motion.div className="working" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }} role="status" aria-live="polite">
      <span className="working-dot" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={text} className="working-text" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }}>{text}…</motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

// Progress through the interview, as the model reports it (optional on the contract).
interface Progress { done: number; total: number; label: string }
function ProgressBar({ progress }: { progress: Progress }) {
  const total = Math.max(1, Math.round(progress.total));
  const done = Math.min(total, Math.max(0, Math.round(progress.done)));
  const finished = done >= total;
  return (
    <div className="progress" aria-label={`Step ${Math.min(done + 1, total)} of ${total}`}>
      <div className="progress-head">
        <span className="progress-label">{finished ? 'Your design' : progress.label}</span>
        <span className="progress-step">{finished ? '' : `Step ${done + 1} of ${total}`}</span>
      </div>
      <div className="progress-bar">
        {Array.from({ length: total }, (_, i) => (
          <motion.span key={i} className={'progress-seg' + (i < done || finished ? ' is-done' : i === done ? ' is-now' : '')}
            initial={false} animate={{ opacity: i < done || finished ? 1 : i === done ? 0.7 : 0.25 }} transition={{ duration: 0.4 }} />
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const [personaId] = useState(PERSONAS[0].id);
    const [history, setHistory] = useState<Turn[]>([]);
  const [plan, setPlan] = useState<UIPlan | null>(null);
  const [prev, setPrev] = useState<UIPlan | null>(null);
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [memory, setMemory] = useState<{ label: string; value: string }[]>([]);
  const [uploads, setUploads] = useState<{ id: string; scene: string }[]>([]);
  const EMPTY_DRAFT: Draft = { answer: '', uploadId: null, uploadScene: '' };
  const [draft, setDraftState] = useState<Draft>(EMPTY_DRAFT);
  const setDraft = useCallback((partial: Partial<Draft>) => setDraftState(d => ({ ...d, ...partial })), []);
  const [idea, setIdea] = useState(0);
  const [text, setText] = useState('');
  const [reshape, setReshape] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [goal, setGoal] = useState<string | null>(null);
  const fixtureKey = useRef<string | null>(null);
  const pending = useRef<null | (() => void)>(null);
  const persona = personaById(personaId);

  useEffect(() => { const t = setInterval(() => setIdea(i => (i + 1) % IDEAS.length), 4000); return () => clearInterval(t); }, []);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'j' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setShowJson(s => !s); } }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);

  const clear = () => { setHistory([]); setPlan(null); setPrev(null); setPinned(new Set()); setDismissed(new Set()); fixtureKey.current = null; setText(''); setMemory([]); setUploads([]); setGoal(null); setDraftState({ answer: '', uploadId: null, uploadScene: '' }); };

  // M18 focus lock: if the customer is mid-typing inside a block, hold the new plan until they leave it.
  const applyPlan = useCallback((next: UIPlan, changedShare: number) => {
    const apply = () => { setPrev(plan); setPlan(next); setReshape(changedShare > 0.5); setDraftState({ answer: '', uploadId: null, uploadScene: '' }); };
    // Only a text-like field with something typed in it holds the plan. A file input keeps focus
    // after the picker closes and must never block the render turn.
    const active = document.activeElement as HTMLElement | null;
    const textLike = active?.tagName === 'TEXTAREA' || (active?.tagName === 'INPUT' && ['', 'text', 'search', 'email', 'number'].includes(((active as HTMLInputElement).type || '').toLowerCase()));
    const hasValue = textLike && ((active as HTMLInputElement).value ?? '').trim().length > 0;
    const inBlock = !!active?.closest?.('[data-block]') && hasValue;
    if (inBlock) {
      pending.current = apply;
      active!.addEventListener('blur', () => { pending.current?.(); pending.current = null; }, { once: true });
    } else apply();
  }, [plan]);

  const send = useCallback(async (message: string) => {
    if (!message.trim() || busy) return;
    setBusy(true); setText('');
    // Every "photo id up_x" in the message registers an upload; the words before it name the scene.
    const found = [...message.matchAll(/photo of the (.+?)\s*[,(]\s*photo id (up_[a-z0-9]+)/g)].map(m => ({ id: m[2], scene: /inspiration/i.test(m[0]) ? 'inspiration' : m[1].trim() }));
    const nextUploads = found.length ? [...uploads, ...found.filter(f => !uploads.some(u => u.id === f.id))] : uploads;
    if (found.length) setUploads(nextUploads);
    const stageNow = fixtureKey.current ? fixtureKey.current.split(':').slice(1).join(':') : (plan ? 'live' : '');
    setSteps(stepsFor(message, stageNow));
    const started = Date.now();
    try {
      const res = await fetch('/api/plan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ personaId, message, history, pinned: [...pinned], dismissed: [...dismissed], prevFixture: fixtureKey.current, memory, uploads: nextUploads }) });
      const data = await res.json();
      const wait = MIN_THINK_MS - (Date.now() - started);
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
      const entry: LogEntry = { at: new Date().toLocaleTimeString('en-GB'), message, source: data.source ?? 'error', fixtureKey: data.fixtureKey, verdict: data.verdict ?? { ok: false, errors: [data.error ?? 'no plan'], warnings: [], changedShare: 0 }, plan: data.plan ?? null, reason: data.reason };
      setLog(l => [entry, ...l]);
      if (data.plan) {
        if (data.fixtureKey) fixtureKey.current = data.fixtureKey;
        setGoal(g => g ?? message);
        setHistory(h => [...h, { user: message, plan: data.plan }]);
        if (Array.isArray(data.plan.memory)) setMemory(data.plan.memory);
        applyPlan(data.plan, data.verdict?.changedShare ?? 0);
      }
    } finally { setBusy(false); }
  }, [busy, personaId, history, pinned, dismissed, applyPlan, memory, uploads]);

  // Composite turn: question.text + inspiration photo.upload share one Skip/Next below the blocks.
  const questionBlock = plan?.blocks.find(b => b.component === 'question.text');
  const inspoBlock = plan?.blocks.find(b => b.component === 'photo.upload' && (b.props as { kind?: string } | undefined)?.kind === 'inspiration');
  const composite = !!(questionBlock && inspoBlock);
  const submitTurn = useCallback(() => {
    if (!questionBlock || busy) return;
    const q = String((questionBlock.props as { question?: string })?.question ?? '');
    const answer = draft.answer.trim();
    if (!answer && !draft.uploadId) return;
    let msg = answer ? `${q} ${answer}` : `${q} (no answer, see the photo)`;
    if (draft.uploadId) msg += ` (I also uploaded an inspiration photo of the ${draft.uploadScene || 'inspiration'}, photo id ${draft.uploadId})`;
    send(msg);
  }, [questionBlock, busy, draft, send]);
  const skipTurn = useCallback(() => {
    if (!questionBlock || busy) return;
    send(`Skip that question: ${String((questionBlock.props as { question?: string })?.question ?? '')}`);
  }, [questionBlock, busy, send]);

  const toggle = (set: Set<string>, id: string) => { const n = new Set(set); if (n.has(id)) n.delete(id); else n.add(id); return n; };
  const stage = fixtureKey.current ? fixtureKey.current.split(':').slice(1).join(':') : (plan?.intent.toLowerCase().includes('solar') ? 'solar' : plan?.intent.toLowerCase().includes('tariff') ? 'tariff' : plan ? 'meter' : '');

  const askForm = (cls: string, placeholder: string) => (
    <motion.form layoutId="ask" transition={spring} className={cls} onSubmit={e => { e.preventDefault(); send(text); }}>
      <input value={text} onChange={e => setText(e.target.value)} placeholder={busy ? 'Working on it…' : placeholder} disabled={busy} aria-label="Ask" />
      <button className={'ask-go' + (text.trim() ? ' ask-go-lit' : '')} disabled={busy || !text.trim()} aria-label="Go">→</button>
    </motion.form>
  );

  return (
    <MotionConfig reducedMotion="user">
    <AppCtx.Provider value={{ persona, send, busy, composite, draft, setDraft, submitTurn, skipTurn , restart: clear, designDone: !!plan?.blocks.some(b => b.component === 'render.compare')}}>
      <div className={`shell ${showJson ? 'shell-json' : ''} ${plan ? 'shell-memo' : ''}`}>
        <header className="top">
          <button className="logo" onClick={clear} aria-label="Yourspace, start over"><img src="/yourspace.png" alt="Yourspace" className="logo-img" /></button>
        </header>

        <main className="canvas">
          <LayoutGroup>
            <AnimatePresence mode="popLayout" initial={false}>
              {!plan ? (
                <motion.section key="landing" className="landing" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24, transition: { duration: 0.25 } }} transition={spring}>
                  <h1 className="landing-title">Let's create your perfect home!</h1>
                  {askForm('ask ask-center', "Explain what you'd like to achieve!")}
                  <AnimatePresence mode="wait" initial={false}>
                    {busy ? <Working key="w" steps={steps} /> : (
                      <motion.div key="ideas" className="ideas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <span className="ideas-label">For example</span>
                        <AnimatePresence mode="wait">
                          <motion.button key={idea} className="idea" onClick={() => setText(IDEAS[idea])} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
                            “{IDEAS[idea]}”
                          </motion.button>
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.img className="hero-img" src="/hero-transparent.png" alt="A pencil sketch of a house becoming a photograph of a timber-clad home" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: 0.2, ease: 'easeOut' }} />
                </motion.section>
              ) : (
                <motion.div key="plan" className={`plan plan-${plan.frame} ${busy ? 'plan-busy' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  {goal ? (
                    <div className="goal">
                      <span className="goal-kicker">Your goal</span>
                      <p className="goal-text"><span className="goal-q">“</span>{goal}<span className="goal-q">”</span></p>
                    </div>
                  ) : null}
                  {(plan as UIPlan & { progress?: Progress }).progress ? <ProgressBar progress={(plan as UIPlan & { progress?: Progress }).progress!} /> : null}
                  <AnimatePresence>{busy && <Working key="w2" steps={steps} />}</AnimatePresence>
                  <Renderer plan={plan} prev={prev} pinned={pinned} dismissed={dismissed} reshape={reshape}
                    onPin={id => setPinned(s => toggle(s, id))} onDismiss={id => setDismissed(s => new Set(s).add(id))} onRestore={id => setDismissed(s => { const n = new Set(s); n.delete(id); return n; })} />
                </motion.div>
              )}
            </AnimatePresence>


          </LayoutGroup>
        </main>

        {plan && (
          <aside className="memo" aria-label="Your design so far">
            <div className="memo-body">
              {memory.length > 0 && <div className="memo-head">What you've told us</div>}
              <dl className="memo-list">
                <AnimatePresence initial={false}>
                  {memory.filter(m => !/photo (uploaded|id)/i.test(`${m.label} ${m.value}`)).map(m => (
                    <motion.div key={m.label} className="memo-row" layout initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                      <dt>{m.label}</dt><dd>{m.value}</dd>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </dl>
              {uploads.length ? <div className="memo-head">Your photos</div> : null}
              {uploads.length ? (
                <div className="memo-photos">
                  {uploads.map(u => (
                    <motion.figure key={u.id} className="memo-photo" initial={{ opacity: 0, scale: .92 }} animate={{ opacity: 1, scale: 1 }}>
                      <img src={uploadedPreviews.get(u.id) ?? `/api/upload/${u.id}`} alt={u.scene} onError={e => { (e.currentTarget.closest('.memo-photo') as HTMLElement | null)?.setAttribute('hidden', ''); }} />
                      <figcaption className="memo-photo-cap">{u.scene}</figcaption>
                    </motion.figure>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="dock">
              <div className="dock-head">
                <span>Anything to add or change?</span>
                <button className="tool" onClick={clear}>Start over</button>
              </div>
              {askForm('ask ask-dock', 'Ask about your design')}
            </div>
          </aside>
        )}
        {showJson && (
          <aside className="rail">
            <div className="rail-head">Plans this session <span className="mono">{log[0]?.source ?? ''}{log[0]?.fixtureKey ? ` · ${log[0].fixtureKey}` : ''}</span></div>
            {log.length === 0 ? <p className="blk-hint">Every plan the model emits appears here with the validator's verdict. The screen is drawn from this and nothing else.</p> : null}
            {log.map((e, i) => (
              <details key={i} open={i === 0} className="log">
                <summary><span className={e.verdict.ok ? 'ok' : 'bad'}>{e.verdict.ok ? 'PASS' : 'REFUSED'}</span> {e.at} · {e.message}</summary>
                {e.reason ? <p className="blk-hint">{e.reason}</p> : null}
                {e.verdict.errors.map(x => <p key={x} className="bad">{x}</p>)}
                {e.verdict.warnings.map(x => <p key={x} className="warn">{x}</p>)}
                <pre>{JSON.stringify(e.plan, null, 1)}</pre>
              </details>
            ))}
          </aside>
        )}
      </div>
    </AppCtx.Provider>
    </MotionConfig>
  );
}
