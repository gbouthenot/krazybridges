#!/usr/bin/env node

// Require the framework and instantiate it
const fastify = require('fastify')({
  logger: true
})

fastify.get('/kind:kind/vol:vol/book:book/puzzle:puzzle', (request, reply) => {
  const rp = request.params

  const SQLITE = require('better-sqlite3')
  const db = new SQLITE('../leech/bridges.db')
  const stmt = db.prepare('SELECT jsondata FROM bridges WHERE kind=? AND vol=? AND book=? AND number=?')
  let ret = stmt.get(rp.kind, rp.vol, rp.book, rp.puzzle)
  db.close()

  if (ret) {
    ret = JSON.parse(ret.jsondata)
    reply.send(ret)
  } else {
    reply.status(404).send('Puzzle not found')
  }
})

// Declare a route
fastify.get('/', (request, reply) => {
  reply.send({ hello: 'world' })
})

// Run the server!
fastify.listen(3000, '0.0.0.0', (err, address) => {
  if (err) throw err
  fastify.log.info(`server listening on ${address}`)
})
