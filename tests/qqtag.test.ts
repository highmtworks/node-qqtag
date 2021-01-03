import { quasiquote as qq, quote as qt, unquote as uq, concatQ, stringify } from '../lib/qqtag'

describe('qqtag', () => {
  const mockContext = {}
  describe('quasiquote', () => {
    it('creates empty quasiquote', () => {
      const q = qq``
      expect(q.isEmpty).toBeTruthy()
      const t = q.intoTag()
      expect(t).toEqual([['']])
      expect(t[0].raw).toEqual([''])
    })
    it('creates quasiquote with no unquote', () => {
      const q = qq`1`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['1']])
      expect(t[0].raw).toEqual(['1'])
    })
    it('creates quasiquote with no unquote with raw property tracked', () => {
      const q = qq`\n`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['\n']])
      expect(t[0].raw).toEqual(['\\n'])
    })
    it('creates quasiquote with unquote at right-most edge', () => {
      const q = qq`1${2}`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['1', ''], 2])
      expect(t[0].raw).toEqual(['1', ''])
    })
    it('creates quasiquote with unquote at left-most edge', () => {
      const q = qq`${2}1`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['', '1'], 2])
      expect(t[0].raw).toEqual(['', '1'])
    })
    it('creates quasiquote with unquotes', () => {
      const q = qq`1${4}2${5}3`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['1', '2', '3'], 4, 5])
      expect(t[0].raw).toEqual(['1', '2', '3'])
    })
    it('creates quasiquote with unquotes with no text', () => {
      const q = qq`${4}${5}`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['', '', ''], 4, 5])
      expect(t[0].raw).toEqual(['', '', ''])
    })
    it('creates quasiquote with unquotes with the raw property tracked', () => {
      const q = qq`\n${1}\t`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['\n', '\t'], 1])
      expect(t[0].raw).toEqual(['\\n', '\\t'])
    })
  })
  describe('quote', () => {
    it('creates quasiquote with unquote+quote at right-most edge', () => {
      const q = qq`1${qt(2)}`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['12']])
      expect(t[0].raw).toEqual(['12'])
    })
    it('creates quasiquote with unquote+quote at left-most edge', () => {
      const q = qq`${qt(2)}1`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['21']])
      expect(t[0].raw).toEqual(['21'])
    })
    it('creates quasiquote with unquotes+quotes', () => {
      const q = qq`1${qt(4)}2${qt(5)}3`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['14253']])
      expect(t[0].raw).toEqual(['14253'])
    })
    it('creates quasiquote with unquotes+quotes with no text', () => {
      const q = qq`${qt(4)}${qt(5)}`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['45']])
      expect(t[0].raw).toEqual(['45'])
    })
    it('creates quasiquote with unquote+quote+nested template literal', () => {
      const q = qq`${qt(`${2}`)}`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['2']])
      expect(t[0].raw).toEqual(['2'])
    })
    it('creates quasiquote with unquotes+quotes with the raw property tracked', () => {
      const q = qq`\n${qt(1)}\t`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['\n1\t']])
      expect(t[0].raw).toEqual(['\\n1\\t'])
    })
  })
  describe('unquote', () => {
    it('creates quasiquote with dynamic unquote', () => {
      const q = qq`${uq(() => 2)}`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['', ''], 2])
      expect(t[0].raw).toEqual(['', ''])
    })
    it('creates quasiquote with explicit unquote+quote', () => {
      const q = qq`${uq(qt(2))}`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['2']])
      expect(t[0].raw).toEqual(['2'])
    })
    it('creates quasiquote with dynamic unquote+quote', () => {
      const q = qq`${uq(() => qt(2))}`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['2']])
      expect(t[0].raw).toEqual(['2'])
    })
    it('creates quasiquote with explicit unquote+quasiquote', () => {
      const q = qq`${uq(qq`2`)}`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['2']])
      expect(t[0].raw).toEqual(['2'])
    })
    it('creates quasiquote with dynamic unquote+quasiquote', () => {
      const q = qq`${uq(() => qq`2`)}`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['2']])
      expect(t[0].raw).toEqual(['2'])
    })
    it('creates quasiquote with dynamic unquote+quasiquote with the raw property tracked', () => {
      const q = qq`${uq(() => qq`\n`)}`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['\n']])
      expect(t[0].raw).toEqual(['\\n'])
    })
    it('creates quasiquote with explicit unquote+quasiquote+unquote', () => {
      const q = qq`${uq(qq`2${1}3`)}`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['2', '3'], 1])
      expect(t[0].raw).toEqual(['2', '3'])
    })
    it('creates quasiquote with dynamic unquote+quasiquote+unquote', () => {
      const q = qq`${uq(() => qq`2${1}3`)}`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['2', '3'], 1])
      expect(t[0].raw).toEqual(['2', '3'])
    })
    it('creates quasiquote with dynamic unquote+quasiquote+unquote with raw property tracked', () => {
      const q = qq`${uq(() => qq`\n${1}\t`)}`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['\n', '\t'], 1])
      expect(t[0].raw).toEqual(['\\n', '\\t'])
    })
    it('creates quasiquote with dynamic unquote+quasiquote+dynamic unquote', () => {
      const q = qq`${uq(() => qq`2${uq(() => 1)}3`)}`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['2', '3'], 1])
      expect(t[0].raw).toEqual(['2', '3'])
    })
    it('creates quasiquote with dynamic unquote+quasiquote+dynamic unquote+quasiquote', () => {
      const q = qq`${uq(() => qq`2${uq(() => qq`4${1}5`)}3`)}`
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['24', '53'], 1])
      expect(t[0].raw).toEqual(['24', '53'])
    })
    it('is trimmed if it returns undefined', () => {
      let b = false
      const q = qq`1${uq(() => { if (b) { return 3 } })}2`
      expect(q.isEmpty).toBeFalsy()
      const t1 = q.intoTag()
      expect(t1).toEqual([['12']])
      expect(t1[0].raw).toEqual(['12'])
      b = true
      const t2 = q.intoTag()
      expect(t2).toEqual([['1', '2'], 3])
      expect(t2[0].raw).toEqual(['1', '2'])
    })
    it('is trimmed if it returns undefined with raw property tracked', () => {
      let b = false
      const q = qq`\n${uq(() => { if (b) { return 3 } })}\t`
      expect(q.isEmpty).toBeFalsy()
      const t1 = q.intoTag()
      expect(t1).toEqual([['\n\t']])
      expect(t1[0].raw).toEqual(['\\n\\t'])
      b = true
      const t2 = q.intoTag()
      expect(t2).toEqual([['\n', '\t'], 3])
      expect(t2[0].raw).toEqual(['\\n', '\\t'])
    })
    it('is not trimmed if it returns null', () => {
      let b = false
      const q = qq`1${uq(() => { if (b) { return 3 } else { return null } })}2`
      expect(q.isEmpty).toBeFalsy()
      const t1 = q.intoTag()
      expect(t1).toEqual([['1', '2'], null])
      expect(t1[0].raw).toEqual(['1', '2'])
      b = true
      const t2 = q.intoTag()
      expect(t2).toEqual([['1', '2'], 3])
      expect(t2[0].raw).toEqual(['1', '2'])
    })
  })
  describe('unquote async', () => {
    it('creates quasiquote with dynamic unquote', async () => {
      const q = qq`${uq(() => Promise.resolve(2))}`
      expect(q.isEmpty).toBeFalsy()
      const t = await q.intoTagAsync()
      expect(t).toEqual([['', ''], 2])
      expect(t[0].raw).toEqual(['', ''])
    })
    it('creates quasiquote with dynamic unquote returning reject', async () => {
      const q = qq`${uq(() => Promise.reject(new Error("e")))}`
      expect(q.isEmpty).toBeFalsy()
      await expect(async () => await q.intoTagAsync()).rejects.toThrowError("e")
    })
    it('creates quasiquote with explicit unquote+quote', async () => {
      const q = qq`${uq(Promise.resolve(qt(2)))}`
      expect(q.isEmpty).toBeFalsy()
      const t = await q.intoTagAsync()
      expect(t).toEqual([['2']])
      expect(t[0].raw).toEqual(['2'])
    })
    it('creates quasiquote with explicit unquote+quasiquote', async () => {
      const q = qq`${uq(Promise.resolve(qq`2`))}`
      expect(q.isEmpty).toBeFalsy()
      const t = await q.intoTagAsync()
      expect(t).toEqual([['2']])
      expect(t[0].raw).toEqual(['2'])
    })
    it('creates quasiquote with dynamic unquote+quasiquote', async () => {
      const q = qq`${uq(async () => qq`2`)}`
      expect(q.isEmpty).toBeFalsy()
      const t = await q.intoTagAsync()
      expect(t).toEqual([['2']])
      expect(t[0].raw).toEqual(['2'])
    })
    it('creates quasiquote with explicit unquote+quasiquote+unquote', async () => {
      const q = qq`${uq(Promise.resolve(qq`2${1}3`))}`
      expect(q.isEmpty).toBeFalsy()
      const t = await q.intoTagAsync()
      expect(t).toEqual([['2', '3'], 1])
      expect(t[0].raw).toEqual(['2', '3'])
    })
    it('creates quasiquote with dynamic unquote+quasiquote+unquote', async () => {
      const q = qq`${uq(async () => qq`2${1}3`)}`
      expect(q.isEmpty).toBeFalsy()
      const t = await q.intoTagAsync()
      expect(t).toEqual([['2', '3'], 1])
      expect(t[0].raw).toEqual(['2', '3'])
    })
    it('creates quasiquote with dynamic unquote+quasiquote+dynamic unquote', async () => {
      const q = qq`${uq(async () => qq`2${uq(async () => 1)}3`)}`
      expect(q.isEmpty).toBeFalsy()
      const t = await q.intoTagAsync()
      expect(t).toEqual([['2', '3'], 1])
      expect(t[0].raw).toEqual(['2', '3'])
    })
    it('creates quasiquote with dynamic unquote+quasiquote+dynamic unquote+quasiquote', async () => {
      const q = qq`${uq(async () => qq`2${uq(async () => qq`4${1}5`)}3`)}`
      expect(q.isEmpty).toBeFalsy()
      const t = await q.intoTagAsync()
      expect(t).toEqual([['24', '53'], 1])
      expect(t[0].raw).toEqual(['24', '53'])
    })
    it('is trimmed if it returns undefined', async () => {
      let b = false
      const q = qq`1${uq(async () => { if (b) { return 3 } })}2`
      expect(q.isEmpty).toBeFalsy()
      const t1 = await q.intoTagAsync()
      expect(t1).toEqual([['12']])
      expect(t1[0].raw).toEqual(['12'])
      b = true
      const t2 = await q.intoTagAsync()
      expect(t2).toEqual([['1', '2'], 3])
      expect(t2[0].raw).toEqual(['1', '2'])
    })
    it('is not trimmed if it returns null', async () => {
      let b = false
      const q = qq`1${uq(async () => { if (b) { return 3 } else { return null } })}2`
      expect(q.isEmpty).toBeFalsy()
      const t1 = await q.intoTagAsync()
      expect(t1).toEqual([['1', '2'], null])
      expect(t1[0].raw).toEqual(['1', '2'])
      b = true
      const t2 = await q.intoTagAsync()
      expect(t2).toEqual([['1', '2'], 3])
      expect(t2[0].raw).toEqual(['1', '2'])
    })
  })
  describe('evaluated', () => {
    it('quasiquote returns the result lazily', () => {
      let v1 = 1
      const q = qq`${uq(() => qq`2${uq(() => qq`4${v1}5`)}3`)}`
      expect(q.isEmpty).toBeFalsy()
      const t1 = q.intoTag()
      expect(t1).toEqual([['24', '53'], 1])
      expect(t1[0].raw).toEqual(['24', '53'])
      v1 = 10
      const t2 = q.intoTag()
      expect(t2).toEqual([['24', '53'], 10])
      expect(t2[0].raw).toEqual(['24', '53'])
    })
    it('evaluated quasiquote returns the same result', () => {
      let v1 = 1
      const q = qq`${uq(() => qq`2${uq(() => qq`4${v1}5`)}3`)}`
      const qe = q.evaluated()
      expect(qe.isEmpty).toBeFalsy()
      const te11 = qe.intoTag()
      expect(te11).toEqual([['24', '53'], 1])
      expect(te11[0].raw).toEqual(['24', '53'])
      const te12 = q.intoTag()
      expect(te12).toEqual([['24', '53'], 1])
      expect(te12[0].raw).toEqual(['24', '53'])
      v1 = 10
      const te21 = qe.intoTag()
      expect(te21).toEqual([['24', '53'], 1])
      expect(te21[0].raw).toEqual(['24', '53'])
      const te22 = q.intoTag()
      expect(te22).toEqual([['24', '53'], 10])
      expect(te22[0].raw).toEqual(['24', '53'])
    })
  })
  describe('evaluatedAsync', () => {
    it('quasiquote returns the result lazily', async () => {
      let v1 = 1
      const q = qq`${uq(async () => qq`2${uq(async () => qq`4${v1}5`)}3`)}`
      expect(q.isEmpty).toBeFalsy()
      const t1 = await q.intoTagAsync()
      expect(t1).toEqual([['24', '53'], 1])
      expect(t1[0].raw).toEqual(['24', '53'])
      v1 = 10
      const t2 = await q.intoTagAsync()
      expect(t2).toEqual([['24', '53'], 10])
      expect(t2[0].raw).toEqual(['24', '53'])
    })
    it('evaluated quasiquote returns the same result', async () => {
      let v1 = 1
      const q = qq`${uq(async () => qq`2${uq(async () => qq`4${v1}5`)}3`)}`
      const qe = await q.evaluatedAsync()
      expect(qe.isEmpty).toBeFalsy()
      const te1 = await qe.intoTagAsync()
      expect(te1).toEqual([['24', '53'], 1])
      expect(te1[0].raw).toEqual(['24', '53'])
      const t1 = await q.intoTagAsync()
      expect(t1).toEqual([['24', '53'], 1])
      expect(t1[0].raw).toEqual(['24', '53'])
      v1 = 10
      const te2 = await qe.intoTagAsync()
      expect(te2).toEqual([['24', '53'], 1])
      expect(te2[0].raw).toEqual(['24', '53'])
      const t2 = await q.intoTagAsync()
      expect(t2).toEqual([['24', '53'], 10])
      expect(t2[0].raw).toEqual(['24', '53'])
    })
    it('evaluated quasiquote returns the same result containing no promises', async () => {
      const v1 = 1
      const q = qq`${uq(async () => qq`2${uq(async () => qq`4${v1}5`)}3`)}`
      const qe = await q.evaluatedAsync()
      expect(qe.isEmpty).toBeFalsy()
      const te1 = qe.intoTag()
      expect(te1).toEqual([['24', '53'], 1])
      expect(te1[0].raw).toEqual(['24', '53'])
    })
  })
  describe('sendTo', () => {
    it('send quasiquote to f', () => {
      const q = qq`${uq(() => qq`2${uq(() => 1)}3`)}`
      expect(q.isEmpty).toBeFalsy()
      const ref: { ss?: readonly string[], vs?: any[] } = {}
      const f = (ss: readonly string[], ...vs: any[]) => {
        ref.ss = ss
        ref.vs = vs
        return 3
      }
      const r = q.sendTo(f)
      expect(ref).toEqual({ ss: ['2', '3'], vs: [1] })
      expect(r).toEqual(3)
    })
    it('send quasiquote to async f', async () => {
      const q = qq`${uq(() => qq`2${uq(() => 1)}3`)}`
      expect(q.isEmpty).toBeFalsy()
      const ref: { ss?: readonly string[], vs?: any[] } = {}
      const f = async (ss: readonly string[], ...vs: any[]) => {
        ref.ss = ss
        ref.vs = vs
        return 3
      }
      const r = await q.sendTo(f)
      expect(ref).toEqual({ ss: ['2', '3'], vs: [1] })
      expect(r).toEqual(3)
    })
    it('send quasiquote to f with raw property tracked', () => {
      const q = qq`${uq(() => qq`\n${uq(() => 1)}\t`)}`
      expect(q.isEmpty).toBeFalsy()
      const ref: { ss?: TemplateStringsArray, vs?: any[] } = {}
      const f = (ss: TemplateStringsArray, ...vs: any[]) => {
        ref.ss = ss
        ref.vs = vs
        return 3
      }
      const r = q.sendTo(f)
      expect(ref).toEqual({ ss: ['\n', '\t'], vs: [1] })
      expect(ref.ss?.raw).toEqual(['\\n', '\\t'])
      expect(r).toEqual(3)
    })
  })
  describe('sendTo async', () => {
    it('send quasiquote to f', async () => {
      const q = qq`${uq(async () => qq`2${uq(async () => 1)}3`)}`
      expect(q.isEmpty).toBeFalsy()
      const ref: { ss?: readonly string[], vs?: any[] } = {}
      const f = (ss: readonly string[], ...vs: any[]) => {
        ref.ss = ss
        ref.vs = vs
        return 3
      }
      const r = await q.sendToAsync(f)
      expect(ref).toEqual({ ss: ['2', '3'], vs: [1] })
      expect(r).toEqual(3)
    })
    it('send quasiquote to async f', async () => {
      const q = qq`${uq(async () => qq`2${uq(async () => 1)}3`)}`
      expect(q.isEmpty).toBeFalsy()
      const ref: { ss?: readonly string[], vs?: any[] } = {}
      const f = async (ss: readonly string[], ...vs: any[]) => {
        ref.ss = ss
        ref.vs = vs
        return 3
      }
      const r = await q.sendToAsync(f)
      expect(ref).toEqual({ ss: ['2', '3'], vs: [1] })
      expect(r).toEqual(3)
    })
  })
  describe('concatQ', () => {
    it('concatenates quasiquotes with separator', () => {
      const q1 = qq`1${2}3`
      const q2 = qq`4${5}6`
      const q3 = qq`7${8}9`
      const q = concatQ('x', [q1, q2, q3])
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['1', '3x4', '6x7', '9'], 2, 5, 8])
      expect(t[0].raw).toEqual(['1', '3x4', '6x7', '9'])
    })
    it('concatenates no quasiquotes with separator', () => {
      const q = concatQ('x', [])
      expect(q.isEmpty).toBeTruthy()
      const t = q.intoTag()
      expect(t).toEqual([['']])
      expect(t[0].raw).toEqual([''])
    })
    it('concatenates no quasiquotes with the raw property tracked', () => {
      const q1 = qq`\n${1}2`
      const q2 = qq`\t${3}4`
      const q = concatQ('x', [q1, q2])
      expect(q.isEmpty).toBeFalsy()
      const t = q.intoTag()
      expect(t).toEqual([['\n', '2x\t', '4'], 1, 3])
      expect(t[0].raw).toEqual(['\\n', '2x\\t', '4'])
    })
  })
  describe('stringify', () => {
    it('stringify a captured template literal', () => {
      const q = qq`${1}`
      const t = q.sendTo(stringify)
      expect(t).toStrictEqual('1')
    })
    it('stringify a captured empty template literal', () => {
      const q = qq``
      const t = q.sendTo(stringify)
      expect(t).toStrictEqual('')
    })
  })
  describe('stringify async ', () => {
    it('stringify a captured template literal', async () => {
      const q = qq`${uq(async () => 1)}`
      const t = await q.sendToAsync(stringify)
      expect(t).toStrictEqual('1')
    })
    it('stringify a captured empty template literal', async () => {
      const q = qq`${uq(async () => { })}`
      const t = await q.sendToAsync(stringify)
      expect(t).toStrictEqual('')
    })
  })
})
