console.log("DB_URL: " + process.env.DATABASE_URL);

module.exports = {
  client: "pg",
  connection: process.env.HEROKU_POSTGRESQL_COPPER_URL || {
    host: process.env.PG_HOST || "",
    user: process.env.PG_USER || "",
    password: process.env.PG_PASSWORD || "",
    database: process.env.PG_DB || "lsucourses",
    charset: "utf8"
  }
};
