// In-memory photo store for uploaded images. Survives HMR via globalThis. Dev-server scale only.
export interface Stored { mime: string; data: Buffer; scene: string }
const g = globalThis as unknown as { __uploads?: Map<string, Stored> };
export const uploads = g.__uploads ?? (g.__uploads = new Map<string, Stored>());
export const newId = () => 'up_' + Math.random().toString(36).slice(2, 8);
