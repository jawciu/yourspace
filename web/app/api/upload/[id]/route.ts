import { uploads } from '@/lib/uploads';

export const runtime = 'nodejs';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const u = uploads.get(id);
  if (!u) return new Response('not found', { status: 404 });
  return new Response(new Uint8Array(u.data), { headers: { 'content-type': u.mime, 'cache-control': 'private, max-age=3600' } });
}
