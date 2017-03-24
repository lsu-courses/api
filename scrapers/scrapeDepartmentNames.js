const Promise = require("bluebird");
const request = require("request-promise");
const cheerio = require("cheerio");
const chalk = require("chalk");

const scrape = () => {
  const config = () => ({
    method: "post",
    uri: "http://appl101.lsu.edu/booklet2.nsf/Selector2?OpenForm"
  });

  return request(config()).then(body => handleRequestResponse(body));
};

module.exports = scrape;

const handleRequestResponse = body => {
  let $ = cheerio.load(body);
  let selects = $("select");

  /* scrapes semesters – not currently in use */
  // let modules = getSelectOptions($, selects.get(0));
  let departments = getSelectOptions($, selects.get(1));

  console.log(chalk.blue(`${departments.length} departments found.`));

  return departments;
};

const getSelectOptions = ($, select) =>
  $(select)
    .children()
    .map((i, el) => $(el).text())
    .get()
    .map(text => text.replace("\n", ""));
