const Promise = require("bluebird")
const request = require("request-promise")
const cheerio = require("cheerio")

const scrape = departments => {

  const config = number => ({
    method: "post",
    uri: `http://catalog.lsu.edu/content.php?filter[cpage]=${number}&cur_cat_oid=14&expand=1&navoid=1068&print=1`,
  })

  const pageRequest = department =>
    request(config(department))
      .then(body => handleRequestResponse(body, departments))

  return Promise.map(
    range(1, 10),
    department => pageRequest(department),
    { concurrency: 5 }
  )

}

const handleRequestResponse = (body, departments) => {
  let $ = cheerio.load(body)

  let table = $(".block_content_outer .block_content table").last()

  if (!table) console.log("SAD")

  // table.each(function(i, elem) {

  //   let content = $(this).filter(i => $(this).attr("width") === "100%")

  //   if (content) console.log(content.html())
  // })

  // console.log("\n\nGOT PAGE\n\n")

  let children = $(table).children()
  let info_sections = []

  $(children).each((i, child) => {
    $(child).children().each((ii, inner_child) => {

      const title = $(inner_child).find("h3").text()
      const title_parts = title.split(" ")

      let section = {
        title: title,
        abbr: title_parts[0],
        number: title_parts[1],
        name: title_parts.slice(2, -1).join(" "),
        parts: [],
      }
      $(inner_child).find("ul li").children().each((index, el) => {

        if (index > 3) {
          const text = $(el).text()
          if (text.trim() !== "") section.parts.push(text)
        }
      })

      if (section.title.trim() !== "") info_sections.push(section)

    })
  })

  console.log(info_sections.length)

  return {
    sections: info_sections,
    departments: departments,  
  }
}

processSections = (sections, departments) => {
  console.log(departments)
}

const range = (low, high) => {
  var list = [];
  for (var i = low; i <= high; i++) {
      list.push(i);
  }
  return list
}

module.exports = scrape