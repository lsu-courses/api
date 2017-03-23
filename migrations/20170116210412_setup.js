exports.up = (knex, Promise) => {
  return Promise.all([
    knex.schema.createTable("semesters", table => {
      table.uuid("id").primary();

      table.string("title");
      table.boolean("archived");

      table.timestamps();
    }),

    knex.schema.createTable("courses", table => {
      table.uuid("id").primary();

      table.string("abbreviation");
      table.string("number");
      table.string("hours");

      table.string("full_title");
      table.text("description");

      //table.unique(["abbreviation", "number"])

      table.string("specialEnrollment");
      table.boolean("isComIntensive");
      table.boolean("isWebBased");

      // Create PostgreSQL array field, of text
      table.specificType("comments", "text[]");

      table.uuid("semester_id").references("semesters.id");

      table.timestamps();
    }),

    knex.schema.createTable("instructors", table => {
      table.uuid("id").primary();

      table.string("name");

      table.timestamps();
    }),

    knex.schema.createTable("sections", table => {
      table.uuid("id").primary();

      table.string("number");
      table.string("title");
      table.string("enrollment_available");
      table.string("enrollment_current");
      table.string("enrollment_is_full");
      table.string("enrollment_total");

      table.uuid("course_id").references("courses.id");

      table.timestamps();
    }),

    knex.schema.createTable("instructors_time_intervals", table => {
      table.uuid("id").primary();

      table.uuid("instructor_id").references("instructors.id");
      table.uuid("time_interval_id").references("time_intervals.id");

      table.timestamps();
    }),

    knex.schema.createTable("time_intervals", table => {
      table.uuid("id").primary();

      table.string("start");
      table.string("end");
      table.boolean("has_time");
      table.specificType("days", "text[]");
      table.specificType("comments", "text[]");
      table.string("location_building");
      table.string("location_room");
      table.boolean("is_lab");

      table.uuid("section_id").references("sections.id");

      table.boolean("s_night");
      table.boolean("s_all_web");
      table.boolean("s_most_web");
      table.boolean("s_half_web");
      table.boolean("s_some_web");

      table.boolean("s_req_dept_perm");
      table.boolean("s_req_inst_perm");

      table.boolean("s_majors_only");
      table.boolean("s_cmi");
      table.boolean("s_cmi_written");
      table.boolean("s_cmi_spoken");
      table.boolean("s_cmi_tech");
      table.boolean("s_cmi_visual");

      table.boolean("s_svc");

      table.timestamps();
    })
  ]);
};

exports.down = (knex, Promise) => {
  return Promise.all([
    knex.raw("DROP TABLE semesters CASCADE"),
    knex.raw("DROP TABLE courses CASCADE"),
    knex.raw("DROP TABLE instructors CASCADE"),
    knex.raw("DROP TABLE sections CASCADE"),
    knex.raw("DROP TABLE instructors_time_intervals CASCADE"),
    knex.raw("DROP TABLE time_intervals CASCADE")
  ]);
};
