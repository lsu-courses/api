const { knex } = require("../bookshelf");
const scrape = require("../scrapers")
const chalk = require('chalk');

const dropDatabaseIntervalMs = 3600000; // every hour

const emptyDatabaseThenScrape = () => {
  knex
    .raw(
      `
      DELETE FROM instructors_time_intervals;
      DELETE FROM time_intervals;
      DELETE FROM sections;
      DELETE FROM instructors;
      DELETE FROM courses;
    `
    )
    .then(() => console.log(chalk.red("\nDatabase cleared.\n")))
    .then(scrape);
};

const setScrapeInterval = () => {
  setInterval(emptyDatabaseThenScrape, dropDatabaseIntervalMs);
};

module.exports = {
  setScrapeInterval,
  emptyDatabaseThenScrape
};
