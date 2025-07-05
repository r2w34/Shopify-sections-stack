// app/models/userModel.ts
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  shop: {
    type: String,
    required: true,
    unique: true
  },
  accessToken: {
    type: String,
    required: true
  },
  scope: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

export default UserModel;