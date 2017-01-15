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
  instructors: function() {
    return this.hasMany("Instructor")
  },
  timeIntervals: function() {
    return this.hasMany("TimeInterval")
  },
  buildings: function() {
    return this.belongsToMany("Building")
  },
})

module.exports = bookshelf.model("Section", Section)
