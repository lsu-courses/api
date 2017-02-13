const Course = require("../models/course")
const Section = require("../models/section")
const TimeInterval = require("../models/time-interval")
const Instructor = require("../models/instructor")
const InstructorsIntervals = require("../models/instructors-intervals")
const pretty = require("../utils/pretty")

const persist = departments => {

  departments.forEach(sections => {

    let courseBuffer = []
    let courseCreatePromises = []

    sections.forEach(section => {

      const {
        course: {
          abbreviation,
          number,
          hours,
          comments,
          special,
        },
      } = section

      if (!courseBuffer.includes(number)) {

        courseCreatePromises.push(new Promise(
          (resolve, reject) => {
            resolve(
              Course.create({
                abbreviation,
                number,
                hours,
                comments: comments,
              })
            )
          }
        ))

        courseBuffer.push(number)
      }

    })

    Promise

      // 1. Create all courses for this department
      .all(courseCreatePromises)

      // 2. Map to attributes. Creating courses returns an array of their final
      // models. The models contaian a attributes object that contains their "ID"
      // in the database. We map the array such that it is now an array of those
      // attribute objects.
      .then(data => data.map(object => object.attributes))

      // 3. Create promises that create sections. Each course can have one or more
      // sections. In the database, sections have the course ID of their parent.
      // To find which parent ID goes with the section currently being processed,
      // we search the array of course attributes to find the course attribute
      // object that has the same abbreviation and number. We then use this course
      // attribute object's ID when creating the child section.
      .then(courses => {

        let createSectionPromises = []

        sections.forEach(section => {

          const {
            available,
            current,
            is_full,
            total,
          } = section.section.enrollment

          // 3.1 Search for matching course, extract its ID
          const { id } = courses.find(
            course =>
              course.abbreviation === section.course.abbreviation &&
              course.number === section.course.number
          )

          // 3.2 Create promies that create sections with the matching ID
          createSectionPromises.push(new Promise(
            (resolve, reject) => {

              Section
                .create({
                  course_id: id,
                  number: section.course.number,
                  title: section.section.intervals[0].title,
                  enrollment_available: available,
                  enrollment_current: current,
                  enrollment_is_full: is_full,
                  enrollment_total: total,
                })

                // 3.2.1 The create method returns an object that contains the newly
                // created section's ID in the database. We then attach this database
                // ID to the full section object (which contains things like an array
                // of time intervals) and then we resolve this section creation promise
                // with the full section object, which now has the section database ID.
                // We will later use this ID to make relations to time intervals in the DB.
                .then(object => {
                  section.section_id = object.attributes.id
                  resolve(section)
                })

            }
          ))

        })

        // 3.3 Return the array of promises
        return createSectionPromises
      })

      // 4. Create all sections
      .then(sectionPromises => Promise.all(sectionPromises))

      .then(sections => {

        let createTimeIntervalPromises = []

        sections.forEach(section => {

          const { section_id, section: { intervals } } = section

          console.log(`Processing intervals found in ${section_id}`)
          console.log(`There are ${intervals.length} intervals`)

          intervals.forEach(interval => {

            createTimeIntervalPromises.push(new Promise(
              (resolve, reject) => {

                console.log("inside interval promise\n\n")

                // "Special" information on a time interval
                // are things that are determined and help
                // provide context.

                TimeInterval
                  .create({
                    start: interval.time.start,
                    end: interval.time.end,
                    has_time: interval.time.hasTime,
                    special_is_night: interval.time.isNight,
                    location_building: interval.location.building,
                    location_room: interval.location.room,
                    days: interval.time.days,
                    section_id: section_id,
                  })
                  .then(object => {
                    interval.interval_id = object.id
                    console.log("\ninterval being resolved")
                    console.log(interval)
                    resolve(interval)
                  })

              }
            ))

          })

        })

        return createTimeIntervalPromises
      })
      .then(intervalPromises => Promise.all(intervalPromises))
      .then(intervals => {

        // create map of teacher to id
        // save all disctinct teachers to the database
        // and then return a map of their name to their ID
        // in the saved database. Then feed that map into the next
        // thing (creation of instructor courses where that can read
        // the map)

        console.log("\n\nFINAL INTERVALS AFTER CREATION")
        console.log(JSON.stringify(intervals, null, 2))

        let teachers =
          intervals
            .map(interval => interval.teachers)
            .reduce((p, c) => [ ...p, ...c ])

        let unique_teachers = []

        teachers.forEach(t => {
          if (!unique_teachers.includes(t)) unique_teachers.push(t)
        })

        let createTeacherPromises = []

        unique_teachers.forEach(teacher => {
          createTeacherPromises.push(new Promise(
            (resolve, reject) => {
              Instructor
                .create({ name: teacher })
                .then(object =>  resolve({ name: teacher, id: object.id }))
            }
          ))
        })

        // This comment can be refactored out later. It was just me typing
        // thoughts as fast as possible after I had this idea.

        // Assign the promise.all to a variable, pass that into all the
        // merge-table creation promises, then the merge table creation promises
        // use then on this variable and only perform an action once this has
        // compelted. This lets every merge table creation promise have access
        // to the values. This works because of closures.
        let uniqueTeacherIds = Promise.all(createTeacherPromises)

        let createTeacherIntervalPromises = []

        intervals.forEach(interval => {
          createTeacherIntervalPromises.push(new Promise(
            (resolve, reject) => {
              uniqueTeacherIds
                .then(teachers => {

                  let matched_teachers =
                    interval.teachers
                      .map(name => teachers.find(i => i.name === name))

                  console.log("\n\nTEACHERS")
                  console.log(interval.teachers)

                  console.log("\nMATCHED TEACHERS:")
                  console.log(matched_teachers)

                  // create an entry in the interval-intrsuctor merge
                  // table here for every interval and for every teacher.
                  // A single entry is created for each sub teacher for each
                  // interval. These may not have to be created in promises
                  // since we are never really going to use their return value.

                  matched_teachers.forEach(teacher => {
                    // What exactly is the model for a merge table?
                    // And how exactly does a merge table even work?
                    // I think I've got to watch some SQL videos
                    // Tomorrow. It is 4:15 AM

                    InstructorsIntervals
                      .create({
                        instructor_id: teacher.id,
                        interval_id: interval.interval_id,
                      })
                  })

                })
            }
          ))
        })

        console.log(unique_teachers)

        return createTeacherIntervalPromises
      })
      .then(promises => Promise.all(promises))
      .then(teachers => console.log(teachers))
      .catch(err => {
        console.error(err)
      })

  })

}

module.exports = persist
