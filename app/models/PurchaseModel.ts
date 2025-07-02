import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    purchasedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const PurchaseModel =
  mongoose.models.Purchase || mongoose.model("Purchase", PurchaseSchema);

export default PurchaseModel;
