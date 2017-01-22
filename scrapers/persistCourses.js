const Course = require("../models/course")
const Section = require("../models/section")

const persist = departments => {

  departments.forEach(sections => {

    let courseBuffer = []
    let currentCourseID
    let courseCreatePromises = []

    sections.forEach(section => {

      const {
        course: { abbreviation, number, hours, special, comments },
        section: {
          enrollment: { available, current, total, isFull }, intervals,
        },
      } = section

      if (!courseBuffer.includes(number)) {

        courseCreatePromises.push(new Promise(
          (resolve, reject) => {
            resolve(Course.create({ abbreviation, number, hours }))
          }
        ))

        courseBuffer.push(number)
      }

      // console.log(`Creating section for ${intervals[0].title}`)

      // Section.create({ number, title: intervals[0].title, course_id: currentCourseID })

    })

    Promise
      .all(courseCreatePromises)
      .then(data => data.map(object => object.attributes))
      .then(courses => {

        let createSectionPromises = []

        sections.forEach(section => {

          const { id } = courses.find(
            course =>
              course.abbreviation === section.course.abbreviation &&
              course.number === section.course.number
          )

          createSectionPromises.push(new Promise(
            (resolve, reject) => {
              console.log("Creating section for " + id)

              console.log(JSON.stringify(section, null, 2))

              resolve(Section.create({
                number: section.course.number,
                title: section.section.intervals[0].title,
                course_id: id,
              }))

            }
          ))

        })

        return createSectionPromises
      })
      .then(sectionPromises =>
        Promise.all(sectionPromises)
      ).catch(err => {
        console.error(err)
      })

  })

}

module.exports = persist
