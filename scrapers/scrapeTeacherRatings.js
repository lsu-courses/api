const Promise = require("bluebird");
const request = require("request-promise");
const cheerio = require("cheerio");

const scrape = departments => {
  const promises = [];

  departments.forEach(dept => {
    console.log(dept);
  });
};
