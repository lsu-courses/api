const Promise = require("bluebird");
const request = require("request-promise");
const cheerio = require("cheerio");
const chalk = require("chalk");

const scrape = departments => {
  const config = department => ({
    method: "post",
    uri: "http://appl101.lsu.edu/booklet2.nsf/68a84f901daef98386257b43006b778a?CreateDocument",
    body: `%25%25Surrogate_SemesterDesc=1&SemesterDesc=Fall+2017&%25%25Surrogate_Department=1&Department=${department}`
  });

  console.log("\nDept \tSections");
  console.log("----------------");

  const departmentRequest = department =>
    request(config(escapeDepartment(department))).then(body =>
      handleRequestResponse(department, body));

  return Promise.map(departments, department => departmentRequest(department), {
    concurrency: Infinity
  });
};

const escapeDepartment = department =>
  department
    .replace(/\s+/g, "+")
    .replace(/&/g, "%26")
    .replace(/\'/g, "%27")
    .replace(/,/g, "%2C");

const handleRequestResponse = (department, body) => {
  let $ = cheerio.load(body);
  let pre = $("pre").html();

  if (!pre) {
    console.log(chalk.red(`${department}: no courses found`));
    return;
  }

  let lines = pre.split("\n").filter(str => str.trim().length > 0);
  return parseLines(lines);
};

const lineType = {
  SECTION_COMMENT: Symbol(),
  INTERVAL_FIRST: Symbol(),
  INTERVAL_LAB: Symbol(),
  INTERVAL_GENERAL: Symbol(),
  INTERVAL_COMMENT: Symbol(),
  INTERVAL_EXTRA_TEACHER: Symbol(),
  INTERVAL_EXTRA_SPECIAL: Symbol()
};

const parseLines = lines => {
  let currentLineType;
  let sections = [];
  let currentSection;
  let currentSectionInfo = { comments: [] };

  for (let i = 3; i < lines.length - 1; i++) {
    let line = lines[i].replace(/&amp;/g, "&").replace(/&apos;/g, "'");

    const enrollmentAvailable = line.slice(0, 3).trim();
    const lineTrim = line.trim();

    currentLineType = undefined;

    // If enrollmentAvailable is not empty, it is either a number or "(F)", indicating
    // that a new section has begun.
    if (enrollmentAvailable !== "") {
      if (currentSection) sections.push(currentSection);

      currentSection = { course: { comments: currentSectionInfo.comments } };
    }

    // DETERMINE LINE TYPE:
    // Determine the type of the current line. Do not process any information
    // that alters state.

    // Section Comment: A section-wide comment applying to all time intervals (Can have multiple)
    // Ex. '      ***   CSC  7080  ***       CROSS-LISTED WITH   EE 7720'

    // Note. Upon furhter research, section comments actually apply to
    // all instances (sections) of a course.
    if (lineTrim.startsWith("***"))
      currentLineType = lineType.SECTION_COMMENT;
    else if (enrollmentAvailable !== "")
      // Interval First: The start of a generalized interval. Things such as per-interval comments,
      // additional professors, or additional time intervals could follow.
      // Ex.  '  1    33  CSC  1351         1  COMP SCI II-MJRS       4.0   900-1020    T TH  0221 TUREAUD HALL                     BRANDT S'
      currentLineType = lineType.INTERVAL_FIRST;
    else if (line.slice(0, 116).trim() === "")
      // Extra Teacher: Indicates an extra teacher is being added to the most recently added time interval
      currentLineType = lineType.INTERVAL_EXTRA_TEACHER;
    else if (lineTrim.startsWith("**") && !lineTrim.startsWith("***"))
      // Interval Comment: Indicates the start of an interval comment, not a section-wide comment. This comment
      // is to be added specifically to the most recently added interval.
      currentLineType = lineType.INTERVAL_COMMENT;
    else if (lineTrim.startsWith("LAB"))
      // Lab Interval: Indicates the start of an interval with type lab.
      // Ex. '                     LAB                                     500-0750N     TH                                        BRANDT S',
      currentLineType = lineType.INTERVAL_LAB;
    else if (
      line.slice(0, 57).trim() === "" && line.slice(59, 70).trim().includes("-")
    )
      // General Additional Interval: This indicates the start of an additional time interval for this section. Some
      // sections have different times or buildings on certain days, therefore there can be multiple time intervals.
      // Ex. '                                                        1130-1220    T     0138 LOCKETT'
      currentLineType = lineType.INTERVAL_GENERAL;

    // PROCESS LINES:
    // Process the information of the current line contextually based on the
    // determined line type

    let parsedLine = parseIntervalLine(line);

    switch (currentLineType) {
      case lineType.SECTION_COMMENT:
        if (line.includes("***")) {
          let newLine = line.slice(line.lastIndexOf("***") + 3).trim();
          currentSectionInfo.comments.push(newLine);
          break;
        }

        currentSectionInfo.comments.push(line);
        break;

      case lineType.INTERVAL_FIRST:
        setupCourse(currentSection, currentSectionInfo, parsedLine);
        addInterval(currentSection, parsedLine);
        break;

      case lineType.INTERVAL_LAB:
      case lineType.INTERVAL_GENERAL:
        addInterval(currentSection, parsedLine);
        break;

      case lineType.INTERVAL_COMMENT:
        processComment(currentSection, line);
        break;

      case lineType.INTERVAL_EXTRA_TEACHER:
        getCurrentInterval(currentSection).teachers.push(line.trim());
        break;
    }

    // This means that this line (any line) has a special
    // enrollment addition to it. It will be processed separately
    // here and added to the most recent interval.

    let specialText = line.slice(100, 116).trim();

    if (specialText !== "") {
      updateSpecial(currentSection, specialText);
    }
  }

  if (sections.length > 0)
    console.log(
      chalk.green(sections[0].course.abbreviation) + ":\t" + sections.length
    );

  return sections;
};

// A functional reducer-like function that takes comments, and the current interval,
// and affects the state of the current interval based on the context of the comment.
const processComment = (currentSection, line) => {
  let interval = getCurrentInterval(currentSection);

  if (line.includes("LAB WILL BE HELD IN ")) {
    const comment = line.replace("**", "").trim();
    let commentSections = comment.split(" ");

    interval.comments.push(comment);

    interval.location.building = commentSections[6];
    interval.location.room = commentSections[5];

    if (interval.location.building === "PFT")
      interval.location.building = "PATRICK TAYLOR";

    return;
  }

  if (line.toLowerCase().includes("reserved")) {
    interval.special.info.isReserved = true;
  }

  if (line.toLowerCase().includes("web-based")) {
    interval.special.info.isAllWeb = true;
  }

  // if (line.includes("***")) {
  //   let newLine = line.slice(line.lastIndexof("***") + 3).trim();

  //   interval.comments.push(newLine);
  //   return;
  // }

  interval.comments.push(line);
};

const updateSpecial = (currentSection, text) => {
  //let results = processSpecial(text)
  let interval = getCurrentInterval(currentSection);
  //interval.special.info = Object.assign({}, interval.special.info, results)
  let info = interval.special.info;

  let special = {
    hasSpecial: true,

    isAllWeb: text.includes("100% WEB"),
    isMostWeb: text.includes("75-99% WEB"),
    isHalfWeb: text.includes("50-74% WEB"),
    isSomeWeb: text.includes("1-49% WEB"),

    requiresDeptPerm: text.includes("PERMIS OF DEPT"),
    requiresInstPerm: text.includes("PERMIS OF INST"),

    isMajorsOnly: text.includes("MAJORS ONLY"),

    communicationIntensive: {
      isIntensive: text.includes("CI"),
      type: {
        written: text.includes("WRIT"),
        spoken: text.includes("SPOK"),
        tech: text.includes("TECH"),
        visual: text.includes("VISU")
      }
    },

    isServiceLearning: text.includes("SVC LEARNING")
  };

  if (!info.hasSpecial) info.hasSpecial = true;
  if (!info.isAllWeb && special.isAllWeb) info.isAllWeb = true;
  if (!info.isMostWeb && special.isMostWeb) info.isMostWeb = true;
  if (!info.isHalfWeb && special.isHalfWeb) info.isHalfWeb = true;
  if (!info.isSomeWeb && special.isSomeWeb) info.isSomeWeb = true;
  if (!info.requiresDeptPerm && special.requiresDeptPerm)
    info.requiresDeptPerm = true;
  if (!info.requiresInstPerm && special.requiresInstPerm)
    info.requiresInstPerm = true;
  if (!info.isMajorsOnly && special.isMajorsOnly) info.isMajorsOnly = true;

  let comIntensive = special.communicationIntensive;

  if (!info.isIntensive && comIntensive.isIntensive)
    info.communicationIntensive.isIntensive = true;

  if (!info.communicationIntensive.type.written && comIntensive.type.written)
    info.communicationIntensive.type.written = true;
  if (!info.communicationIntensive.type.spoken && comIntensive.type.spoken)
    info.communicationIntensive.type.spoken = true;
  if (!info.communicationIntensive.type.tech && comIntensive.type.tech)
    info.communicationIntensive.type.tech = true;
  if (!info.communicationIntensive.type.visual && comIntensive.type.visual)
    info.communicationIntensive.type.visual = true;

  if (!info.isServiceLearning && special.isServiceLearning)
    info.isServiceLearning = true;
};

const getCurrentInterval = currentSection => {
  return currentSection.section.intervals[
    currentSection.section.intervals.length - 1
  ];
};

const setupCourse = (currentSection, currentSectionInfo, parsedLine) => {
  let comments = currentSection.course.comments;
  currentSection.course = parsedLine.course;
  currentSection.course.comments = comments;
  currentSectionInfo.comments = [];
  currentSection.section = {
    enrollment: parsedLine.enrollment,
    intervals: []
  };
};

const getDefaultSpecialInfo = () => ({
  hasSpecial: false,
  texts: [],

  isAllWeb: false,
  isMostWeb: false,
  isHalfWeb: false,
  isSomeWeb: false,

  requiresDeptPerm: false,
  requiresInstPerm: false,

  isMajorsOnly: false,

  communicationIntensive: {
    isIntensive: false,
    type: {
      written: false,
      spoken: false,
      tech: false,
      visual: false
    }
  },

  isServiceLearning: false
});

const addInterval = (currentSection, parsedLine) => {
  let number = parsedLine.section.number.length > 1
    ? parsedLine.section.number
    : "0" + parsedLine.section.number;

  currentSection.section.intervals.push({
    teachers: parsedLine.section.teachers,
    comments: [],
    type: parsedLine.section.type,
    isLab: parsedLine.section.isLab,
    number: number,
    title: parsedLine.section.title,
    special: { info: getDefaultSpecialInfo() },
    //special: parsedLine.section.special || { woah: "GAAAAA" },
    location: parsedLine.section.location,
    time: parsedLine.section.time
  });
};

//     ENRL   COURSE         SEC                          HR     TIME     DAYS                         SPECIAL
//AVL  CNT   ABBR NUM  TYPE  NUM  COURSE TITLE            CR  BEGIN-END   MTWTFS ROOM  BUILDING        ENROLLMENT      INSTRUCTOR
//----------------------------------------------------------------------------------------------------------------------------------
//   4     10    16   21   26   31                     54   59         70       79   84             99               118           132
// 53    47  CHE  2171         2  CHE FUND MAT EN BAL    3.0   930-1020   M W F  0204 TUREAUD HALL                     BENTON M
//(F)     7  CHE  3104         1  ENGR MEASUREMENT LAB   3.0  1230-0120   M W    1221 PATRICK TAYLOR  CI-WRITTEN&SPOK  MELVIN E
const parseIntervalLine = line => {
  let enrollmentAvailable = Number(line.slice(0, 4).trim());
  let enrollmentCount = Number(line.slice(4, 10).trim());
  let enrollmentFull = line.slice(0, 4).trim() === "(F)";

  const courseAbbreviation = line.slice(10, 16).trim();
  const courseNumber = line.slice(16, 21).trim();
  const courseHours = line.slice(54, 59).trim();

  const sectionType = line.slice(21, 26).trim();
  const isLab = sectionType.includes("LAB");
  const sectionNumber = line.slice(26, 31).trim();
  const sectionTitle = line.slice(31, 54).trim();

  const timeInterval = line.slice(59, 70).trim();
  const days = line.slice(72, 78);
  const hasTime = timeInterval.includes("-");
  const times = timeInterval.split("-");
  const startTime = times[0];
  const endTime = times[1];
  const isNight = timeInterval.includes("N");
  const dayArray = [];

  if (days.includes("M")) dayArray.push("MONDAY");
  if (days.charAt(1) === "T") dayArray.push("TUESDAY");
  if (days.includes("W")) dayArray.push("WEDNESDAY");
  if (days.charAt(3) === "T" || days.includes("H")) dayArray.push("THURSDAY");
  if (days.includes("F")) dayArray.push("FRIDAY");

  const roomNumber = line.slice(79, 84).trim();
  const buildingName = line.slice(84, 99).trim();

  const specialEnrollment = line.slice(100, 116).trim();
  //const specialObject = processSpecial(specialEnrollment)

  const instructorName = line.slice(117, line.length);

  // Fix fields

  if (Number.isNaN(enrollmentAvailable)) enrollmentAvailable = 0;

  // Return final object

  return {
    enrollment: {
      available: enrollmentAvailable,
      current: enrollmentCount,
      total: enrollmentFull
        ? enrollmentCount
        : enrollmentCount + enrollmentAvailable,
      is_full: enrollmentFull
    },
    course: {
      abbreviation: courseAbbreviation,
      number: courseNumber,
      hours: courseHours
    },
    section: {
      type: sectionType,
      isLab: isLab,
      number: sectionNumber,
      title: sectionTitle,
      teachers: [instructorName],
      location: { building: buildingName, room: roomNumber },
      time: {
        start: startTime,
        end: endTime,
        hasTime,
        isNight,
        days: dayArray
      }
    }
  };
};

module.exports = scrape;
