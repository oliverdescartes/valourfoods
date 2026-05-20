const { MongoClient } = require("mongodb");

require("dotenv").config();

const client = new MongoClient(process.env.MONGO_URI);

async function connectDB() {
  try {
    await client.connect();

    console.log("MongoDB connected");

    return client.db();
  } catch (err) {
    console.error(err);
  }
}

module.exports = connectDB;
