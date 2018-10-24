#!/usr/bin/env node

class BridgeLeecher {

  constructor () {
    this.varieties = [
      [ '9x9', 5, 100, 32 ],   // 16000
      [ '12x14', 5, 100, 16 ], //  8000 24000
      [ '22x14', 5, 100, 16 ], //  8000 32000
      [ '20x25', 5, 100, 8 ],  //  4000 36000
      [ '25x25', 5, 100, 8 ]   //  4000
    ]

    this.leechState = {
      variety: 0,
      volume: 1,
      book: 1,
      number: 0,
      nbdone: 0
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

    this.dbGetOne = this.db.prepare('SELECT jsondata FROM bridges WHERE kind=? AND vol=? AND book=? AND number=?')
    this.dbPut = this.db.prepare('INSERT INTO bridges VALUES (?, ?, ?, ?, ?)')
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

    ls.nbdone++
    if (ls.nbdone % 100 === 0) {
      console.log(`kind ${this.varieties[ls.variety][0]}, vol ${ls.volume}, book ${ls.book}, puzzle ${ls.number}, ${ls.nbdone / 400.0}%`)
    }

    return true
  }

  /*
   * check if puzzle is already in database
   * @return undefined if row does not exist
   */
  puzzleExists () {
    const ls = this.leechState
    const [kind, vol, book, pn] = [this.varieties[ls.variety][0], ls.volume, ls.book, ls.number]
    return this.dbGetOne.get(kind, vol, book, pn)
  }

  puzzleSave (data) {
    const ls = this.leechState
    const [kind, vol, book, pn] = [this.varieties[ls.variety][0], ls.volume, ls.book, ls.number]
    const changes = this.dbPut.run(kind, vol, book, pn, JSON.stringify(data))
    if (changes.changes !== 1) {
      throw new Error('db save error')
    }
  }

  async iterateAuto (mintime, multime) {
    if (this.nextPuzzle()) {
      if (!this.puzzleExists()) {
        await this.getPuzzle()
        setTimeout(this.iterateAuto.bind(this, mintime, multime), mintime + Math.random() * multime)
      } else {
        this.iterateAuto(mintime, multime)
      }
    }
  }

  /*
  leech () {
    let nbpuz = 0
    this.varieties.forEach(variety => {
      const [kind, maxvol, maxbook, maxpn] = variety
      for (let vol = 1; vol <= maxvol; vol++) {
        // console.log(`kind ${kind}, vol ${vol} (${maxpn * 100} puzzles), ${nbpuz / 400.0}%`)
        for (let book = 1; book <= maxbook; book++) {
          // console.log(`kind ${kind}, vol ${vol}, book ${book} (${maxpn} puzzles), ${nbpuz / 400.0}%`)
          for (let pn = 1; pn <= maxpn; pn++) {
            if (nbpuz % 100 === 0) {
              console.log(`kind ${kind}, vol ${vol}, book ${book}, puzzle ${pn}, ${nbpuz / 400.0}%`)
            }
            this.getPuzzle(kind, vol, book, pn)
            nbpuz++
          }
        }
      }
    })
  }
  */

  async getPuzzle () {
    const ls = this.leechState
    const [kind, vol, book, pn] = [this.varieties[ls.variety][0], ls.volume, ls.book, ls.number]
    const url = `https://krazydad.com/tablet/bridges/?kind=${kind}&volumeNumber=${vol}&bookNumber=${book}&puzzleNumber=${pn}`
    // const url = 'http://127.0.0.1/gbo/krazybridges/sample.html'
    const fetch = require('node-fetch')

    const opts = { timeout: 5000, headers: {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36' } }
    console.log(url)
    await fetch(url, opts).then(res => res.text()).then(body => {
      let match = body.match(/^ {2}var pRec = (\{.*\});/m)
      if (match && match[1]) {
        match = match[1]
        match = JSON.parse(match)
        match = match.puzzle_data
        // {passes, puzz, height, solved, ptitle, width}
        this.puzzleSave(match)
      }
    }).catch(err => {
      console.error(err)
    })
  }
}

const bridgeLeecher = new BridgeLeecher()
bridgeLeecher.iterateAuto(20000, 60000)

// bridgeLeecher.nextPuzzle()
// bridgeLeecher.getPuzzle()
