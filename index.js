const scrape = require("./scrape")

const departments = require("./departments")

scrape(departments)
  .then(requests => console.log(requests.length))
