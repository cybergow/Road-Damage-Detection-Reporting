const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

/**
 * Connect to MongoDB with retry logic.
 * Retries up to MAX_RETRIES times with a delay between attempts.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        // Mongoose 8 uses the new connection string parser and unified topology by default
      });

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      break;
    } catch (error) {
      retries += 1;
      console.error(
        `❌ MongoDB connection attempt ${retries}/${MAX_RETRIES} failed: ${error.message}`
      );

      if (retries >= MAX_RETRIES) {
        console.error('❌ Max retries reached. Exiting process.');
        process.exit(1);
      }

      console.log(`⏳ Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

// ── Connection event logging ────────────────────────────────────────────────────
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to the database');
});

mongoose.connection.on('error', (err) => {
  console.error(`📡 Mongoose connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('📡 Mongoose disconnected from the database');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('📡 Mongoose connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;
