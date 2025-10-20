import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("Missing MONGODB_URI");

let isConnected = false;

export async function connectToDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log("[Database] Connected to MongoDB successfully");
  } catch (err) {
    console.error("[Database] Failed to connect to MongoDB:", err);
    throw err;
  }
}
