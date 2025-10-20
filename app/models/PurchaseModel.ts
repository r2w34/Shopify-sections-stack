import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    chargeId: { type: String, required: true },
    status: { type: String, default: "pending" },
    purchasedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const PurchaseModel =
  mongoose.models.Purchase || mongoose.model("Purchase", PurchaseSchema);

export default PurchaseModel;
