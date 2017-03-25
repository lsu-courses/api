const config = require("./knexfile");
const knex = require("knex")(config);

const bookshelf = require("bookshelf")(knex);

bookshelf.plugin(require("bookshelf-modelbase").pluggable);
bookshelf.plugin(require("bookshelf-uuid"));
bookshelf.plugin("registry");

module.exports = {
  bookshelf: bookshelf,
  knex: knex
};
