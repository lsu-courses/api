const scrapeDepartmentNames = require("./scrapeDepartmentNames");
const scrapeDepartmentCourses = require("./scrapeDepartmentCourses");
const persistCourses = require("./persistCourses");
const scrapeCatalogCourses = require("./scrapeCatalogCourses");
const mergeCatalogCourses = require("./mergeCatalogCourses");

const run = () =>
  scrapeDepartmentNames()
    .then(scrapeDepartmentCourses)
    .then(scrapeCatalogCourses)
    .then(mergeCatalogCourses)
    .then(persistCourses)
    .then(() => console.log(`\nScraping completed.\n`));

module.exports = run;
