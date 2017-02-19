const scrapeDepartmentNames = require("./scrapeDepartmentNames")
const scrapeDepartmentCourses = require("./scrapeDepartmentCourses")
const persistCourses = require("./persistCourses")

const scrapeCatalogCourses = require("./scrapeCatalogCourses")
const mergeCatalogCourses = require("./mergeCatalogCourses")

// const run = () =>
//   scrapeDepartmentNames()
//     .then(scrapeDepartmentCourses)

const run = () =>
  scrapeDepartmentCourses(["BIOLOGICAL ENGINEERING"])
    .then(scrapeCatalogCourses)
    .then(mergeCatalogCourses)
    .then(persistCourses)

module.exports = run  
