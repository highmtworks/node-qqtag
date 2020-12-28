export class Quote {
  private readonly value: any
  constructor(value: any) {
    this.value = value
  }
}

interface QuotePrivateAccessor {
  readonly value: any
}

export class UnQuote {
  private readonly value: Quote | QuasiQuote | Function
  constructor(value: Quote | QuasiQuote | Function) {
    this.value = value
  }
}

interface UnQuotePrivateAccessor {
  readonly value: Quote | QuasiQuote | Function
}

export class QuasiQuote {
  private readonly ss: string[]
  private readonly vs: any[]
  private readonly isEvaluated?: boolean
  constructor(ss: string[], vs: any[], isEvaluated: boolean) {
    this.ss = ss
    this.vs = vs
    this.isEvaluated = isEvaluated
  }
  static empty(): QuasiQuote {
    return new QuasiQuote([''], [], true)
  }
  get isEmpty(): boolean {
    return this.ss.length == 1 && this.ss[0] === ''
  }
  evaluated(): QuasiQuote {
    return QuasiQuote.evalQ(this)
  }
  intoTag(): [string[], ...any[]] {
    const qEvaled = QuasiQuote.evalQ(this)
    return [qEvaled.ss, ...qEvaled.vs]
  }
  sendTo<T>(f: ((ss: TemplateStringsArray, ...vs: any[]) => T) | ((ss: string[], ...vs: any[]) => T)): T {
    return (f as (ss: any, ...vs: any[]) => T).apply(null, this.intoTag())
  }
  private static evalQ(q: QuasiQuote): QuasiQuote {
    if (q.isEvaluated) return q
    const q_ss = q.ss.slice(0)
    const q_vs = q.vs.slice(0)
    let i = 0
    while (i < q_vs.length) {
      if (q_vs[i] instanceof Quote) {
        const nq = q_vs.splice(i, 1)[0] as QuotePrivateAccessor
        const t0 = q_ss.splice(i, 1)[0]
        const tz = q_ss.splice(i, 1)[0] // next item always exists
        q_ss.splice(i, 0, `${t0}${nq.value}${tz}`)
      } else if (q_vs[i] instanceof UnQuote) {
        const nq = q_vs[i] as UnQuotePrivateAccessor
        const nv = nq.value instanceof Function ? nq.value() : nq.value
        if (nv === undefined) {
          const t0 = q_ss.splice(i, 1)[0]
          const tz = q_ss.splice(i, 1)[0] // next item always exists
          q_ss.splice(i, 0, `${t0}${tz}`)
          q_vs.splice(i, 1)
        } else {
          q_vs.splice(i, 1, nv)
        }
      } else if (q_vs[i] instanceof QuasiQuote) {
        const nq = q_vs[i] as QuasiQuote
        const t0 = q_ss.splice(i, 1)[0]
        const tz = q_ss.splice(i, 1)[0] // next item always exists
        const nq_ss = nq.ss.slice(0)
        const nt0 = nq_ss.splice(0, 1).join('')
        if (nq_ss.length > 0) {
          const ntz = nq_ss.splice(nq_ss.length - 1, 1).join('')
          q_ss.splice(i, 0, `${t0}${nt0}`, ...nq_ss, `${ntz}${tz}`)
        } else {
          q_ss.splice(i, 0, `${t0}${nt0}${tz}`)
        }
        q_vs.splice(i, 1, ...nq.vs)
      } else {
        i += 1
      }
    }
    return new QuasiQuote(q_ss, q_vs, true)
  }
  static joinQ(sep: string, q1: QuasiQuote, q2: QuasiQuote): QuasiQuote {
    const s = [...q1.ss.slice(0, q1.ss.length - 1), q1.ss[q1.ss.length - 1] + sep + q2.ss[0], ...q2.ss.slice(1)]
    const v = [...q1.vs, ...q2.vs]
    return new QuasiQuote(s, v, false)
  }
}

export const quote = (value: any) => new Quote(value)

export const unquote = (qq: Quote | QuasiQuote | Function) => new UnQuote(qq)

export const quasiquote = (ss: TemplateStringsArray, ...vs: any[]) => new QuasiQuote(Array.from(ss), Array.from(vs), false)

export const concatQ = (sep: string, qs: QuasiQuote[]): QuasiQuote => {
  if (qs.length == 0) {
    return QuasiQuote.empty()
  } else {
    return qs.slice(1).reduce((a, q) => QuasiQuote.joinQ(sep, a, q), qs[0])
  }
}
