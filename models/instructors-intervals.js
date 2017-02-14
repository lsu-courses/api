const bookshelf = require("../bookshelf")
require("./instructor")

const InstructorsIntervals = bookshelf.Model.extend({
  tableName: "instructors_time_intervals",
  uuid: true,
})

module.exports = bookshelf.model("InstructorsIntervals", InstructorsIntervals)
