const bookshelf = require("../bookshelf")
require("./section")

const TimeInterval = bookshelf.Model.extend({
  tableName: "timeIntervals",
  uuid: true,
  section: function() {
    return this.belongsTo("Section")
  },
})

module.exports = bookshelf.model("TimeInterval", TimeInterval)
