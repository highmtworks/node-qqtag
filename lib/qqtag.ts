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
  private readonly value: Quote | QuasiQuote | (() => any) | Promise<Quote> | Promise<QuasiQuote> | (() => Promise<any>)
  constructor(value: Quote | QuasiQuote | (() => any) | Promise<Quote> | Promise<QuasiQuote> | (() => Promise<any>)) {
    this.value = value
  }
}

interface UnQuotePrivateAccessor {
  readonly value: Quote | QuasiQuote | (() => any) | Promise<Quote> | Promise<QuasiQuote> | (() => Promise<any>)
}

class QuasiQuoteImpl {
  readonly rs: string[]
  readonly ss: string[]
  readonly vs: any[]
  readonly isEvaluated?: boolean
  constructor(rs: string[], ss: string[], vs: any[], isEvaluated: boolean) {
    this.rs = rs
    this.ss = ss
    this.vs = vs
    this.isEvaluated = isEvaluated
  }
}

export class QuasiQuote {
  private readonly value: QuasiQuoteImpl
  constructor(value: QuasiQuoteImpl) {
    this.value = value
  }
  static empty(): QuasiQuote {
    return new QuasiQuote(new QuasiQuoteImpl([''], [''], [], true))
  }
  get isEmpty(): boolean {
    return this.value.ss.length == 1 && this.value.ss[0] === ''
  }
  evaluated(): QuasiQuote {
    return new QuasiQuote(evalQ(this.value))
  }
  async evaluatedAsync(): Promise<QuasiQuote> {
    return new QuasiQuote(await evalAsyncQ(this.value))
  }
  intoTag(): [TemplateStringsArray, ...any[]] {
    const qEvalled = evalQ(this.value)
    return [newArrayWithRaw(qEvalled.rs, qEvalled.ss), ...qEvalled.vs]
  }
  async intoTagAsync(): Promise<[TemplateStringsArray, ...any[]]> {
    const qEvalled = await evalAsyncQ(this.value)
    return [newArrayWithRaw(qEvalled.rs, qEvalled.ss), ...qEvalled.vs]
  }
  sendTo<T>(f: ((ss: TemplateStringsArray, ...vs: any[]) => T) | ((ss: readonly string[], ...vs: any[]) => T)): T {
    return f.apply(null, this.intoTag())
  }
  async sendToAsync<T>(f: ((ss: TemplateStringsArray, ...vs: any[]) => (T | Promise<T>)) | ((ss: readonly string[], ...vs: any[]) => (T | Promise<T>))): Promise<T> {
    return await f.apply(null, await this.intoTagAsync())
  }
  static joinQ(sep: string, q1: QuasiQuote, q2: QuasiQuote): QuasiQuote {
    const r = [...q1.value.rs.slice(0, q1.value.rs.length - 1), q1.value.rs[q1.value.rs.length - 1] + sep + q2.value.rs[0], ...q2.value.rs.slice(1)]
    const s = [...q1.value.ss.slice(0, q1.value.ss.length - 1), q1.value.ss[q1.value.ss.length - 1] + sep + q2.value.ss[0], ...q2.value.ss.slice(1)]
    const v = [...q1.value.vs, ...q2.value.vs]
    return new QuasiQuote(new QuasiQuoteImpl(r, s, v, false))
  }
}

interface QuasiQuotePrivateAccessor {
  readonly value: QuasiQuoteImpl
}

const evalQuoteQ = (i: number, q_rs: string[], q_ss: string[], q_vs: any[]) => {
  const nq = q_vs[i] as QuotePrivateAccessor
  const r0 = q_rs.splice(i, 1)[0]
  const s0 = q_ss.splice(i, 1)[0]
  const rz = q_rs.splice(i, 1)[0] // next item always exists
  const sz = q_ss.splice(i, 1)[0]
  q_rs.splice(i, 0, `${r0}${nq.value}${rz}`)
  q_ss.splice(i, 0, `${s0}${nq.value}${sz}`)
  q_vs.splice(i, 1)
}

const evalUnQuoteQ = (i: number, q_rs: string[], q_ss: string[], q_vs: any[]) => {
  const nq = q_vs[i] as UnQuotePrivateAccessor
  const nv = nq.value instanceof Function ? nq.value() : nq.value
  if (nv === undefined) {
    const r0 = q_rs.splice(i, 1)[0]
    const s0 = q_ss.splice(i, 1)[0]
    const rz = q_rs.splice(i, 1)[0] // next item always exists
    const sz = q_ss.splice(i, 1)[0]
    q_rs.splice(i, 0, `${r0}${rz}`)
    q_ss.splice(i, 0, `${s0}${sz}`)
    q_vs.splice(i, 1)
  } else {
    q_vs.splice(i, 1, nv)
  }
}

const evalPromiseQ = async (i: number, q_rs: string[], q_ss: string[], q_vs: any[]) => {
  const nv = await q_vs[i]
  if (nv === undefined) {
    const r0 = q_rs.splice(i, 1)[0]
    const s0 = q_ss.splice(i, 1)[0]
    const rz = q_rs.splice(i, 1)[0] // next item always exists
    const sz = q_ss.splice(i, 1)[0]
    q_rs.splice(i, 0, `${r0}${rz}`)
    q_ss.splice(i, 0, `${s0}${sz}`)
    q_vs.splice(i, 1)
  } else {
    q_vs.splice(i, 1, await q_vs[i])
  }
}

const evalQuasiQuoteQ = (i: number, q_rs: string[], q_ss: string[], q_vs: any[]) => {
  const nq = q_vs[i] as QuasiQuotePrivateAccessor
  const r0 = q_rs.splice(i, 1)[0]
  const s0 = q_ss.splice(i, 1)[0]
  const rz = q_rs.splice(i, 1)[0] // next item always exists
  const sz = q_ss.splice(i, 1)[0]
  const nq_rs = nq.value.rs.slice(0)
  const nq_ss = nq.value.ss.slice(0)
  const nr0 = nq_rs.splice(0, 1).join('')
  const ns0 = nq_ss.splice(0, 1).join('')
  if (nq_ss.length > 0) {
    const nrz = nq_rs.splice(nq_rs.length - 1, 1).join('')
    const nsz = nq_ss.splice(nq_ss.length - 1, 1).join('')
    q_rs.splice(i, 0, `${r0}${nr0}`, ...nq_rs, `${nrz}${rz}`)
    q_ss.splice(i, 0, `${s0}${ns0}`, ...nq_ss, `${nsz}${sz}`)
  } else {
    q_rs.splice(i, 0, `${r0}${nr0}${rz}`)
    q_ss.splice(i, 0, `${s0}${ns0}${sz}`)
  }
  q_vs.splice(i, 1, ...nq.value.vs)
}

const evalQ = (q: QuasiQuoteImpl): QuasiQuoteImpl => {
  if (q.isEvaluated) return q
  const q_rs = q.rs.slice(0)
  const q_ss = q.ss.slice(0)
  const q_vs = q.vs.slice(0)
  let i = 0
  while (i < q_vs.length) {
    if (q_vs[i] instanceof Quote) {
      evalQuoteQ(i, q_rs, q_ss, q_vs)
    } else if (q_vs[i] instanceof UnQuote) {
      evalUnQuoteQ(i, q_rs, q_ss, q_vs)
    } else if (q_vs[i] instanceof QuasiQuote) {
      evalQuasiQuoteQ(i, q_rs, q_ss, q_vs)
    } else {
      i += 1
    }
  }
  return new QuasiQuoteImpl(q_rs, q_ss, q_vs, true)
}

const evalAsyncQ = async (q: QuasiQuoteImpl): Promise<QuasiQuoteImpl> => {
  if (q.isEvaluated) return q
  const q_rs = q.rs.slice(0)
  const q_ss = q.ss.slice(0)
  const q_vs = q.vs.slice(0)
  let i = 0
  while (i < q_vs.length) {
    if (q_vs[i] instanceof Quote) {
      evalQuoteQ(i, q_rs, q_ss, q_vs)
    } else if (q_vs[i] instanceof UnQuote) {
      evalUnQuoteQ(i, q_rs, q_ss, q_vs)
    } else if (q_vs[i] instanceof QuasiQuote) {
      evalQuasiQuoteQ(i, q_rs, q_ss, q_vs)
    } else if (q_vs[i] instanceof Promise) {
      await evalPromiseQ(i, q_rs, q_ss, q_vs)
    } else {
      i += 1
    }
  }
  return new QuasiQuoteImpl(q_rs, q_ss, q_vs, true)
}

const newArrayWithRaw = (raw: readonly string[], arr: string[]): TemplateStringsArray =>
  Object.defineProperty(Array.from(arr) as string[] & { readonly raw: typeof raw; }, 'raw', {
    value: raw,
    writable: false,
    enumerable: false,
    configurable: false,
  })

export const quote = (value: any) => new Quote(value)

export const unquote = (qq: Quote | QuasiQuote | (() => any) | Promise<Quote> | Promise<QuasiQuote> | (() => Promise<any>)) => new UnQuote(qq)

export const quasiquote = (ss: TemplateStringsArray, ...vs: any[]) => new QuasiQuote(new QuasiQuoteImpl(Array.from(ss.raw), Array.from(ss), Array.from(vs), false))

export const concatQ = (sep: string, qs: QuasiQuote[]): QuasiQuote => {
  if (qs.length === 0) {
    return QuasiQuote.empty()
  } else {
    return qs.slice(1).reduce((a, q) => QuasiQuote.joinQ(sep, a, q), qs[0])
  }
}

export const stringify = (ss: TemplateStringsArray, ...vs: any[]) => {
  if (vs.length === 0) {
    return ''
  } else {
    return vs.reduce((a, c, i) => `${a}${c}${ss[i + 1]}`, ss[0])
  }
}
