const express = require('express')
const scrape = require("./scrapers")

console.time("Time")

scrape()
  .then(function(re) {
    console.log(`Got ${re.length} departments`)
    console.timeEnd("Time")
  })
