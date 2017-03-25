const merge = object => {
  console.log("\n Merging catalog courses");

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

  departments.forEach(dept => {
    let newDept = [];

    if (dept === undefined) return;

    dept.forEach(course => {
      let newCourse = Object.assign({}, course);
      const { abbreviation, number } = course.course;

      let foundSection = courses.find(
        sec => abbreviation === sec.abbr && number === sec.number
      );

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

  return newDepartments;
};

module.exports = merge;
