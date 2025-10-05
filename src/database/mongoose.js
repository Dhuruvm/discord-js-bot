const mongoose = require("mongoose");
const { log, success, error, warn } = require("../helpers/Logger");

mongoose.set("strictQuery", true);

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;

async function attemptReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    error(`Mongoose: Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`);
    return;
  }

  reconnectAttempts++;
  warn(`Mongoose: Attempting to reconnect... (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

  try {
    await mongoose.connect(process.env.MONGO_CONNECTION, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    success("Mongoose: Reconnection successful");
    reconnectAttempts = 0;
  } catch (err) {
    error(`Mongoose: Reconnection attempt ${reconnectAttempts} failed`, err);
    setTimeout(attemptReconnect, RECONNECT_DELAY * reconnectAttempts);
  }
}

module.exports = {
  async initializeMongoose() {
    log(`Connecting to MongoDb...`);

    try {
      await mongoose.connect(process.env.MONGO_CONNECTION, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
      });

      success("Mongoose: Database connection established");

      mongoose.connection.on("disconnected", () => {
        warn("Mongoose: Database connection lost. Attempting to reconnect...");
        attemptReconnect();
      });

      mongoose.connection.on("reconnected", () => {
        success("Mongoose: Database reconnected successfully");
        reconnectAttempts = 0;
      });

      mongoose.connection.on("error", (err) => {
        error("Mongoose: Database connection error", err);
        if (mongoose.connection.readyState === 0) {
          attemptReconnect();
        }
      });

      return mongoose.connection;
    } catch (err) {
      error("Mongoose: Failed to connect to database", err);
      process.exit(1);
    }
  },

  schemas: {
    Giveaways: require("./schemas/Giveaways"),
    Guild: require("./schemas/Guild"),
    Member: require("./schemas/Member"),
    ReactionRoles: require("./schemas/ReactionRoles").model,
    ModLog: require("./schemas/ModLog").model,
    TranslateLog: require("./schemas/TranslateLog").model,
    User: require("./schemas/User"),
    Suggestions: require("./schemas/Suggestions").model,
  },
};
