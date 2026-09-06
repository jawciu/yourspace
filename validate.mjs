#!/usr/bin/env node
// Mechanical rule validator. No dependencies.
//
//   node validate.mjs plan.json [previous-plan.json]
//
// Exit 0 = render it. Exit 1 = do not render it, send the errors back to the model (M23).

import { readFileSync } from 'node:fs'

// ---- the parts you edit per project ------------------------------------------------------

const MAX_BLOCKS = 5
const TIERS = ['hero', 'primary', 'supporting', 'ambient'] // ordered, index = rung on the ladder
const TIER_CAPS = { hero: [1, 1], primary: [0, 1], supporting: [0, 3], ambient: [0, 2] }
const INTENT_CLASSES = ['action', 'input', 'navigation', 'data-display', 'feedback']
const FRAMES = ['focus', 'compare', 'browse', 'monitor']

// The closed vocabulary. Only published components are visible to the model (see vocabulary.md).
// Unpublishing is your fastest lever on the day: do not prompt around a bad component, remove it.
const COMPONENTS = {
  // name: { intent_class, published }
  // 'stat.summary': { intent_class: 'data-display', published: true },
}

// M2. Appearance is not addressable. If a prop name matches, the plan is refused.
const APPEARANCE = /colou?r|background|bg|font|size|scale|width|height|padding|margin|gap|radius|shadow|opacity|weight|align|classname|class|style|css|theme|variant|tw/i

// ------------------------------------------------------------------------------------------

const errors = []
const fail = (rule, msg) => errors.push(`${rule}  ${msg}`)

function validate (plan, prev) {
  if (typeof plan !== 'object' || plan === null || Array.isArray(plan)) {
    return fail('M1', 'plan is not an object')
  }

  const allowedTop = new Set(['intent', 'frame', 'blocks', 'primary_action', 'question'])
  for (const k of Object.keys(plan)) {
    if (!allowedTop.has(k)) fail('M1', `unknown top-level key "${k}". The schema is the vocabulary.`)
  }

  if (typeof plan.intent !== 'string' || plan.intent.trim().length < 3) {
    fail('M1', 'missing "intent". The model must restate the goal in the user\'s terms.')
  }
  if (!FRAMES.includes(plan.frame)) {
    fail('M13', `frame "${plan.frame}" is not one of ${FRAMES.join(', ')}`)
  }

  const blocks = plan.blocks
  if (!Array.isArray(blocks) || blocks.length === 0) return fail('M5', 'blocks must be a non-empty array')
  if (blocks.length > MAX_BLOCKS) {
    fail('M5', `${blocks.length} blocks, cap is ${MAX_BLOCKS}. The model is hedging.`)
  }

  const seen = new Set()
  for (const [i, b] of blocks.entries()) {
    const at = `blocks[${i}]`

    if (typeof b.id !== 'string' || !/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(b.id)) {
      fail('M14', `${at}.id "${b.id}" is not a semantic dotted id (e.g. filter.price)`)
    } else if (/^block[._]?\d|^item[._]?\d|\.\d+$/.test(b.id)) {
      fail('M14', `${at}.id "${b.id}" looks positional. Ids must survive reordering.`)
    } else if (seen.has(b.id)) {
      fail('M14', `${at}.id "${b.id}" is duplicated`)
    } else {
      seen.add(b.id)
    }

    const known = COMPONENTS[b.component]
    if (Object.keys(COMPONENTS).length === 0) {
      // vocabulary not filled in yet, skip rather than fail every plan
    } else if (!known) {
      fail('M1', `${at}.component "${b.component}" is not in the vocabulary`)
    } else if (!known.published) {
      fail('M1', `${at}.component "${b.component}" is unpublished and invisible to the model`)
    } else if (known.intent_class !== b.intent_class) {
      fail('M10', `${at} declares intent_class "${b.intent_class}" but "${b.component}" is "${known.intent_class}"`)
    }

    if (!INTENT_CLASSES.includes(b.intent_class)) {
      fail('M10', `${at}.intent_class "${b.intent_class}" is not one of ${INTENT_CLASSES.join(', ')}`)
    }
    if (!TIERS.includes(b.tier)) {
      fail('M10', `${at}.tier "${b.tier}" is not one of ${TIERS.join(', ')}`)
    }

    if (typeof b.why !== 'string' || b.why.trim().length < 8) {
      fail('M9', `${at}.why is missing. A block it cannot justify is a block it is guessing at.`)
    } else if (b.why.length > 80) {
      fail('M9', `${at}.why is ${b.why.length} chars, cap is 80`)
    }

    for (const k of Object.keys(b.props ?? {})) {
      if (APPEARANCE.test(k)) {
        fail('M2', `${at}.props.${k} is an appearance concern. The model does not get to decide this.`)
      }
    }

    for (const k of Object.keys(b)) {
      if (!['id', 'component', 'intent_class', 'tier', 'why', 'props'].includes(k)) {
        fail('M1', `${at}.${k} is not part of the contract`)
      }
    }
  }

  for (const [tier, [min, max]] of Object.entries(TIER_CAPS)) {
    const n = blocks.filter(b => b.tier === tier).length
    if (n < min) fail(tier === 'hero' ? 'M6' : 'M7', `${n} blocks at tier "${tier}", minimum is ${min}`)
    if (n > max) fail(tier === 'hero' ? 'M6' : 'M7', `${n} blocks at tier "${tier}", maximum is ${max}`)
  }

  const pa = plan.primary_action
  if (!pa || typeof pa.block_id !== 'string' || typeof pa.label !== 'string') {
    fail('M8', 'primary_action must be { block_id, label }')
  } else if (!seen.has(pa.block_id)) {
    fail('M8', `primary_action.block_id "${pa.block_id}" does not match any block`)
  }

  // ---- cross-turn rules, only when a previous plan is supplied ----
  if (prev) {
    const prevTier = new Map((prev.blocks ?? []).map(b => [b.id, b.tier]))

    for (const b of blocks) {
      const was = prevTier.get(b.id)
      if (!was) continue
      const jump = Math.abs(TIERS.indexOf(b.tier) - TIERS.indexOf(was))
      if (jump > 1) {
        fail('M16', `"${b.id}" jumped ${was} -> ${b.tier}. One tier per turn.`)
      }
    }

    const union = new Set([...prevTier.keys(), ...seen])
    let changed = 0
    for (const id of union) {
      const a = (prev.blocks ?? []).find(x => x.id === id)
      const c = blocks.find(x => x.id === id)
      if (!a || !c || JSON.stringify(a) !== JSON.stringify(c)) changed++
    }
    if (changed > union.size / 2) {
      // Not a refusal. A routing decision: this needs an explicit transition, not a cross-fade.
      console.error(`M17  ${changed}/${union.size} blocks changed. Render an explicit transition, do not cross-fade.`)
    }
  }
}

const [, , planPath, prevPath] = process.argv
if (!planPath) {
  console.error('usage: node validate.mjs plan.json [previous-plan.json]')
  process.exit(2)
}

const plan = JSON.parse(readFileSync(planPath, 'utf8'))
const prev = prevPath ? JSON.parse(readFileSync(prevPath, 'utf8')) : null

validate(plan, prev)

if (errors.length) {
  console.error(`REFUSED (${errors.length})\n`)
  for (const e of errors) console.error('  ' + e)
  console.error('\nSend these back to the model with the plan and regenerate once (M23).')
  process.exit(1)
}
console.log('PASS')
