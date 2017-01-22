const bookshelf = require("../bookshelf")
const ModelBase = require("bookshelf-modelbase")(bookshelf)
require("./semester")
require("./section")

const Course = ModelBase.extend({
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
