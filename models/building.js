const { bookshelf } = require("../bookshelf");
require("./section");

const Building = bookshelf.Model.extend({
  tableName: "buildings",
  uuid: true,
  sections: function() {
    return this.belongsToMany("Section");
  }
});

module.exports = bookshelf.model("Building", Building);
