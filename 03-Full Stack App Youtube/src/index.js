import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({ path: "./env" });

const Port = process.env.PORT || 8000;

// connect mongoDB and start express server
connectDB()
  .then(() => {
    app.on("error", (error) => console.log("Express error:", error));
    app.listen(Port, () => console.log(`Server is listing on port ${Port}`));
  })
  .catch((error) => console.log("MongoDB connection failed:", error));
