// Deterministic annual cost estimate. The model never does this arithmetic, it only chooses
// which blocks to show and how to explain the numbers this returns.
//   node data/estimate.mjs            -> table of every persona on every eligible tariff
//   import { estimate, compare } from './data/estimate.mjs'
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const TARIFFS = JSON.parse(readFileSync(join(here, 'tariffs.json'), 'utf8')).tariffs;
export const PERSONAS = JSON.parse(readFileSync(join(here, 'personas.json'), 'utf8')).personas;

const DAYS = 365;
const pounds = p => Math.round(p) / 100;

export function eligible(persona, tariff) {
  const smart = Object.values(persona.meters).every(m => m.type === 'smart');
  if (tariff.id === 'drive') return smart && (persona.usage.evChargingExpectedKwh > 0 || persona.usage.evChargingShare > 0);
  if (tariff.id === 'sunlight') return smart && persona.solar?.hasSolar === true;
  if (tariff.id === 'tracker') return smart;
  return true;
}

// Annual cost in £ for a persona on a tariff. offPeakShare: fraction of electricity usage
// moved into the off-peak window (only matters for time-of-use tariffs).
export function estimate(persona, tariff, { offPeakShare = null } = {}) {
  const u = persona.usage;
  const evKwh = u.evChargingExpectedKwh || 0;
  const elecKwh = u.electricity + evKwh;
  let elecPence;
  if (tariff.type === 'time-of-use') {
    // Default assumption: all EV charging plus 15% of household usage happens off-peak.
    const share = offPeakShare ?? (evKwh + u.electricity * 0.15) / elecKwh;
    const off = elecKwh * share, peak = elecKwh - off;
    elecPence = off * tariff.electricity.offPeakRate + peak * tariff.electricity.unitRate;
  } else {
    elecPence = elecKwh * tariff.electricity.unitRate;
  }
  elecPence += DAYS * tariff.electricity.standingCharge;
  let gasPence = 0;
  if (persona.fuels.includes('gas')) {
    gasPence = u.gas * tariff.gas.unitRate + DAYS * tariff.gas.standingCharge;
  }
  const total = pounds(elecPence + gasPence);
  return { tariffId: tariff.id, electricity: pounds(elecPence), gas: pounds(gasPence), total, monthly: Math.round(total / 12) };
}

// Everything the tariff page needs: current cost, each eligible alternative, saving vs current.
export function compare(persona) {
  const current = TARIFFS.find(t => t.id === persona.currentTariff);
  const now = estimate(persona, current);
  const options = TARIFFS.filter(t => eligible(persona, t) && t.id !== current.id).map(t => {
    const e = estimate(persona, t);
    return { ...e, name: t.name, type: t.type, saving: Math.round(now.total - e.total), exitFee: t.exitFeePerFuel * persona.fuels.length, summary: t.summary };
  }).sort((a, b) => b.saving - a.saving);
  return { persona: persona.id, current: { ...now, name: current.name }, options };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const p of PERSONAS) {
    const c = compare(p);
    console.log(`\n${p.name}  (${p.usage.electricity} kWh elec, ${p.usage.gas} kWh gas${p.usage.evChargingExpectedKwh ? ', +' + p.usage.evChargingExpectedKwh + ' EV' : ''})`);
    console.log(`  now: ${c.current.name.padEnd(22)} £${c.current.total}/yr  (£${c.current.monthly}/mo)`);
    for (const o of c.options) console.log(`  ${o.name.padEnd(22)} £${String(o.total).padEnd(6)}/yr  saving £${o.saving}`);
  }
}
