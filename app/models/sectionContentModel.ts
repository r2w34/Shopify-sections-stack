import mongoose from "mongoose";

const sectionContentSchema = new mongoose.Schema(
  {
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const SectionContentModel = mongoose.model("SectionContent", sectionContentSchema);

export default SectionContentModel; 