
const request = require("request")
const cheerio = require("cheerio")

const config = department => ({
  method : "post",
  url    : "http://appl101.lsu.edu/booklet2.nsf/68a84f901daef98386257b43006b778a?CreateDocument",
  body   : `%25%25Surrogate_SemesterDesc=1&SemesterDesc=Spring+2017&%25%25Surrogate_Department=1&Department=${department}`
})

const departments = ["COMPUTER SCIENCE"]

function scrape() {
  departments.forEach(department => request(config(department), onResponse))
}

function onResponse(error, response, body) {

  if (error) {

  }

  let $   = cheerio.load(body)
  let pre = $("pre")

  let lines   = $(pre).html().split("\n")
  let courses = parseLines(lines)

  console.log(lines)

}

function parseLines(lines) {

  let courseDefault = {
    enrollmentFull: false,
    enrollmentAvailable: 0,
    enrollmentCurrent: 0,
    enrollmentTotal: 0,
    creditHours: 0,
    timeIntervals: [],
    comments: []
  }

  let courses = []
  let currentCourse = { }

  lines.forEach(function(line) {

    const enrollmentAvailable = line.slice(0, 3).trim()
    const enrollmentCount     = line.slice(5, 9).trim()

    // In these two cases

    if (
      enrollmentAvailable !== "" ||
      line.trim()
    )


    // If the current line begins with either of the following conditions, it
    // indicates that information for a new section has started.

    // If this line begins with "***", it is a section-wide comment

    if (line.trim().startsWith("***")) {

      // If the current course object has no comments and no enrollment information 

      if (!currentCourse.comments && !currentCourse.enrollmentAvailable) {
        courses.push(currentCourse)
        currentCourse = {}
      }

    }

    if (enrollmentAvailable.trim() !== "") {

      if (currentCourse.comments) {

      }

    }

    if (
      (enrollmentAvailable.trim() !== "" || line.trim().startsWith("***"))
      && currentCourse !== { }
    ) {
      courses.push(currentCourse)
      currentCourse = { }
    }

    // Begin processing the information for the section, either adding to the section of past
    // lines or adding to the new section reset by a starting condition.

    if (enrollmentAvailable.trim() === "") {

      // If the "Enrolllment Available" column is empty, this means that something other
      // than the start of a new section is starting.

      // If the line, after a trim, begins with "***", this indicates a new section has started,
      // but that the section being started has one of more section-wide comments.

      if (line.trim().startsWith("***")) {
        if (!currentCourse.comments) currentCourse.comments = []
        currentCourse.comments.push(line.trim())
      }

    } else {

      // If the "Enrollment Available" column is not empty, this means a new section has started.

    }

    if (enrollmentAvailable.includes("(F)")) {
      currentCourse.enrollmentFull = true
    }

    if (isNumber(enrollmentAvailable)) {
      currentCourse.enrollmentAvailable = Number(enrollmentAvailable)
    }

    if (isNumber(enrollmentCount)) {
      currentCourse.enrollmentCurrent = Number(enrollmentCount)
      if (currentCourse.enrollmentFull) currentCourse.enrollmentTotal = Number(enrollmentCount)
      else currentCourse.enrollmentTotal = Number(enrollmentCount) + Number(enrollmentAvailable)
    }

    console.log(currentCourse)

  })

}

function isNumber(num) {
  return !isNaN(num)
}

module.exports = scrape
