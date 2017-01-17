const request = require("request-promise")
const cheerio = require("cheerio")
//const pretty = require("./pretty")
const Promise = require("bluebird")

const config = department =>
  ({
    method: "post",
    uri: "http://appl101.lsu.edu/booklet2.nsf/68a84f901daef98386257b43006b778a?CreateDocument",
    body: `%25%25Surrogate_SemesterDesc=1&SemesterDesc=Spring+2017&%25%25Surrogate_Department=1&Department=${department}`,
  })

const scrape = (departments) => {

  const departmentRequest = department =>
    request(config(department))
      .then(body => handleRequestResponse(body))

  return Promise.map(
    departments,
    department => departmentRequest(department),
    { concurrency: Infinity }
  )

}

const handleRequestResponse = (body) => {

  let $ = cheerio.load(body)
  let pre = $("pre").html()

  if (!pre) return

  let lines = pre.split("\n").filter(str => str.trim().length > 0)
  return parseLines(lines)
}

const lineType = {
  SECTION_COMMENT: Symbol(),
  INTERVAL_FIRST: Symbol(),
  INTERVAL_LAB: Symbol(),
  INTERVAL_GENERAL: Symbol(),
  INTERVAL_COMMENT: Symbol(),
  INTERVAL_EXTRA_TEACHER: Symbol(),
}

const parseLines = lines => {

  let currentLineType
  let sections = []
  let currentSection
  let currentSectionInfo = { comments: [] }

  for (let i = 3; i < lines.length - 1; i++) {
    let line = lines[i].replace(/&amp/g, "&").replace(/&apos/g, "'")

    const enrollmentAvailable = line.slice(0, 3).trim()
    const lineTrim = line.trim()

    // If enrollmentAvailable is not empty, it is either a number or "(F)", indicating
    // that a new section has begun.
    if (enrollmentAvailable !== "") {
      if (currentSection)
        sections.push(currentSection)

      currentSection = { course: { comments: currentSectionInfo.comments } }
    }

    // DETERMINE LINE TYPE:
    // Determine the type of the current line. Do not process any information
    // that alters state.


    // Section Comment: A section-wide comment applying to all time intervals (Can have multiple)
    // Ex. '      ***   CSC  7080  ***       CROSS-LISTED WITH   EE 7720'
    if (lineTrim.startsWith("***"))
      currentLineType = lineType.SECTION_COMMENT

    // Interval First: The start of a generalized interval. Things such as per-interval comments,
    // additional professors, or additional time intervals could follow.
    // Ex.  '  1    33  CSC  1351         1  COMP SCI II-MJRS       4.0   900-1020    T TH  0221 TUREAUD HALL                     BRANDT S'
    else if (enrollmentAvailable !== "")
      currentLineType = lineType.INTERVAL_FIRST

    // Extra Teacher: Indicates an extra teacher is being added to the most recently added time interval
    else if (line.slice(0, 116).trim() === "")
      currentLineType = lineType.INTERVAL_EXTRA_TEACHER

    // Interval Comment: Indicates the start of an interval comment, not a section-wide comment. This comment
    // is to be added specifically to the most recently added interval.
    else if (lineTrim.startsWith("**") && !lineTrim.startsWith("***"))
      currentLineType = lineType.INTERVAL_COMMENT

    // Lab Interval: Indicates the start of an interval with type lab.
    // Ex. '                     LAB                                     500-0750N     TH                                        BRANDT S',
    else if (lineTrim.startsWith("LAB"))
      currentLineType = lineType.INTERVAL_LAB

    // General Additional Interval: This indicates the start of an additional time interval for this section. Some
    // sections have different times or buildings on certain days, therefore there can be multiple time intervals.
    // Ex. '                                                        1130-1220    T     0138 LOCKETT'
    else if (line.slice(0, 57).trim() === "" && line.includes("-"))
      currentLineType = lineType.INTERVAL_GENERAL

    // PROCESS LINES:
    // Process the information of the current line contextually based on the
    // determined line type

    let parsedLine = parseIntervalLine(line)

    switch (currentLineType) {
      case lineType.SECTION_COMMENT:
        currentSectionInfo.comments.push(line)
        break

      case lineType.INTERVAL_FIRST:
        setupCourse(currentSection, currentSectionInfo, parsedLine)
        addInterval(currentSection, parsedLine)
        break

      case (lineType.INTERVAL_LAB):
      case (lineType.INTERVAL_GENERAL):
        addInterval(currentSection, parsedLine)
        break

      case lineType.INTERVAL_COMMENT:
        processComment(currentSection, line)
        break

      case lineType.INTERVAL_EXTRA_TEACHER:
        getCurrentInterval(currentSection).teachers.push(line.trim())
        break
    }
  }

  return sections
}

// A functional reducer-like function that takes comments, and the current interval,
// and affects the state of the current interval based on the context of the comment.
const processComment = (currentSection, line) => {
  let interval = getCurrentInterval(currentSection)

  if (line.includes("LAB WILL BE HELD IN ")) {
    const comment = line.replace("**", "").trim()
    let commentSections = comment.split(" ")

    interval.comments.push(comment)

    interval.location.building = commentSections[6]
    interval.location.room = commentSections[5]
    return
  }

  interval.comments.push(line)
}

const getCurrentInterval = currentSection => {
  return currentSection.section.intervals[currentSection.section.intervals.length - 1]
}

const setupCourse = (currentSection, currentSectionInfo, parsedLine) => {
  let comments = currentSection.course.comments
  currentSection.course = parsedLine.course
  currentSection.course.comments = comments
  currentSectionInfo.comments = []
  currentSection.section = { enrollment: parsedLine.enrollment, intervals: [] }
}

const addInterval = (currentSection, parsedLine) => {
  currentSection.section.intervals.push({
    teachers: [ parsedLine.section.teacher ],
    comments: [],
    type: parsedLine.section.type,
    isLab: parsedLine.section.isLab,
    number: parsedLine.section.number,
    title: parsedLine.section.title,
    location: parsedLine.section.location,
    time: parsedLine.section.time,
  })
}

//     ENRL   COURSE         SEC                          HR     TIME     DAYS                         SPECIAL
//AVL  CNT   ABBR NUM  TYPE  NUM  COURSE TITLE            CR  BEGIN-END   MTWTFS ROOM  BUILDING        ENROLLMENT      INSTRUCTOR
//----------------------------------------------------------------------------------------------------------------------------------
//   4     10    16   21   26   31                     54   59         70       79   84             99               118           132
// 53    47  CHE  2171         2  CHE FUND MAT EN BAL    3.0   930-1020   M W F  0204 TUREAUD HALL                     BENTON M
//(F)     7  CHE  3104         1  ENGR MEASUREMENT LAB   3.0  1230-0120   M W    1221 PATRICK TAYLOR  CI-WRITTEN&SPOK  MELVIN E
const parseIntervalLine = line => {
  const enrollmentAvailable = Number(line.slice(0, 4).trim())
  const enrollmentCount = Number(line.slice(4, 10).trim())
  const enrollmentFull = enrollmentAvailable === "(F)"

  const courseAbbreviation = line.slice(10, 16).trim()
  const courseNumber = line.slice(16, 21).trim()
  const courseHours = line.slice(54, 59).trim()

  const sectionType = line.slice(21, 26).trim()
  const isLab = sectionType.includes("LAB")
  const sectionNumber = line.slice(26, 31).trim()
  const sectionTitle = line.slice(31, 54).trim()

  const timeInterval = line.slice(59, 70).trim()
  const days = line.slice(72, 78)
  let hasTime = timeInterval.includes("-")
  let times = timeInterval.split("-")
  let startTime = times[0]
  let endTime = times[1]
  let isNight = timeInterval.includes("N")
  const dayArray = []

  if (days.includes("H"))
    if (days.split("T").length - 1 === 2) Array.prototype.push.apply(dayArray, [ "TUESDAY", "THURSDAY" ])
    else dayArray.push("THURSDAY")
  else {
    if (days.includes("M"))     dayArray.push("MONDAY")
    if (days.charAt(1) === "T") dayArray.push("TUESDAY")
    if (days.includes("W"))     dayArray.push("WEDNESDAY")
    if (days.charAt(3) === "T") dayArray.push("THURSDAY")
    if (days.includes("F"))     dayArray.push("FRIDAY")
  }

  const roomNumber = line.slice(79, 84).trim()
  const buildingName = line.slice(84, 99).trim()

  const specialEnrollment = line.slice(100, 116).trim()
  const isWebBased = specialEnrollment.includes("WEB BASE")
  const isComIntensive = specialEnrollment.includes("CI-WRITTEN&SPOK")

  const teacher = line.slice(117, line.length - 1)

  return {
    enrollment: {
      available: enrollmentFull ? 0 : enrollmentAvailable,
      current: enrollmentCount,
      total: enrollmentFull
        ? enrollmentCount
        : enrollmentCount + enrollmentAvailable,
      isFull: enrollmentFull,
    },
    course: {
      abbreviation: courseAbbreviation,
      number: courseNumber,
      hours: courseHours,
      special: {
        text: specialEnrollment,
        isComIntensive,
        isWebBased,
      },
    },
    section: {
      type: sectionType,
      isLab: isLab,
      number: sectionNumber,
      title: sectionTitle,
      teacher: teacher,
      location: { building: buildingName, room: roomNumber },
      time: {
        start: startTime,
        end: endTime,
        hasTime,
        isNight,
        days: dayArray,
      },
    },
  }
}

module.exports = scrape
