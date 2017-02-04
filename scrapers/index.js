const scrapeDepartmentNames = require("./scrapeDepartmentNames")
const scrapeDepartmentCourses = require("./scrapeDepartmentCourses")
const persistCourses = require("./persistCourses")

// const run = () =>
//   scrapeDepartmentNames()
//     .then(scrapeDepartmentCourses)

const run = () =>
  scrapeDepartmentCourses(["COMPUTER SCIENCE"])
    .then(persistCourses)

module.exports = run  
