const express = require('express')
const pretty = require("./pretty")
const scrape = require("./scrapers")

const departments = require("./departments")

console.time("Time")

scrape()
  .then(function(re) {
    console.log(`Got ${re.length} departments`)
    console.timeEnd("Time")
  })
