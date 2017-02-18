const scrapeDepartmentNames = require("./scrapeDepartmentNames")
const scrapeDepartmentCourses = require("./scrapeDepartmentCourses")
const persistCourses = require("./persistCourses")

// const run = () =>
//   scrapeDepartmentNames()
//     .then(scrapeDepartmentCourses)

const run = () =>
  scrapeDepartmentCourses(["BIOLOGICAL ENGINEERING"])
    .then(persistCourses)

module.exports = run  
