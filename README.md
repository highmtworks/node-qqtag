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

const querySpec = qq`select * from ${qt(collectionName)}${uq(() => condition && qq` where ${condition}`)}`.sendTo(newQuery)
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


## API

(To be fixed)

* `quasiquote: (ss: TemplateStringsArray, ...vs: any[]) => QuasiQuote`
* `quote: (value: any) => Quote`
* `unquote: (qq: Quote | QuasiQuote | Function) => UnQuote`
* `concatQ: (sep: string, qs: QuasiQuote[]) => QuasiQuote`
* `class QuasiQuote`
    * `sendTo<T>(f: ((ss: TemplateStringsArray, ...vs: any[]) => T) | ((ss: string[], ...vs: any[]) => T)): T`
    * `intoTag(): [string[], ...any[]]`
    * `evaluated(): QuasiQuote`
    * `get isEmpty(): boolean`
    * `static empty(): QuasiQuote`
    * `static joinQ(sep: string, q1: QuasiQuote, q2: QuasiQuote): QuasiQuote`
* `class Quote`
* `class UnQuote`


## License
This library is licensed under the MIT License.
