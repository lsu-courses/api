const bookshelf = require("../bookshelf")
require("./semester")
require("./section")

const Course = bookshelf.Model.extend({
  tableName: "courses",
  uuid: true,
  semester: function() {
    return this.belongsTo("Semester")
  },
  sections: function() {
    return this.hasMany("Section")
  },
})

module.exports = bookshelf.model("Course", Course)
