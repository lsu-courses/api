const { bookshelf } = require("../bookshelf");
require("./section");

const Instructors = bookshelf.Collection.extend({
  model: "instructor"
});

module.exports = bookshelf.collection("Instructors", Instructors);
