import { type CardRoot, type PendantRoot, type BeginEffect } from '../../store/data'

export interface Catalog {
  triggers: string[]
  functions: string[]
  attrs: string[]
  targets: string[]
  comps: string[]
  examples: Record<string, string[]>
}

function addExample(map: Record<string, string[]>, key: string, sample: string, limit = 3) {
  if (!map[key]) map[key] = []
  if (map[key].length < limit && !map[key].includes(sample)) map[key].push(sample)
}

export function scanEffectString(eff: string, examples: Record<string, string[]>) {
  const triggers = new Set<string>()
  const functions = new Set<string>()
  const attrs = new Set<string>()
  const targets = new Set<string>()
  const comps = new Set<string>()

  const parts = (eff || '').split('#').map(s => s.trim()).filter(Boolean)
  for (const p of parts) {
    const m = p.match(/^(.*?)\s*<\s*(.*)\s*>/)
    if (m) {
      const trig = (m[1] || '').trim()
      if (trig) triggers.add(trig)
      const inner = m[2] || ''
      // conditions
      const conds = inner.match(/\{([^{}]+)\}/g) || []
      for (const c of conds) {
        const body = c.slice(1, -1)
        const ps = body.split(',')
        if (ps[0]) targets.add(ps[0].trim())
        if (ps[1]) attrs.add(ps[1].trim())
        if (ps[2]) comps.add(ps[2].trim())
        // functions inside condition
        const funs = body.match(/([A-Za-z][A-Za-z0-9_]*)\(/g) || []
        for (const f of funs) functions.add(f.replace('(', ''))
      }
      // actions
      const acts = inner.match(/\[([^\[\]]+)\]/g) || []
      for (const a of acts) {
        const body = a.slice(1, -1)
        const fm = body.match(/^([A-Za-z][A-Za-z0-9_]*)\((.*)\)$/)
        if (fm) {
          const fname = fm[1]
          functions.add(fname)
          addExample(examples, fname, body)
        } else {
          const ps = body.split(',')
          if (ps[0]) targets.add(ps[0].trim())
          if (ps[1]) attrs.add(ps[1].trim())
          // also catch nested functions as tokens
          const funs = body.match(/([A-Za-z][A-Za-z0-9_]*)\(/g) || []
          for (const f of funs) functions.add(f.replace('(', ''))
        }
      }
    } else {
      // BeginEffect-like or raw
      const fm = p.match(/^([A-Za-z][A-Za-z0-9_]*)\((.*)\)$/)
      if (fm) {
        const fname = fm[1]
        functions.add(fname)
        addExample(examples, fname, p)
      } else if (p.startsWith('Global,')) {
        const ps = p.split(',')
        if (ps[1]) attrs.add(ps[1].trim())
      }
    }
  }

  return { triggers, functions, attrs, targets, comps }
}

export function buildCatalog(data: { cards?: CardRoot | null, pendants?: PendantRoot | null, begin?: BeginEffect[] | null }): Catalog {
  const examples: Record<string, string[]> = {}
  const T = new Set<string>()
  const F = new Set<string>()
  const A = new Set<string>()
  const R = new Set<string>()
  const C = new Set<string>()

  const scan = (eff?: string) => {
    if (!eff) return
    const r = scanEffectString(eff, examples)
    r.triggers.forEach(v => T.add(v))
    r.functions.forEach(v => F.add(v))
    r.attrs.forEach(v => A.add(v))
    r.targets.forEach(v => R.add(v))
    r.comps.forEach(v => C.add(v))
  }

  data.cards?.Cards?.forEach((c: any) => scan(String(c.EffectString || '')))
  data.pendants?.Pendant?.forEach((p: any) => scan(String(p.EffectString || '')))
  data.begin?.forEach((b: any) => scan(String(b.EffectString || '')))

  const toArr = (s: Set<string>) => Array.from(s).sort((a,b)=>a.localeCompare(b,'zh'))
  return {
    triggers: toArr(T),
    functions: toArr(F),
    attrs: toArr(A),
    targets: toArr(R),
    comps: toArr(C),
    examples,
  }
}

