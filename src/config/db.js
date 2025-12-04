import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Support both MONGO_URI and MONGODB_URI for flexibility
    let mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error(
        "MongoDB URI is not defined. Please set MONGODB_URI or MONGO_URI in your .env file"
      );
    }

    // Remove quotes if they exist (dotenv sometimes includes them)
    mongoUri = mongoUri.replace(/^["']|["']$/g, "").trim();

    if (!mongoUri) {
      throw new Error("MongoDB URI is empty after processing");
    }

    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    throw error;
  }
};

export default connectDB;
