// Create DB Utility
// This file can be run from `yarn run db:create` to create the database.
// In the future we can use the `pg` package to create any extensions or
// alter the database in any way during database creation

const pg = require("pg")
const pgtools = require("pgtools")

const config = {
  port: 5432,
  host: "localhost",
}

pgtools.createdb(config, "lsucourses", function(err, res) {
  if (err) {
    console.error(err)
    process.exit(-1)
  }
  console.log("Created Datbase")
})
