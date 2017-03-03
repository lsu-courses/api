const express = require("express");
const app = express();
const bookshelf = require("./bookshelf");
const scrape = require("./scrapers");
const bodyParser = require("body-parser");
const cors = require("cors");

console.time("Time");

app.set("bookshelf", bookshelf);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.options("*", cors());

app.listen(8080, () => console.log("listening"));

scrape()

// .then(function(re) {
//   console.log(`Got ${re.length} departments`)
//   console.timeEnd("Time")
// })

const Section = require("./models/section");
const TimeInterval = require("./models/time-interval");
const Course = require("./models/course");

app.get("/", (request, response) => {
  let section_columns = ["id", "abbreviation", "number", "hours"];

  response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  // response.setHeader(
  //   "Access-Control-Allow-Methods",
  //   "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  // ); // If needed
  // response.setHeader(
  //   "Access-Control-Allow-Headers",
  //   "X-Requested-With,contenttype,Content-Type,Accept"
  // ); // If needed
  // response.setHeader("Access-Control-Allow-Credentials", true); // If needed

  console.log(request.query);

  console.log("here");

  Course
    //.collection()
    .where("number", request.query.input || "1252")
    .fetch({
      withRelated: [
        "sections",
        "sections.timeIntervals",
        "sections.timeIntervals.instructor"
      ]
    })
    .then(courses => {
      response.json(courses);
    });
  // TimeInterval
  //   .collection()
  //   .fetch({
  //     withRelated: [
  //       "section",
  //       { "instructor" : qb => qb.column("name") },
  //     ],
  //   })
  //   .then(intervals => response.json({ intervals }))
});
