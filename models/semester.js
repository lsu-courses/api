const { bookshelf } = require("../bookshelf");
require("./course");

const Semester = bookshelf.Model.extend({
  tableName: "semesters",
  uuid: true,
  courses: function() {
    return this.hasMany("Course");
  }
});

module.exports = bookshelf.model("Semester", Semester);
