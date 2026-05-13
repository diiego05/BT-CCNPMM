import db from "./src/models/index.js";

const seed = async () => {
  try {
    await db.Role.bulkCreate([
      { role_name: "ADMIN" },
      { role_name: "USER" }
    ], { ignoreDuplicates: true });
    console.log("Roles seeded.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
