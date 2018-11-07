#!/usr/bin/env node

/* eslint no-multi-spaces: ["error", { ignoreEOLComments: true }] */
class BridgeLeecher {
  constructor () {
    this.varieties = [
      [ '9x9', 5, 100, 32 ],   // 32      0 + 16000 -> 16000
      [ '12x14', 5, 100, 16 ], // 16  16000 +  8000 -> 24000
      [ '22x14', 5, 100, 16 ], // 16  24000 +  8000 -> 32000
      [ '20x25', 5, 100, 8 ],  //  8  32000 +  4000 -> 36000
      [ '25x25', 5, 100, 8 ]   //  8  36000 +  4000 -> 40000
    ]

    this.leechState = {
      variety: 0,
      volume: 1,
      book: 1,
      number: 0,
      nbdone: undefined
    }

    const SQLITE = require('better-sqlite3')
    this.db = new SQLITE('bridges.db')
    const schema = `
CREATE TABLE IF NOT EXISTS bridges (
  kind TEXT,
  vol INT,
  book INT,
  number INT,
  jsondata TEXT,
  PRIMARY KEY (kind, vol, book, number)
)`
    this.db.exec(schema)

    this.sqlGetOne = this.db.prepare('SELECT jsondata FROM bridges WHERE kind=? AND vol=? AND book=? AND number=?')
    this.sqlInsert = this.db.prepare('INSERT INTO bridges VALUES (?, ?, ?, ?, ?)')
    this.sqlCount = this.db.prepare('SELECT count(*) AS count FROM bridges WHERE kind=? AND vol<=? AND book<=? AND number<=?')

    this.leechState.nbdone = this.puzzleCount()
    this.totalNumber = this.varieties.reduce((a, b) => a + b.reduce((a, b) => (b >= 0) ? a * b : a, 1), 0)
    console.log(`${this.leechState.nbdone} puzzles already in database; ${this.totalNumber} total puzzles`)
    this.logProgress()
  }

  /**
   * prepare next puzzle number
   * @return true if next puzzle exists
   */
  nextPuzzle () {
    const ls = this.leechState
    let variety = this.varieties[ls.variety]
    if (++ls.number > variety[3]) {
      ls.number = 1
      if (++ls.book > variety[2]) {
        ls.book = 1
        if (++ls.volume > variety[1]) {
          ls.volume = 1
          if (++ls.variety > variety.length) {
            return false
          }
        }
      }
    }
    return true
  }

  logProgress () {
    const ls = this.leechState
    const pc = Math.floor(ls.nbdone * 10000 / this.totalNumber) / 100
    const kind = this.varieties[ls.variety][0]
    console.log(`kind ${kind}, vol ${ls.volume}, book ${ls.book}, puzzle ${ls.number}, ${pc}%`)
  }

  /*
   * check if puzzle is already in database
   * @return undefined if row does not exist
   */
  puzzleExists () {
    const ls = this.leechState
    const [kind, vol, book, pn] = [this.varieties[ls.variety][0], ls.volume, ls.book, ls.number]
    return this.sqlGetOne.get(kind, vol, book, pn)
  }

  /**
    * number of puzzles already in database (as described by varieties)
    * sum of every kind, limited by vol, book and puzzle numbers
    * @return int number of puzzles in db
    */
  puzzleCount () {
    return this.varieties.reduce((a, v) => a + this.sqlCount.get(v[0], v[1], v[2], v[3]).count, 0)
  }

  puzzleSave (data) {
    const ls = this.leechState
    const [kind, vol, book, pn] = [this.varieties[ls.variety][0], ls.volume, ls.book, ls.number]
    const changes = this.sqlInsert.run(kind, vol, book, pn, JSON.stringify(data))
    if (changes.changes !== 1) {
      throw new Error('db save error')
    }
  }

  puzzleSaved () {
    const ls = this.leechState
    ls.nbdone++
    if (ls.nbdone % 20 === 0) {
      this.logProgress()
    }
  }

  async iterateAuto (mintime, multime) {
    if (this.nextPuzzle()) {
      if (!this.puzzleExists()) {
        await this.getPuzzle()
        setTimeout(this.iterateAuto.bind(this, mintime, multime), mintime + Math.random() * multime)
      } else {
        setTimeout(this.iterateAuto.bind(this, mintime, multime), 0)
      }
    }
  }

  async getPuzzle () {
    const ls = this.leechState
    const [kind, vol, book, pn] = [this.varieties[ls.variety][0], ls.volume, ls.book, ls.number]
    const url = `https://krazydad.com/tablet/bridges/?kind=${kind}&volumeNumber=${vol}&bookNumber=${book}&puzzleNumber=${pn}`
    const fetch = require('node-fetch')

    const opts = { timeout: 5000, headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36' } }
    console.log(url)
    await fetch(url, opts).then(res => res.text()).then(body => {
      let match = body.match(/^ {2}var pRec = (\{.*\});/m)
      if (match && match[1]) {
        match = match[1]
        match = JSON.parse(match)
        match = match.puzzle_data
        // {passes, puzz, height, solved, ptitle, width}
        this.puzzleSave(match)
        this.puzzleSaved()
      }
    }).catch(err => {
      console.error(err)
    })
  }
}

const bridgeLeecher = new BridgeLeecher()
bridgeLeecher.iterateAuto(20000, 60000)
