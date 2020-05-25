/* eslint-disable func-names */
/* eslint-disable global-require */

const knex = require('knex');
const fs = require('fs');
const KnexQueryBuilder = require('knex/lib/query/builder');
if(!__basedir) {
  throw new Error('app base dir not set')
}

const dbConfig = require(`${__basedir}/knexfile.js`);
const db = knex(dbConfig);
let timer = 0;

if (process.env.NODE_ENV && process.env.NODE_ENV.indexOf('dev') !== -1) {
  db.on('start', () => {
    timer = +new Date();
  });

  db.on('query-response', (response, obj, builder) => {
    const { sql, bindings } = builder.toSQL();
    const { rowCount } = obj.response;

    let query = '';
    if (bindings.length > 0) {
      let bindingIndex = 0;
      const split = sql.split('');
      split.map((c, i) => {
        if (c === '?') {
          split[i] = `\`${bindings[bindingIndex]}\``;
          bindingIndex += 1;
        }
        return true;
      });
      query = split.join('');
    } else {
      query = sql;
    }

    if(!__basedir) {
      throw new Error('app base dir not set')
    }
    const sqlFilePath = `${__basedir}/tmp/sql.txt`;
    fs.appendFileSync(sqlFilePath, `${+new Date() - timer}ms (${rowCount}) ${query}`);
  });
}

db.queryBuilder = () => new KnexQueryBuilder(db.client);

module.exports = db;
