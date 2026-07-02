const appDbName = process.env.MONGO_INITDB_DATABASE ?? "camagru";
const appUser = process.env.MONGO_APP_USER ?? "camagru_app";
const appPassword = process.env.MONGO_APP_PASSWORD ?? "camagru_app_password";

db = db.getSiblingDB(appDbName);

db.createUser({
  user: appUser,
  pwd: appPassword,
  roles: [
    {
      role: "readWrite",
      db: appDbName,
    },
  ],
});

db.createCollection("healthcheck");
