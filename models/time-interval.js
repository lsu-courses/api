const bookshelf = require("../bookshelf")
require("./section")

const TimeInterval = bookshelf.Model.extend({
  tableName: "time_intervals",
  uuid: true,
  section: function() {
    return this.belongsTo("Section")
  },
})

module.exports = bookshelf.model("TimeInterval", TimeInterval)
