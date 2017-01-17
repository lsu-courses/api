const express = require('express')
const pretty = require("./pretty")
const scrape = require("./scrape")

const departments = require("./departments")
//const departments = ["COMPUTER SCIENCE", "HONORS"]

scrape(departments)
  .then(re => console.log(re.length))
