// AI-generated product / service image for a products.list card. gpt-image-2, low quality, square.
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
const g = globalThis as unknown as { __productImageCache?: Map<string, string> };
const cache = g.__productImageCache ?? (g.__productImageCache = new Map<string, string>());

export async function POST(req: Request) {
  const { brief, kind } = (await req.json()) as { brief?: string; kind?: string };
  if (!brief || typeof brief !== 'string') return NextResponse.json({ error: 'no brief' }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 503 });
  const prompt = kind === 'service'
    ? `Photograph of ${brief}, natural light, no text, realistic.`
    : `Product photograph of ${brief}, single object, centred, soft neutral off-white background, natural light, no text, no people.`;
  if (cache.has(prompt)) return NextResponse.json({ image: cache.get(prompt), cached: true });
  try {
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-image-2', prompt, size: '1024x1024', quality: 'low', n: 1 }),
    });
    const d = await r.json();
    if (!r.ok || !d.data?.[0]?.b64_json) return NextResponse.json({ error: d.error?.message ?? 'no image' }, { status: 502 });
    const image = `data:image/png;base64,${d.data[0].b64_json}`;
    cache.set(prompt, image);
    return NextResponse.json({ image });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
