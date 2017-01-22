const express = require("express")
const app = express()
const bookshelf = require("./bookshelf")
const scrape = require("./scrapers")

console.time("Time")

app.set("bookshelf", bookshelf)

scrape()
  // .then(function(re) {
  //   console.log(`Got ${re.length} departments`)
  //   console.timeEnd("Time")
  // })
