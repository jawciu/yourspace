import { NextResponse } from 'next/server';
import { uploads, newId } from '@/lib/uploads';

export const runtime = 'nodejs';

// POST multipart: file, scene  ->  { id, url }
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file');
  const scene = String(form.get('scene') ?? 'photo');
  if (!(file instanceof Blob)) return NextResponse.json({ error: 'no file' }, { status: 400 });
  const id = newId();
  uploads.set(id, { mime: file.type || 'image/jpeg', data: Buffer.from(await file.arrayBuffer()), scene });
  return NextResponse.json({ id, url: `/api/upload/${id}`, scene });
}
