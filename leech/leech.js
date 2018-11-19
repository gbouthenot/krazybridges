#!/usr/bin/env node

/* eslint no-multi-spaces: ["error", { ignoreEOLComments: true }] */
class PuzzleLeecher {
  constructor (ptype) {
    this.varieties = ({
      bridges: [
        [ '9x9', 5, 100, 32 ],   // 32      0 + 16000 -> 16000
        [ '12x14', 5, 100, 16 ], // 16  16000 +  8000 -> 24000
        [ '22x14', 5, 100, 16 ], // 16  24000 +  8000 -> 32000
        [ '20x25', 5, 100, 8 ],  //  8  32000 +  4000 -> 36000
        [ '25x25', 5, 100, 8 ]   //  8  36000 +  4000 -> 40000
      ],
      suguru: [
        [ '6x6', 5, 100, 16 ],   // 16      0 + 8000 ->  8000
        [ '8x8', 5, 100, 16 ],   // 16   8000 + 8000 -> 16000
        [ '12x10', 5, 100, 8 ],  // 16  16000 + 4000 -> 20000
        [ '15x10', 5, 100, 8 ],  //  8  20000 + 4000 -> 24000
        [ '15x10n6', 5, 100, 8 ] //  8  24000 + 4000 -> 28000
      ]
    })[ptype]

    this.ptype = ptype

    this.leechState = {
      variety: 0,
      volume: 1,
      book: 1,
      number: 0,
      nbdone: undefined
    }

    const SQLITE = require('better-sqlite3')
    this.db = new SQLITE('puzzles.db')
    const schema = `
CREATE TABLE IF NOT EXISTS ${ptype} (
  kind TEXT,
  vol INT,
  book INT,
  number INT,
  jsondata TEXT,
  PRIMARY KEY (kind, vol, book, number)
)`
    this.db.exec(schema)

    this.sqlGetOne = this.db.prepare(`SELECT jsondata FROM ${ptype} WHERE kind=? AND vol=? AND book=? AND number=?`)
    this.sqlInsert = this.db.prepare(`INSERT INTO ${ptype} VALUES (?, ?, ?, ?, ?)`)
    this.sqlCount = this.db.prepare(`SELECT count(*) AS count FROM ${ptype} WHERE kind=? AND vol<=? AND book<=? AND number<=?`)

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

  /**
   * Look for the next puzzle to get, that has not been already got
   * If it exists, download it and set a timeout for a new iteration
   */
  async iterateAuto (mintime, multime) {
    let nextExist
    while ((nextExist = this.nextPuzzle()) && this.puzzleExists()) { }
    if (nextExist) {
      await this.getPuzzle()
      setTimeout(_ => this.iterateAuto(mintime, multime), mintime + Math.random() * multime)
    }
  }

  async getPuzzle () {
    const ls = this.leechState
    const [kind, vol, book, pn] = [this.varieties[ls.variety][0], ls.volume, ls.book, ls.number]
    const url = `https://krazydad.com/tablet/${this.ptype}/?kind=${kind}&volumeNumber=${vol}&bookNumber=${book}&puzzleNumber=${pn}`
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

if (!process.argv[2]) {
  console.error(`syntax: ${process.argv0} ${process.argv[1]} bridges|suguru`)
  process.exit(1)
}

const puzzleLeecher = new PuzzleLeecher(process.argv[2])
puzzleLeecher.iterateAuto(20000, 60000)
