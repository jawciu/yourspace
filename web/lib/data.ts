// Account data and the deterministic calculators. The model never does this arithmetic.
import personasJson from '../data/personas.json';

export interface Persona {
  id: string; name: string; accountNumber: string; address: string;
}

export const PERSONAS = (personasJson as unknown as { personas: Persona[] }).personas;
export const personaById = (id: string) => PERSONAS.find(p => p.id === id) ?? PERSONAS[0];

// ---- solar, kept from the energy version: it prices the solar stage of a plan ----
export type Orientation = 'south' | 'south-east' | 'south-west' | 'east' | 'west' | 'north';
export type Shading = 'none' | 'light' | 'heavy';
const ORIENT: Record<Orientation, number> = { south: 1, 'south-east': 0.95, 'south-west': 0.95, east: 0.85, west: 0.85, north: 0.6 };
const SHADE: Record<Shading, number> = { none: 1, light: 0.9, heavy: 0.7 };
const IMPORT_RATE = 26.32, EXPORT_RATE = 16.5, KWH_PER_KWP = 850, PANEL_KWP = 0.43;

export function solarEstimate(panels: number, orientation: Orientation, shading: Shading, homeInDay: boolean, batteryKwh: 0 | 5 | 10) {
  const kwp = Math.round(panels * PANEL_KWP * 10) / 10;
  const generation = Math.round(kwp * KWH_PER_KWP * ORIENT[orientation] * SHADE[shading] / 10) * 10;
  const selfUse = batteryKwh >= 10 ? 0.8 : batteryKwh === 5 ? 0.7 : homeInDay ? 0.45 : 0.3;
  const saving = Math.round((generation * selfUse * IMPORT_RATE + generation * (1 - selfUse) * EXPORT_RATE) / 100);
  const cost = (panels <= 10 ? 7400 : 8600) + (batteryKwh === 5 ? 4000 : batteryKwh === 10 ? 6000 : 0);
  return { panels, kwp, generation, saving, cost, payback: Math.round(cost / saving * 10) / 10 };
}

// ---- renders ------------------------------------------------------------------------------
// Pre-generated images by scene and version. A version the map does not have is rendered live
// by /api/render from the scene's "before" image and the block's brief, when a key is set.
export interface Scene { before: string; after: Record<string, string> }
export const RENDERS: Record<string, Scene> = {
  exterior: { before: '/house/exterior-before.jpg', after: { default: '/house/exterior-after.jpg' } },
  living: { before: '/house/living-before.jpg', after: { default: '/house/living-after.jpg', timber: '/house/living-after-timber.jpg' } },
};

// What the model may reason from. The company knows the customer's name and address and NOTHING
// about the house. Every fact about the house comes from the customer, one question at a time.
export function accountForPrompt(p: Persona) {
  return {
    customer: { name: p.name, address: p.address },
    houseFacts: 'NONE. We know nothing about the house until the customer tells us. Never invent a listing, an EPC, a year built, a roof, a room size.',
    costRulesOfThumb: {
      loftInsulation: 1500, cavityWallInsulation: 4000, doubleGlazingWholeHouse: 9000, heatPumpAfterGrant: 5500,
      solar12Panels: solarEstimate(12, 'south', 'none', true, 0), battery10kWh: 6000,
      timberCladdingUpperStorey: 9000, frontGardenReplant: 5500, slattedFence: 2200,
      wallPanellingOneWall: 3200, parquetRestore: 2400, livingRoomFurniture: 6000, kitchenRefit: 24000, rearGardenRedesign: 14000,
      bathroomRefit: 12000, bedroomRefresh: 4500, paintingOneRoom: 900, newLightingOneRoom: 1200,
    },
  };
}
