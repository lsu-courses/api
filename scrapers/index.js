const scrapeDepartmentNames = require("./scrapeDepartmentNames");
const scrapeDepartmentCourses = require("./scrapeDepartmentCourses");
const persistCourses = require("./persistCourses");

const scrapeCatalogCourses = require("./scrapeCatalogCourses");
const mergeCatalogCourses = require("./mergeCatalogCourses");

// const run = () =>
//   scrapeDepartmentNames()
//     .then(scrapeDepartmentCourses)

const run = () => scrapeDepartmentNames()
  .then(scrapeDepartmentCourses)
  // scrapeDepartmentCourses([
  //   "COMPUTER SCIENCE",
  //   "MATHEMATICS",
  //   "PHYSICS",
  //   "MUSIC",
  //   "CHEMISTRY",
  //   "BIOLOGICAL SCIENCES",
  //   "ENGINEERING",
  //   "HONORS"
  // ])
  .then(scrapeCatalogCourses)
  .then(mergeCatalogCourses)
  .then(persistCourses);

module.exports = run;
