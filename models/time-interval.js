const bookshelf = require("../bookshelf")
require("./section")

const TimeInterval = bookshelf.Model.extend({
  tableName: "time_intervals",
  uuid: true,
  section: function() {
    return this.belongsTo("Section")
  },
  instructor: function() {
    return this.belongsToMany("Instructor")
  }
})

module.exports = bookshelf.model("TimeInterval", TimeInterval)
