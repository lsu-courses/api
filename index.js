const express = require("express")
const app = express()
const bookshelf = require("./bookshelf")
const scrape = require("./scrapers")

console.time("Time")

app.set("bookshelf", bookshelf)

//scrape()

    // .then(function(re) {
  //   console.log(`Got ${re.length} departments`)
  //   console.timeEnd("Time")
  // })

const Section = require("./models/section")
const TimeInterval = require("./models/time-interval")
const Course = require("./models/course")

app.get("/", (request, response) => {

  Course
    //.collection()
    .where("number", "1350")
    .fetch({

      withRelated: [
        "sections",
        "sections.timeIntervals",
        "sections.timeIntervals.instructor",
      ],

    })
    .then(courses => {
      response.json(courses)
    })

  // TimeInterval
  //   .collection()
  //   .fetch({
  //     withRelated: [
  //       "section",
  //       { "instructor" : qb => qb.column("name") },
  //     ],
  //   })
  //   .then(intervals => response.json({ intervals }))

})

app.listen(3000, () => console.log("listening"))