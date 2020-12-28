import { quasiquote as qq, quote as qt, unquote as uq, concatQ } from '../lib/qqtag'

describe('qqtag', () => {
  const mockContext = {}
  describe('quasiquote', () => {
    it('creates empty quasiquote', () => {
      const q = qq``
      expect(q.isEmpty).toBeTruthy()
      expect(q.intoTag()).toEqual([['']])
    })
    it('creates quasiquote with no unquote', () => {
      const q = qq`1`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['1']])
    })
    it('creates quasiquote with unquote at right-most edge', () => {
      const q = qq`1${2}`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['1', ''], 2])
    })
    it('creates quasiquote with unquote at left-most edge', () => {
      const q = qq`${2}1`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['', '1'], 2])
    })
    it('creates quasiquote with unquotes', () => {
      const q = qq`1${4}2${5}3`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['1', '2', '3'], 4, 5])
    })
    it('creates quasiquote with unquotes with no text', () => {
      const q = qq`${4}${5}`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['', '', ''], 4, 5])
    })
  })
  describe('quote', () => {
    it('creates quasiquote with unquote+quote at right-most edge', () => {
      const q = qq`1${qt(2)}`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['12']])
    })
    it('creates quasiquote with unquote+quote at left-most edge', () => {
      const q = qq`${qt(2)}1`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['21']])
    })
    it('creates quasiquote with unquotes+quotes', () => {
      const q = qq`1${qt(4)}2${qt(5)}3`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['14253']])
    })
    it('creates quasiquote with unquotes+quotes with no text', () => {
      const q = qq`${qt(4)}${qt(5)}`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['45']])
    })
    it('creates quasiquote with unquote+quote+nested tag template', () => {
      const q = qq`${qt(`${2}`)}`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['2']])
    })
  })
  describe('unquote', () => {
    it('creates quasiquote with dynamic unquote', () => {
      const q = qq`${uq(() => 2)}`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['', ''], 2])
    })
    it('creates quasiquote with explicit unquote+quote', () => {
      const q = qq`${uq(qt(2))}`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['2']])
    })
    it('creates quasiquote with dynamic unquote+quote', () => {
      const q = qq`${uq(() => qt(2))}`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['2']])
    })
    it('creates quasiquote with explicit unquote+quasiquote', () => {
      const q = qq`${uq(qq`2`)}`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['2']])
    })
    it('creates quasiquote with dynamic unquote+quasiquote', () => {
      const q = qq`${uq(() => qq`2`)}`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['2']])
    })
    it('creates quasiquote with explicit unquote+quasiquote+unquote', () => {
      const q = qq`${uq(qq`2${1}3`)}`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['2', '3'], 1])
    })
    it('creates quasiquote with dynamic unquote+quasiquote+unquote', () => {
      const q = qq`${uq(() => qq`2${1}3`)}`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['2', '3'], 1])
    })
    it('creates quasiquote with dynamic unquote+quasiquote+dynamic unquote', () => {
      const q = qq`${uq(() => qq`2${uq(() => 1)}3`)}`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['2', '3'], 1])
    })
    it('creates quasiquote with dynamic unquote+quasiquote+dynamic unquote+quasiquote', () => {
      const q = qq`${uq(() => qq`2${uq(() => qq`4${1}5`)}3`)}`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['24', '53'], 1])
    })
    it('is trimmed if it returns undefined', () => {
      let b = false
      const q = qq`1${uq(() => { if (b) { return 3 } })}2`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['12']])
      b = true
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['1', '2'], 3])
    })
    it('is not trimmed if it returns null', () => {
      let b = false
      const q = qq`1${uq(() => { if (b) { return 3 } else { return null } })}2`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['1', '2'], null])
      b = true
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['1', '2'], 3])
    })
  })
  describe('evaluated', () => {
    it('evaluated quasiquote returns the same result', () => {
      let v1 = 1
      const q = qq`${uq(() => qq`2${uq(() => qq`4${v1}5`)}3`)}`
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['24', '53'], 1])
      v1 = 10
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['24', '53'], 10])
      v1 = 1
      const qe = q.evaluated()
      expect(qe.isEmpty).toBeFalsy()
      expect(qe.intoTag()).toEqual([['24', '53'], 1])
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['24', '53'], 1])
      v1 = 10
      expect(qe.isEmpty).toBeFalsy()
      expect(qe.intoTag()).toEqual([['24', '53'], 1])
      expect(q.isEmpty).toBeFalsy()
      expect(q.intoTag()).toEqual([['24', '53'], 10])
    })
  })
  describe('sendTo', () => {
    it('send quasiquote to f', () => {
      const q = qq`${uq(() => qq`2${uq(() => 1)}3`)}`
      expect(q.isEmpty).toBeFalsy()
      const ref: { ss?: string[], vs?: any[] } = {}
      const f = (ss: string[], ...vs: any[]) => {
        ref.ss = ss
        ref.vs = vs
      }
      q.sendTo(f)
      expect(ref).toEqual({ ss: ['2', '3'], vs: [1] })
    })
  })
  describe('concatQ', () => {
    it('concatenates quasiquotes with separator', () => {
      const q1 = qq`1${2}3`
      const q2 = qq`4${5}6`
      const q3 = qq`7${8}9`
      const q = concatQ('x', [q1, q2, q3])
      expect(q.intoTag()).toEqual([['1', '3x4', '6x7', '9'], 2, 5, 8])
    })
    it('concatenates no quasiquotes with separator', () => {
      const q = concatQ('x', [])
      expect(q.isEmpty)
      expect(q.intoTag()).toEqual([['']])
    })
  })
})
