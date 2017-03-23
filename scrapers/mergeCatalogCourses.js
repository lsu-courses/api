const merge = object => {
  console.log("in merge");
  //console.log(sections)
  //console.log(sections)

  console.log(object);

  console.log("AFTER OBJECT");

  let sections = object.sections;
  let departments = object[0].departments;

  let newDepartments = [];

  const courses = [];

  object.forEach(obj => {
    obj.sections.forEach(course => {
      console.log(course);
      courses.push(course);
    });
  });

  // console.log(departments)

  // console.log("BEE")
  // console.log(JSON.stringify(courses.find(c => c.abbr === "CHE"), null, 2))

  departments.forEach(dept => {
    let newDept = [];

    if (dept === undefined) return;

    dept.forEach(course => {
      // console.log("\n\n")
      // console.log(JSON.stringify(course, null, 2))

      let newCourse = Object.assign({}, course);
      const { abbreviation, number } = course.course;

      //console.log(course.course)

      let foundSection = courses.find(
        sec => abbreviation === sec.abbr && number === sec.number
      );

      //if (!foundSection) return

      if (foundSection === undefined) {
        newDept.push(newCourse);
        return;
      }

      newCourse.course.full_title = foundSection.name;
      newCourse.course.description = foundSection.parts.join(" ");

      newDept.push(newCourse);
    });

    newDepartments.push(newDept);
  });

  console.log("RETURNING NEW DEPARTMENTS");
  console.log(newDepartments.length);

  console.log(JSON.stringify(newDepartments, null, 2));
  return newDepartments;
};

module.exports = merge;
