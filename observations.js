
const _ = require('lodash')
const colors = require('colors')
const moment = require('moment')
const numeral = require('numeral')
const request = require('request')
const async = require('async')
const safeEval = require('safe-eval')
const manifest = require('./manifest.json')
const proposals = manifest.proposals
const observations = manifest.observations

console.log(`\n> Job started with ${proposals.length} proposals and ${observations.length} observations to validate...`.magenta)

async.timesLimit(proposals.length, 10, (i, callback) => {
  let p = proposals[i]
  const tasks = {
    requestJson: (callback) => {
      if (typeof p === 'object') return callback()
      let url = p.replace('/full', '/json')
      request(url, (error, response, body) => {
        if (error) return callback(error)
        try {
          p = JSON.parse(body)
        } catch(e) {
          return callback('Unable to parse body!')
        }
        callback()
      })
    },
    validate: (callback) => {
      const contest = {
        _: _,
        moment: moment,
        numeral: numeral,
        p: p
      }
      console.log('\n\n> Evaluating:', `

  ${p.proposalNumber} > ${p.title}
  Status ${p.status}
  Total $${p.total} ${p.currency.code}
  Views ${p.views || 0}
  ${p.lastSeen ? 'Seen ' + moment(p.lastSeen).fromNow() : 'Unseen'}`.cyan)
      for (let j = 0; j < observations.length; j++) {
        const obs = observations[j]
        console.log('\n> Script:', obs.script)
        let msg = safeEval(obs.script, contest)
        console.log(`> Msg:`, typeof msg === 'string' ? msg[obs.color] : msg)
      }
      callback()
    }   
  }
  async.series(tasks, (err) => {
    err ? callback(err) : callback()
  })
}, (err) => {
  if (err) return console.error(err)
  console.log(`\n> Job done!\n`.magenta)
})
