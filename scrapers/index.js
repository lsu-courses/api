const scrapeDepartmentNames = require("./scrapeDepartmentNames")
const scrapeDepartmentCourses = require("./scrapeDepartmentCourses")

const run = () =>
  scrapeDepartmentNames()
    .then(scrapeDepartmentCourses)

module.exports = run
