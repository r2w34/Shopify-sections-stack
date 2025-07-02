// models/SessionModel.ts
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    id: String,
    shop: String,
    state: String,
    isOnline: Boolean,
    scope: String,
    expires: Date,
    accessToken: String,
  },
  { timestamps: true }
);

const SessionModel = mongoose.models.Session || mongoose.model("Session", sessionSchema);

export default SessionModel;
