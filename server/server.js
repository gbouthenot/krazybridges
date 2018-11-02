#!/usr/bin/env node

const path = require('path')

// Require the framework and instantiate it
const fastify = require('fastify')({
  logger: true
})

// main route
fastify.get('/api/bridges/:kind/:vol/:book/:puzzle', (request, reply) => {
  const rp = request.params

  const SQLITE = require('better-sqlite3')
  const db = new SQLITE('../leech/bridges.db')
  let ret
  try {
    const stmt = db.prepare('SELECT jsondata FROM bridges WHERE kind=? AND vol=? AND book=? AND number=?')
    ret = stmt.get(rp.kind, rp.vol, rp.book, rp.puzzle)
  } catch (e) {
    db.close()
  }

  if (ret) {
    ret = JSON.parse(ret.jsondata)
    reply.header('Access-Control-Allow-Origin', '*')
    reply.send(ret)
  } else {
    reply.status(404).send('Puzzle not found')
  }
})

// Index route
fastify.get('/', (request, reply) => {
  reply.send({ hello: 'world' })
})

// "Not Found" route
fastify.setNotFoundHandler((request, reply) => {
  reply.code(404).type('text/html').send('Not Found')
})

// Static route
fastify.register(require('fastify-static'), {
  root: path.join(__dirname, 'static'),
  prefix: '/'
})

// Run the server!
fastify.listen(process.env.PORT || 3000, process.env.IP || '127.0.0.1', (err, address) => {
  if (err) throw err
  fastify.log.info(`server listening on ${address}`)
})
