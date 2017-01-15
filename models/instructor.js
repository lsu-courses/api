const bookshelf = require("../bookshelf")
require("./section")

const Instructor = bookshelf.Model.extend({
  tableName: "instructors",
  uuid: true,
  sections: function() {
    return this.hasMany("Section")
  },
})

module.exports = bookshelf.model("Instructor", Instructor)
