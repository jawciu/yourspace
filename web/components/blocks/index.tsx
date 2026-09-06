'use client';
// Registry: component name in the vocabulary -> React component. Every component reads only
// tokens (globals.css) and account data. Nothing here takes an appearance prop, by design.
import { useRef, useState, type ComponentType } from 'react';
import type { Block } from '@/lib/validate';
import { useApp } from '../Ctx';
import { RENDERS } from '@/lib/data';
import { useEffect } from 'react';

export interface BlockProps { block: Block }
type P = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const gbp = (n: number) => `£${Math.round(n).toLocaleString('en-GB')}`;

// ---- status.done ------------------------------------------------------------------------
function StatusDone({ block }: BlockProps) {
  const p = block.props as P;
  return (
    <div className="done">
      <div className="done-mark" aria-hidden>✓</div>
      <div>
        <div className="blk-title">{p.title}</div>
        <div className="blk-body">{p.detail}</div>
      </div>
    </div>
  );
}

// ---- question.single --------------------------------------------------------------------
function QuestionSingle({ block }: BlockProps) {
  const { send } = useApp();
  const p = block.props as P;
  const [picked, setPicked] = useState<string | null>(p.selected ?? null);
  return (
    <div>
      <div className="blk-title">{p.question}</div>
      <div className="chips" role="radiogroup" aria-label={p.question}>
        {((p.options ?? []) as string[]).map(o => (
          <button key={o} role="radio" aria-checked={picked === o} className={'chip' + (picked === o ? ' chip-on' : '')} onClick={() => { setPicked(o); send(`${p.question} ${o}`); }}>{o}</button>
        ))}
      </div>
    </div>
  );
}

// ---- question.text ----------------------------------------------------------------------
function QuestionText({ block }: BlockProps) {
  const { send, busy, composite, setDraft, submitTurn } = useApp();
  const p = block.props as P;
  const [v, setV] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  // A new question in the same block id must start clean (the customer got stuck otherwise).
  useEffect(() => { setSent(null); setV(''); }, [p.question]);
  const submit = () => {
    if (busy) return;
    if (composite) { submitTurn(); return; }
    if (!v.trim()) return;
    setSent(v); send(`${p.question} ${v}`);
  };
  const skip = () => { if (busy) return; setSent('(skipped)'); send(`Skip that question: ${p.question}`); };
  return (
    <div>
      <div className="blk-title">{p.question}</div>
      {sent ? <p className="answered">{sent}</p> : (
        <div className="textq">
          <input value={v} onChange={e => { setV(e.target.value); if (composite) setDraft({ answer: e.target.value }); }} disabled={busy} aria-label={p.question} autoFocus
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }} />
          {composite ? null : (
            <div className="textq-actions">
              <button className="btn-skip" type="button" disabled={busy} onClick={skip}>Skip</button>
              <button className="btn-next" type="button" disabled={busy || !v.trim()} onClick={submit}>Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- photo.upload -----------------------------------------------------------------------
export const uploadedPreviews = new Map<string, string>(); // id -> data URL (downscaled), display + render input

// Downscale to 1536px on the long side as JPEG so the request stays small enough for a serverless body.
// Falls back to the raw file as a data URL if the browser cannot decode it (HEIC on some browsers).
async function downscale(file: File): Promise<string> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1536 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.86);
  } catch {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file); });
  }
}

function PhotoUpload({ block }: BlockProps) {
  const { setDraft } = useApp();
  const p = block.props as P;
  const inputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'uploading' | 'ready' | 'failed'>('idle');
  const [err, setErr] = useState('');
  const sceneName = String(p.scene ?? 'photo').replace(/_/g, ' ');
  // Nothing is sent from here. Room photos and inspiration photos both land in the draft; the
  // Next below the blocks (Renderer) sends the turn.
  const onFile = async (f: File) => {
    setState('uploading'); setErr('');
    try {
      const dataUrl = await downscale(f);
      setPhoto(dataUrl);
      const blob = await (await fetch(dataUrl)).blob();
      const form = new FormData(); form.append('file', blob, 'photo.jpg'); form.append('scene', String(p.scene ?? 'photo'));
      const r = await fetch('/api/upload', { method: 'POST', body: form });
      const d = await r.json();
      if (!d.id) throw new Error(d.error ?? 'upload failed');
      uploadedPreviews.set(d.id, dataUrl);
      setState('ready');
      setDraft({ uploadId: d.id, uploadScene: sceneName });
    } catch (e) { setState('failed'); setErr(e instanceof Error ? e.message : String(e)); }
  };
  return (
    <div className={'drop' + (photo ? ' drop-has' : '')}
      onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}>
      {photo ? <img src={photo} alt="" className="drop-preview" /> : <p className="drop-prompt">{p.prompt}</p>}
      <div className="drop-row">
        <input ref={inputRef} type="file" accept="image/*,.heic,.heif" aria-label={p.prompt} onChange={e => { const f = e.target.files?.[0]; e.target.blur(); if (f) onFile(f); e.target.value = ''; }} />
      </div>
      {state === 'uploading' ? <span className="drop-state">Uploading…</span> : state === 'failed' ? <span className="drop-state">Upload failed: {err}. Try again.</span> : null}
    </div>
  );
}

// ---- assumptions.list -------------------------------------------------------------------
function AssumptionsList({ block }: BlockProps) {
  const p = block.props as P;
  return (
    <dl className="assume">
      {((p.items ?? []) as { label: string; value: string; source: string }[]).map(it => (
        <div key={it.label} className="assume-row">
          <dt>{it.label}</dt>
          <dd>{it.value} <span className="src">{it.source}</span></dd>
        </div>
      ))}
    </dl>
  );
}

function StatGrid({ stats, big }: { stats: { label: string; value: string; unit?: string }[]; big?: boolean }) {
  return (
    <div className={'stats' + (big ? ' stats-big' : '')}>
      {stats.map(s => (
        <div key={s.label} className="stat">
          <div className="stat-label">{s.label}</div>
          <div className="stat-value">{s.value}{s.unit ? <span className="stat-unit"> {s.unit}</span> : null}</div>
        </div>
      ))}
    </div>
  );
}

// ---- recommendation.card ----------------------------------------------------------------
function RecommendationCard({ block }: BlockProps) {
  const p = block.props as P;
  return (
    <div>
      <div className="blk-title">{p.headline}</div>
      <p className="blk-body">{p.reason}</p>
      {Array.isArray(p.points) && p.points.length ? <ul className="points">{(p.points as string[]).map(x => <li key={x}>{x}</li>)}</ul> : null}
    </div>
  );
}

// ---- render.compare ---------------------------------------------------------------------
const liveCache = new Map<string, string>();
function RenderCompare({ block }: BlockProps) {
  const p = block.props as P;
  const sceneKey = String(p.scene ?? '');
  const isUpload = sceneKey.startsWith('up_');
  const scene = isUpload ? { before: uploadedPreviews.get(sceneKey) ?? `/api/upload/${sceneKey}`, after: {} as Record<string, string> } : RENDERS[sceneKey];
  const key = `${p.scene}:${p.version}`;
  const staticAfter = scene?.after[p.version as string];
  const [live, setLive] = useState<string | null>(liveCache.get(key) ?? null);
  const [failed, setFailed] = useState<string | null>(null);
  const [after, setAfter] = useState(true);
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (staticAfter || live || !scene || !p.brief || tries > 3) return;
    let cancelled = false;
    fetch('/api/render', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scene: p.scene, brief: p.brief, image: isUpload ? uploadedPreviews.get(sceneKey) : undefined, references: [...uploadedPreviews.entries()].filter(([id]) => id !== sceneKey).map(([, url]) => url).slice(0, 2) }) })
      .then(r => r.json()).then(d => {
        if (cancelled) return;
        if (d.image) { liveCache.set(key, d.image); setLive(d.image); return; }
        const msg = String(d.error ?? 'no image');
        if (/rate limit/i.test(msg) && tries < 3) { setFailed('busy'); setTimeout(() => { if (!cancelled) setTries(t => t + 1); }, 20000); }
        else setFailed(msg);
      })
      .catch(e => !cancelled && setFailed(String(e)));
    return () => { cancelled = true; };
  }, [key, staticAfter, live, scene, p.brief, p.scene, isUpload, sceneKey, tries]);
  if (!scene) return <div className="blk-body">No photo of the {p.scene} on file yet.</div>;
  const afterSrc = staticAfter ?? live;
  return (
    <figure className="render">
      <div className="render-stage">
        <img src={scene.before} alt={`Your ${p.scene} now`} />
        {afterSrc ? <img src={afterSrc} alt={`Your ${p.scene} after`} className="render-after" style={{ opacity: after ? 1 : 0 }} /> : (
          <div className="render-wait" style={{ opacity: after ? 1 : 0 }}>{failed === 'busy' ? 'The studio is busy, trying again in a moment…' : failed ? `Render failed: ${failed}` : 'Rendering your brief…'}</div>
        )}
      </div>
      <figcaption className="render-cap">
        <span>{p.caption}</span>
        <span className="seg" role="group">
          <button className={!after ? 'seg-on' : ''} onClick={() => setAfter(false)}>Now</button>
          <button className={after ? 'seg-on' : ''} onClick={() => setAfter(true)}>After</button>
        </span>
      </figcaption>
    </figure>
  );
}

// ---- plan.stages ------------------------------------------------------------------------
function PlanStages({ block }: BlockProps) {
  const p = block.props as P;
  const stages = (p.stages ?? []) as { id: string; title: string; when: string; items: string[]; cost: number }[];
  const total = stages.reduce((a, s) => a + (s.cost || 0), 0);
  return (
    <div className="stages">
      {stages.map((s, i) => (
        <div key={s.id} className="stage">
          <div className="stage-n">{i + 1}</div>
          <div className="stage-body">
            <div className="stage-head"><span className="stage-title">{s.title}</span><span className="stage-when">{s.when}</span></div>
            <ul className="stage-items">{(s.items ?? []).map(it => <li key={it}>{it}</li>)}</ul>
          </div>
          <div className="stage-cost">{gbp(s.cost)}</div>
        </div>
      ))}
      <div className="stage stage-total"><div className="stage-n" /><div className="stage-body"><span className="stage-title">Total</span></div><div className="stage-cost">{gbp(total)}</div></div>
    </div>
  );
}

// ---- products.list ----------------------------------------------------------------------
// AI-generated product and service images, fetched lazily, two at a time, cached by brief.
const productImages = new Map<string, string>();
const productWaiters = new Map<string, Promise<string>>();
let productInFlight = 0;
const productQueue: (() => void)[] = [];
function productSlot(): Promise<void> {
  if (productInFlight < 2) { productInFlight++; return Promise.resolve(); }
  return new Promise(res => productQueue.push(() => { productInFlight++; res(); }));
}
function productRelease() { productInFlight--; productQueue.shift()?.(); }
function fetchProductImage(brief: string, kind: string): Promise<string> {
  const key = `${kind}|${brief}`;
  if (productImages.has(key)) return Promise.resolve(productImages.get(key)!);
  if (productWaiters.has(key)) return productWaiters.get(key)!;
  const job = (async () => {
    await productSlot();
    try {
      const r = await fetch('/api/product-image', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ brief, kind }) });
      const d = await r.json();
      if (!d.image) throw new Error(d.error ?? 'no image');
      productImages.set(key, d.image);
      return d.image as string;
    } finally { productRelease(); productWaiters.delete(key); }
  })();
  productWaiters.set(key, job);
  return job;
}

interface ProductItem { name: string; kind: 'product' | 'service'; price: number; detail: string; image_brief: string }
function ProductCard({ item }: { item: ProductItem }) {
  const key = `${item.kind}|${item.image_brief}`;
  const [src, setSrc] = useState<string | null>(productImages.get(key) ?? null);
  const [failed, setFailed] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (src || !item.image_brief) return;
    let cancelled = false;
    fetchProductImage(item.image_brief, item.kind).then(img => { if (!cancelled) setSrc(img); }).catch(e => { if (!cancelled) setFailed(e instanceof Error ? e.message : String(e)); });
    return () => { cancelled = true; };
  }, [src, item.image_brief, item.kind]);
  return (
    <div className="product">
      <div className="product-img">
        {!src && !failed ? <div className="product-shimmer" aria-hidden /> : null}
        {failed ? <div className="product-failed">Image not ready</div> : null}
        {src ? <img src={src} alt={item.name} className={loaded ? 'product-img-in' : ''} onLoad={() => setLoaded(true)} /> : null}
      </div>
      <div className="product-kicker">{item.kind === 'service' ? 'service' : 'product'}</div>
      <div className="product-name">{item.name}</div>
      {typeof item.price === 'number' ? <div className="product-price">{gbp(item.price)}</div> : null}
      {item.detail ? <div className="product-detail">{item.detail}</div> : null}
    </div>
  );
}
function ProductsList({ block }: BlockProps) {
  const p = block.props as P;
  const items = (Array.isArray(p.items) ? p.items : []) as Partial<ProductItem>[];
  const valid = items.filter(it => it && typeof it.name === 'string') as ProductItem[];
  if (!valid.length) return null;
  return (
    <div className="products">
      {valid.map((it, i) => <ProductCard key={`${it.name}-${i}`} item={{ ...it, kind: it.kind === 'service' ? 'service' : 'product', image_brief: it.image_brief ?? it.name }} />)}
    </div>
  );
}

// ---- note.explain -----------------------------------------------------------------------
function NoteExplain({ block }: BlockProps) {
  return <p className="blk-body">{(block.props as P).text}</p>;
}

// ---- list.alternatives ------------------------------------------------------------------
function ListAlternatives({ block }: BlockProps) {
  const { send } = useApp();
  const p = block.props as P;
  return (
    <ul className="alts">
      {((p.items ?? []) as { label: string; detail: string }[]).map(it => (
        <li key={it.label}><button className="alt" onClick={() => send(it.label)}><span className="alt-label">{it.label}</span><span className="alt-detail">{it.detail}</span></button></li>
      ))}
    </ul>
  );
}

// ---- action.cta -------------------------------------------------------------------------
function ActionCta({ block }: BlockProps) {
  const { send, busy } = useApp();
  const p = block.props as P;
  return (
    <div className="cta">
      <button className="btn-primary" disabled={busy} onClick={() => send(`${p.label}: done`)}>{p.label}</button>
      {p.secondary ? <button className="btn-quiet" disabled={busy} onClick={() => send(p.secondary)}>{p.secondary}</button> : null}
    </div>
  );
}

// ---- stat.row ---------------------------------------------------------------------------
function StatRow({ block }: BlockProps) {
  return <StatGrid stats={Array.isArray((block.props as P).stats) ? (block.props as P).stats : []} />;
}

export const REGISTRY: Record<string, ComponentType<BlockProps>> = {
  'status.done': StatusDone,
  'question.single': QuestionSingle,
  'question.text': QuestionText,
  'photo.upload': PhotoUpload,
  'render.compare': RenderCompare,
  'plan.stages': PlanStages,
  'products.list': ProductsList,
  'assumptions.list': AssumptionsList,
  'recommendation.card': RecommendationCard,
  'note.explain': NoteExplain,
  'list.alternatives': ListAlternatives,
  'action.cta': ActionCta,
  'stat.row': StatRow,
};
