const Course = require("../models/course")
const Section = require("../models/section")
const TimeInterval = require("../models/time-interval")
const pretty = require("../utils/pretty")

const persist = departments => {

  departments.forEach(sections => {

    let courseBuffer = []
    let courseCreatePromises = []

    sections.forEach(section => {

      const { course: { abbreviation, number, hours } } = section

      if (!courseBuffer.includes(number)) {

        courseCreatePromises.push(new Promise(
          (resolve, reject) => {
            resolve(Course.create({ abbreviation, number, hours }))
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
                  number: section.course.number,
                  title: section.section.intervals[0].title,
                  course_id: id,
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

                TimeInterval
                  .create({
                    start: interval.time.start,
                    end: interval.time.end,
                    hasTime: interval.time.hasTime,
                    isNight: interval.time.isNight,
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
        console.log("\n\nFINAL INTERVALS AFTER CREATION")
        console.log(JSON.stringify(intervals, null, 2))
      })
      .catch(err => {
        console.error(err)
      })

  })

}

module.exports = persist
