import mongoose from "mongoose";

const MONGODB_URI = 'mongodb://127.0.0.1:27017/?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Database connected");
}).catch((error) => {
  console.error("Error connecting to database: ", error.message);
});

