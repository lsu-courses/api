const pretty = require("prettyjson")

const options = {
  keysColor: "green"
}

module.exports = function(json) {
  return pretty.render(json, options)
}
