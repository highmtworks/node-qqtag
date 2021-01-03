# qqtag

Quasi quote library for javascript template literals.


## Motivation

Some database libraries like [mssql](https://github.com/tediousjs/node-mssql) supports
embedding query parameters using tagged literals:

```
const sql = require('mssql')

sql.connect(config).then(() => {
    return sql.query`select * from mytable where id = ${value}`
}).then(result => {
    console.dir(result)
}).catch(err => {
    // ... error checks
})
```

But what to do if you want to embed a table name variable, or
if you want to add optional WHERE conditions based on values of variables ?


## Usage

* `quasiquote` expresses a template literal that is not yet evaluated and can be passed to other tag functions.

  ```
  import { quasiquote as qq } from 'qqtag'

  const sql = require('mssql')

  sql.connect(config).then(() => {
    const query = qq`select * from mytable where id = ${value}`
    return query.sendTo(sql.query.bind(sql))
  }) // ...
  ```

* `quote` can embed a string as a part of literals instead of passing it to a template literal place holder.

  ```
  import { quasiquote as qq, quote as qt } from 'qqtag'

  const tableName = 'tab1'
  const query1 = qq`select col1 from ${tableName}`
  const query2 = qq`select col1 from ${qt(tableName)}`

  query1.sendTo((ss, ...vs) => {
    console.log([ss, vs])
    // -> [ [ 'select col1 from ', '' ], [ 'tab1' ] ]
    //    This is not what is wanted.
  })
  query2.sendTo((ss, ...vs) => {
    console.log([ss, vs])
    // -> [ [ 'select col1 from tab1' ], [] ]
  })
  ```

* `unquote` can embed another `quasiquote` .

  ```
  import { quasiquote as qq, unquote as uq } from 'qqtag'

  let colvalue = '2'

  const query = qq`select col1 from tab1
  ${uq(() => {
    if (colvalue != null) {
      return qq`where col2 = ${colvalue}`
    }
  })}
  `
  query.sendTo((ss, ...vs) => {
    console.log([ss, vs])
    // -> [ [ 'select col1 from tab1\n  where col2 = ', '\n' ], [ '2' ] ]
  })

  colvalue = null

  query.sendTo((ss, ...vs) => {
    console.log([ss, vs])
    // -> [ [ 'select col1 from tab1\n  \n' ], [] ]
  })
  ```


## Example

(These examples may be stale and may not work, but the concept will be apply.)

### mysql

```
const newQuery = (conn) =>
  (ss, ...vs) => new Promise((resolve, reject) => {
    conn.query(newQueryOpts(ss, ...vs), (error, results, fields) => {
      if (error) return reject(error)
      return resolve({ results, fields })
    })
  })

const newQueryOpts = (ss, ...vs) => {
  const values = vs
  const sql = ss.slice(1).reduce((a, s, i) => `${a} ? ${s}`, ss[0])
  return { sql, values }
}

const newSql = (conn) =>
  (ss, ...vs) => vs.reduce((a, c, i) => `${a}${conn.escape(c)}${ss[i + 1]}`, ss[0])


const listUsers = async (conn, opts) => {
  return await qq`\
select * from users \
${uq(() => opts.userId != null ? qq`where user_id=${opts.userId}` : undefined)} ;\
`.sendTo(newQuery(conn))
}

const getLiteralSqlForListUsers = async (conn, opts) => {
  return await qq`\
select * from users \
${uq(() => opts.userId != null ? qq`where user_id=${opts.userId}` : undefined)} ;\
`.sendTo(newSql(conn))
}

```

### @azure/cosmos (v2)

```
const newQuery = (ss, ...vs) => {
  const parameters = vs.reduce((a, v, i) => (a.push({ name: `@p_${i}`, value: vs[i] }), a), [])
  const query = ss.slice(1).reduce((a, s, i) => `${a} ${parameters[i].name} ${s}`, ss[0])
  return { query, parameters }
}

const querySpec = qq`select * from ${qt(collectionName)} t where t.UserId = ${userId}`.sendTo(newQuery)
const feedOptios = {
  // ...
}
const queryIterator = collection.container.items.query(querySpec, feedOptios)
```

### mssql: pass typed query parameters

```
class BaseCustomSqlType {
  constructor(value) {
    this.value = value
  }
  valueOf() {
    return this.value
  }
}
class VarChar extends BaseCustomSqlType {}
class Numeric extends BaseCustomSqlType {}

sql.map.register(VarChar, sql.VarChar)
sql.map.register(Numeric, sql.Numeric)

const value = 123
const query = qq`select * from tab1 where col1 = ${new Numeric(value)}`
```


## Public API

* `quasiquote: (ss: TemplateStringsArray, ...vs: any[]) => QuasiQuote`
    - Construct a quasisquote.
* `quote: (value: any) => Quote`
    - Construct a quote that can be embeded in a quasiquote.
* `unquote: (qq: Quote | QuasiQuote | (() => any) | Promise<Quote> | Promise<QuasiQuote> | (() => Promise<any>)) => UnQuote`
    - Construct an unquote that can be embeded in a quasiquote.
* `concatQ: (sep: string, qs: QuasiQuote[]) => QuasiQuote`
    - Concatenate quasiquotes.
* `stringify: (ss: TemplateStringsArray, ...vs: any[]) => any`
    - A tag function that stringify a string literal to the same string as that string literal.
* `class QuasiQuote`
    * (constructor is not intended to be used to create a instance directly)
    * `sendTo<T>(f: ((ss: TemplateStringsArray, ...vs: any[]) => T) | ((ss: readonly string[], ...vs: any[]) => T)): T`
        - Pass a quasiquote to a tag function.
    * `sendToAsync<T>(f: ((ss: TemplateStringsArray, ...vs: any[]) => (T | Promise<T>)) | ((ss: readonly string[], ...vs: any[]) => T)): Promise<T>`
        - The async version of `sendTo`.
            - If Promises are embedded in unquotes, the async version should be used.
            - If `f` returns a promise, it is also awaited.
    * `intoTag(): [TemplateStringsArray, ...any[]]`
        - Convert a quasiquote to a captured tagged literal that can be passed to a tag function.
    * `intoTagAsync(): Promise<[TemplateStringsArray, ...any[]]>`
        - The async version of `intoTag`.
            - If Promises are embedded in unquotes, the async version should be used.
    * `evaluated(): QuasiQuote`
        - Evaluate a captured quasiquote.
            - Before evaluated, `sendTo` or `intoTag` of a quasiquote evaluates embeded functions in unquotes lazily.
    * `evaluatedAsync(): Promise<QuasiQuote>`
        - The async version of `evaluated`.
    * `get isEmpty(): boolean`
        - Return if a quasiquote is empty (that is, just `` .)
    * `static empty(): QuasiQuote`
        - Construct an empty quasiquote.
    * `static joinQ(sep: string, q1: QuasiQuote, q2: QuasiQuote): QuasiQuote`
        - Join two quasiquotes.
* `class Quote`
    * (constructor is not intended to be used to create a instance directly)
* `class UnQuote`
    * (constructor is not intended to be used to create a instance directly)


## References

* [nest-literal](https://www.npmjs.com/package/nest-literal) seems to provide similar functionalities.

## License
This library is licensed under the MIT License.
