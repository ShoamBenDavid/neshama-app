const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    // Log connection attempt (without showing password)
    const uriForLog = config.MONGODB_URI.replace(/:[^:@]+@/, ':****@');
    console.log(`Connecting to MongoDB: ${uriForLog}`);
    
    // Connect with explicit database name 'neshama'
    // The dbName option will override any database name in the connection string
    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      dbName: 'neshama', // Explicitly use 'neshama' database
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.error(`\n💡 Troubleshooting tips:`);
    console.error(`   1. Verify your MongoDB Atlas username and password`);
    console.error(`   2. Check if your IP address is whitelisted in MongoDB Atlas`);
    console.error(`   3. Ensure the database user has proper permissions`);
    console.error(`   4. Verify the connection string in your .env file\n`);
    
    // Don't exit in development - allow server to run for testing API endpoints
    // In production, you might want to exit: process.exit(1);
    console.warn(`⚠️  Server will continue running, but database operations will fail.`);
  }
};

module.exports = connectDB;

