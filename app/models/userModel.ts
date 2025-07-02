import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    shop: { type: String, required: true, unique: true },
    accessToken: String,
    installedAt: Date,
  },
  { timestamps: true }
);

const UserModel =
  mongoose.models.User || mongoose.model("User", UserSchema);

export default UserModel;
