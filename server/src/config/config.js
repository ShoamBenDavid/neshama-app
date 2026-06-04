// Configuration for the Neshama server
// In production, use environment variables instead of hardcoded values

module.exports = {
  // MongoDB Atlas connection string
  MONGODB_URI:process.env.MONGODB_URI,
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE,
  
  // Server port
  PORT: process.env.PORT || 5000,

  // OpenAI API key
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ,

  // Python ML classification service URL
  ML_SERVICE_URL: process.env.ML_SERVICE_URL,
};
