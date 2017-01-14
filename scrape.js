
const request = require("request")
const cheerio = require("cheerio")

const pretty = require("./pretty")

const config = department => ({
  method : "post",
  url    : "http://appl101.lsu.edu/booklet2.nsf/68a84f901daef98386257b43006b778a?CreateDocument",
  body   : `%25%25Surrogate_SemesterDesc=1&SemesterDesc=Spring+2017&%25%25Surrogate_Department=1&Department=${department}`
})

const departments = ["HONORS"]

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

  let sections = []
  let currentSection = { }

  const LINE_TYPE_SECTION_COMMENT        = Symbol()
  const LINE_TYPE_INTERVAL_FIRST         = Symbol()
  const LINE_TYPE_INTERVAL_LAB           = Symbol()
  const LINE_TYPE_INTERVAL_GENERAL       = Symbol()
  const LINE_TYPE_INTERVAL_COMMENT       = Symbol()
  const LINE_TYPE_INTERVAL_EXTRA_TEACHER = Symbol()

  let currentLineType

  lines.forEach(function(line) {

    const enrollmentAvailable = line.slice(0, 3).trim()
    const enrollmentCount     = line.slice(5, 9).trim()
    const lineTrim            = line.trim()

    // Replace to ensure that all lines are the same max-width
    line = line.replace(/&amp;/g, '&').replace(/&apos;/g, '\'')

    // The following conditions signify the start of a new "section" context.

    // (1) If enrollmentAvailable is not empty, it is either a number or "(F)"
    // (2) If the line begins with "***" it indicates a section-wide comment
    //      - If the current course object has properties, we add the comment onto
    //        the existing course.
    //      - If the current course object has no properties, it is indicated
    //        that this is the beginning of a new "section" context

    const isSectionComment = lineTrim.startsWith("***")

    const firstCondition  = enrollmentAvailable !== ""
    const secondCondition = isSectionComment && !currentSection.enrollmentAvailable

    // If one of either conditions are met, start a new "section" context

    if (firstCondition || secondCondition) { 
      sections.push(currentSection)
      currentSection = {
        comments: [],
        timeIntervals: []
      }
    }

    // DETERMINE LINE TYPE

    // Section Comment: A section-wide comment applying to all time intervals (Can have multiple)
    // Ex. '      ***   CSC  7080  ***       CROSS-LISTED WITH   EE 7720'
    if (isSectionComment) {
      currentLineType = LINE_TYPE_SECTION_COMMENT
    }

    // Interval First: The start of a generalized interval. Things such as per-interval comments,
    // additional professors, or additional time intervals could follow.
    // Ex.  '  1    33  CSC  1351         1  COMP SCI II-MJRS       4.0   900-1020    T TH  0221 TUREAUD HALL                     BRANDT S'
    if (enrollmentAvailable !== "") {
      currentLineType = LINE_TYPE_INTERVAL_FIRST
    }

    // Extra Teacher: Indicates an extra teacher is being added to the most recently added time interval
    if (line.slice(0, 116).trim() === "") {
      currentLineType = LINE_TYPE_INTERVAL_EXTRA_TEACHER
    }

    // Interval Comment: Indicates the start of an interval comment, not a section-wide comment. This comment
    // is to be added specifically to the most recently added interval.
    if (lineTrim.startsWith("**") && !lineTrim.startsWith("***")) {
      currentLineType = LINE_TYPE_INTERVAL_COMMENT
    }

    // Lab Interval: Indicates the start of an interval with type lab.
    // Ex. '                     LAB                                     500-0750N     TH                                        BRANDT S',
    if (lineTrim.startsWith("LAB")) {
      currentLineType = LINE_TYPE_INTERVAL_LAB
    }

    // General Additional Interval: This indicates the start of an additional time interval for this section. Some
    // sections have different times or buildings on certain days, therefore there can be multiple time intervals.
    // Ex. '                                                        1130-1220    T     0138 LOCKETT'
    if (line.slice(0, 57).trim() === "" && line.includes("-")) {
      currentLineType = LINE_TYPE_INTERVAL_GENERAL
    }

    switch(currentLineType) {

      case LINE_TYPE_SECTION_COMMENT:
        currentSection.comments.push(line)

      case LINE_TYPE_INTERVAL_FIRST:
        currentSection.timeIntervals.push(parseIntervalLine(line))

    }


    // // HERE: Everything after this point is un-refactored.
    // // It was an initial try of the algorithm that I may keep some of, but not all of. Will change.

    // // Begin processing the information for the section, either adding to the section of past
    // // lines or adding to the new section reset by a starting condition.

    // if (enrollmentAvailable.trim() === "") {

    //   // If the "Enrolllment Available" column is empty, this means that something other
    //   // than the start of a new section is starting.

    //   // If the line, after a trim, begins with "***", this indicates a new section has started,
    //   // but that the section being started has one of more section-wide comments.

    //   if (line.trim().startsWith("***")) {
    //     if (!currentSection.comments) currentSection.comments = []
    //     currentSection.comments.push(line.trim())
    //   }

    // } else {

    //   // If the "Enrollment Available" column is not empty, this means a new section has started.

    // }

    // if (enrollmentAvailable.includes("(F)")) {
    //   currentSection.enrollmentFull = true
    // }

    // if (isNumber(enrollmentAvailable)) {
    //   currentSection.enrollmentAvailable = Number(enrollmentAvailable)
    // }

    // if (isNumber(enrollmentCount)) {
    //   currentSection.enrollmentCurrent = Number(enrollmentCount)
    //   if (currentSection.enrollmentFull) currentSection.enrollmentTotal = Number(enrollmentCount)
    //   else currentSection.enrollmentTotal = Number(enrollmentCount) + Number(enrollmentAvailable)
    // }

  })

}


  
//     ENRL   COURSE         SEC                          HR     TIME     DAYS                         SPECIAL
//AVL  CNT   ABBR NUM  TYPE  NUM  COURSE TITLE            CR  BEGIN-END   MTWTFS ROOM  BUILDING        ENROLLMENT      INSTRUCTOR
//----------------------------------------------------------------------------------------------------------------------------------
//   4     10    16   21   26   31                     54   59         70       79   84             99               118           132       
// 53    47  CHE  2171         2  CHE FUND MAT EN BAL    3.0   930-1020   M W F  0204 TUREAUD HALL                     BENTON M
//(F)     7  CHE  3104         1  ENGR MEASUREMENT LAB   3.0  1230-0120   M W    1221 PATRICK TAYLOR  CI-WRITTEN&SPOK  MELVIN E
function parseIntervalLine(line) {

  const enrollmentAvailable = line.slice(0, 4).trim()
  const enrollmentCount     = line.slice(4, 10).trim()
  let enrollmentFull        = enrollmentAvailable === "(F)"

  const courseAbbreviation = line.slice(10, 16).trim()
  const courseNumber       = line.slice(16, 21).trim()
  const courseHours        = line.slice(54, 59).trim()
  
  const sectionType   = line.slice(21, 26).trim()
  const sectionNumber = line.slice(26, 31).trim()
  const sectionTitle  = line.slice(31, 54).trim()

  const timeInterval = line.slice(59, 70).trim()
  const days         = line.slice(72, 78)
  let hasTime        = timeInterval.includes("-")
  let times          = timeInterval.split("-")
  let startTime      = times[0]
  let endTime        = times[1]
  let isNight        = timeInterval.includes("N")
  const dayArray     = []

  if (days.includes("H")) {
    if (findOccurences(days, "T") === 2) Array.prototype.push.apply(dayArray, ["TUESDAY", "THURSDAY"])
    else dayArray.push("THURSDAY")
  }

  else {
    if (days.includes("M")) dayArray.push("MONDAY")
    if (days.charAt(1) === "T") dayArray.push("TUESDAY")
    if (days.includes("W")) dayArray.push("WEDNESDAY")
    if (days.charAt(3) === "T") dayArray.push("THURSDAY")
    if (days.includes("F")) dayArray.push("FRIDAY") 
  }

  const roomNumber   = line.slice(79, 84).trim()
  const buildingName = line.slice(84, 99).trim()

  const specialEnrollment = line.slice(100, 116).trim()
  const isWebBased        = specialEnrollment.includes("WEB BASE")
  const isComIntensive    = specialEnrollment.includes("CI-WRITTEN&SPOK")

  const teacher = line.slice(117, line.length - 1)

  const r = {

    enrollment: {
      available : enrollmentFull ? 0 : Number(enrollmentAvailable),
      current   : Number(enrollmentCount),
      total     : enrollmentFull ? Number(enrollmentCount) : Number(enrollmentCount) + Number(enrollmentAvailable),
      isFull    : enrollmentFull,
    },

    course: {
      abbreviation : courseAbbreviation,
      number       : courseNumber,
      hours        : courseHours,

      special      : {
        text           : specialEnrollment,
        isComIntensive : isComIntensive,
        isWebBased     : isWebBased
      }
    },

    section: {
      type    : sectionType,
      number  : sectionNumber,
      title   : sectionTitle,
      teacher : teacher,

      location: {
        building : buildingName,
        room     : roomNumber,
      },

      time: {
        start   : startTime,
        end     : endTime,
        hasTime : hasTime,
        isNight : isNight,
        days    : dayArray,
      }

    }

  }

  console.log("\n" + pretty(r) + "\n")

  return r
}

function findOccurences(string, ofChar){
  return string.split(ofChar).length - 1;
}

function isNumber(num) {
  return !isNaN(num)
}

module.exports = scrape
