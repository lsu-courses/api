const Promise = require("bluebird")
const request = require("request-promise")
const cheerio = require("cheerio")
const pretty = require("../pretty")

const scrape = () => {

  const config = () => ({
    method: "post",
    uri: "http://appl101.lsu.edu/booklet2.nsf/Selector2?OpenForm",
    //body: "/BOOKLET2.nsf/Selector2?OpenForm"
  })
  
  return request(config())
    .then(body => handleRequestResponse(body))

}

module.exports = scrape

const handleRequestResponse = body => {
  let $ = cheerio.load(body)
  let selects = $("select")

  let modules = getSelectOptions($, selects.get(0))
  let departments = getSelectOptions($, selects.get(1))

  return departments
}

const getSelectOptions = ($, select) =>
  $(select).children()
    .map((i, el) => $(el).text()).get()
    .map(text => text.replace("\n", ""))
