import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongooseOptions = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      w: "majority",
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected. Reconnecting in 5s...');
      setTimeout(() => mongoose.connect(process.env.MONGO_URI, mongooseOptions), 5000);
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
    });

    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('📚 Available collections:', collections.map(c => c.name));
    } catch (err) {
      console.log('⚠️  Could not list collections');
    }

    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.log('⚠️  Running in offline mode - database operations will fail\n');
    return null;
  }
};

export default connectDB;