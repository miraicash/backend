// const { MongoClient } = require("mongodb");
// if (process.env.NODE_ENV !== "production") require("dotenv").config({ path: "../development.env" });
// const client = new MongoClient(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// async function findUserByUsername(username) {
//   try {
//     await client.connect();
//     const db = client.db(process.env.MONGO_DB);
//     const collection = db.collection(process.env.MONGO_USER_COLLECTION);
//     const user = await collection.findOne({ username });
//     console.log("Found user:", user);
//     return user;
//   } catch (err) {
//     console.error(err);
//   } finally {
//     client.close();
//   }
// }

// export default client;
