const express = require("express");
const app = express();
const { bookshelf, knex } = require("./bookshelf");
const scrape = require("./scrapers");
const bodyParser = require("body-parser");
const cors = require("cors");
const chalk = require("chalk");

console.time("Time");

app.set("bookshelf", bookshelf);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.options("*", cors());

const port = process.env.PORT || 8080;

app.listen(port, () =>
  console.log(chalk.green(`\nListening on port ${port}\n`)));

const interval_ms = 600000;

const delete_query = `
  DELETE FROM instructors_time_intervals;
  DELETE FROM time_intervals;
  DELETE FROM sections;
  DELETE FROM instructors;
  DELETE FROM courses;
`;

function onInterval() {
  knex
    .raw(delete_query)
    .then(() => console.log(chalk.green("Database cleared\n")))
    .then(scrape);
}

onInterval();

setInterval(onInterval, interval_ms);

const Section = require("./models/section");
const TimeInterval = require("./models/time-interval");
const Course = require("./models/course");

function processInput(input) {
  const lower = input.toLowerCase();
  const array = lower.split(" ");

  return {
    text: lower,
    array: array,
    rest: array.length > 1 ? lower.slice(lower.indexOf(" ")).trim() : ""
  };
}

app.get("/department", (request, response) => {
  response.setHeader(
    "Access-Control-Allow-Origin",
    process.env.WEBSITE_DOMAIN || "http://localhost:3000"
  );

  const department = request.query.dept;

  console.time("Department Query");
  printSearchType("Department", department);

  Course.where("abbreviation", department.toUpperCase())
    .query("orderBy", "number", "asc")
    .fetchAll(fetch_object)
    .then(courses => {
      console.timeEnd("Department Query");
      return fixCourses(courses, response);
    });
});

function fixCourses(courses, response) {
  let new_courses = [];

  courses.forEach(course => {
    // Remove Course ID
    let new_course = JSON.parse(JSON.stringify(course));
    delete new_course.id;

    let new_sections = [];

    // Remove section ID and course_id
    new_course.sections.forEach(section => {
      let new_section = JSON.parse(JSON.stringify(section));
      delete new_section.id;
      delete new_section.course_id;

      let new_time_intervals = [];

      section.timeIntervals.forEach(ti => {
        let new_ti = JSON.parse(JSON.stringify(ti));
        delete new_ti.id;
        delete new_ti.section_id;

        let new_instructor = [];

        ti.instructor.forEach(i => {
          let new_i = JSON.parse(JSON.stringify(i));
          delete new_i["_pivot_time_interval_id"];
          delete new_i["_pivot_instructor_id"];

          new_instructor.push(new_i);
        });

        new_ti.instructor = new_instructor;

        new_time_intervals.push(new_ti);
      });

      new_section.timeIntervals = new_time_intervals;

      new_sections.push(new_section);
    });

    new_course.sections = new_sections;

    new_courses.push(new_course);
  });

  response.json(new_courses);
}

const fetch_object = {
  withRelated: [
    {
      sections: qb => {
        qb.column(
          "id",
          "course_id",
          "number",
          "title",
          "enrollment_available",
          "enrollment_current",
          "enrollment_is_full",
          "enrollment_total"
        );
        qb.orderBy("number");
      }
    },
    {
      "sections.timeIntervals": qb => {
        qb.column(
          "id",
          "section_id",
          "start",
          "end",
          "has_time",
          "days",
          "comments",
          "location_building",
          "location_room",
          "is_lab",
          "s_night",
          "s_all_web",
          "s_most_web",
          "s_half_web",
          "s_some_web",
          "s_req_dept_perm",
          "s_req_inst_perm",
          "s_majors_only",
          "s_cmi",
          "s_cmi_written",
          "s_cmi_spoken",
          "s_cmi_tech",
          "s_cmi_visual",
          "s_svc"
        );
      }
    },
    {
      "sections.timeIntervals.instructor": qb => qb.column("name")
    }
  ],
  columns: [
    "id",
    "abbreviation",
    "number",
    "hours",
    "full_title",
    "description",
    "comments"
  ]
};

app.get("/", (request, response) => {
  let section_columns = ["id", "abbreviation", "number", "hours"];

  const departments = ["math", "csc"];
  const teachers = ["kooima"];

  response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");

  const input = processInput(request.query.input);
  const { text, array, rest } = input;

  console.log(chalk.blue(`\nProcessing input: `) + chalk.green(`${text}`));

  if (isNaN(array[0])) {
    // MATH ...
    if (departments.includes(array[0])) {
      printSearchType("Department", array[0]);

      if (isNaN(array[1])) {
        printSearchType("Course", rest);
        // MATH Graphy Theory ...

        // .fetch({
        //   withRelated: [{ sections: qb => qb.where("title", rest) }]
        // })

        Course.where("abbreviation", array[0].toUpperCase())
          .fetchAll(fetch_object)
          .then(courses => {
            // All the code that follows is a shitty (but functional) effort to save space
            // Bookshelf forces you to initially still include IDs in the column specifications
            // so that it can make the join table relations when building a query.
            // There is no good way to remove these except for the bad way that follows.
            // If we ever want to allow visiting a course page, simply include the course_id
            // instead of removing it.

            let new_courses = [];

            courses.forEach(course => {
              // Remove Course ID
              let new_course = JSON.parse(JSON.stringify(course));
              delete new_course.id;

              let new_sections = [];

              // Remove section ID and course_id
              new_course.sections.forEach(section => {
                let new_section = JSON.parse(JSON.stringify(section));
                delete new_section.id;
                delete new_section.course_id;

                let new_time_intervals = [];

                section.timeIntervals.forEach(ti => {
                  let new_ti = JSON.parse(JSON.stringify(ti));
                  delete new_ti.id;
                  delete new_ti.section_id;

                  let new_instructor = [];

                  ti.instructor.forEach(i => {
                    let new_i = JSON.parse(JSON.stringify(i));
                    delete new_i["_pivot_time_interval_id"];
                    delete new_i["_pivot_instructor_id"];

                    new_instructor.push(new_i);
                  });

                  new_ti.instructor = new_instructor;

                  new_time_intervals.push(new_ti);
                });

                new_section.timeIntervals = new_time_intervals;

                new_sections.push(new_section);
              });

              new_course.sections = new_sections;

              new_courses.push(new_course);
            });

            response.json(new_courses);

            // response.json(
            //   courses.map(course => {
            //     let new_course = Object.assign({}, course);
            //     delete new_course[new_course];
            //     return new_course;
            //   })
            // );
          });
      } else {
        printSearchType("Number", rest);
        // MATH 1550
      }
    } else if (teachers.includes(array[0])) {
      printSearchType("Teacher", array[0]);
    } else {
      printSearchType("Course", text);
      // Graph Theory
    }
  }

  // MATH 1550
  // MATH Course Name
  // Teacher Name
  // Course Name
  // Number

  // Course.where("number", request.query.input || "1252") //.collection()
  //   .fetch(fetch_object)
  //   .then(courses => {
  //     response.json(courses);
  //   });
  // TimeInterval
  //   .collection()
  //   .fetch({
  //     withRelated: [
  //       "section",
  //       { "instructor" : qb => qb.column("name") },
  //     ],
  //   })
  //   .then(intervals => response.json({ intervals }))
});

const printSearchType = (type, text) => {
  console.log(`\t` + chalk.magenta(type) + ` search: ${text}`);
};
