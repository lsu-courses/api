const bookshelf = require("../bookshelf")
require("./course")
require("./instructor")
require("./time-interval")
require("./building")

const Section = bookshelf.Model.extend({
  tableName: "sections",
  uuid: true,
  course: function() {
    return this.belongsTo("Course")
  },
  timeIntervals: function() {
    return this.hasMany("TimeInterval")
  },
})

module.exports = bookshelf.model("Section", Section)
