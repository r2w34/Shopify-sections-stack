import mongoose, { type InferSchemaType } from "mongoose";

const SectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    detailedFeatures: [{ type: String }],
    category: {
      type: String,
      required: true,
      enum: [
        "hero",
        "testimonial",
        "video",
        "text",
        "images",
        "snippet",
        "countdown",
        "scrolling",
        "featured",
        "other",
      ],
    },
    tags: [{ type: String }],
    thumbnailUrl: { type: String },
    imageGallery: [{ type: String }],
    price: { type: Number, default: 0 },
    isFree: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

type BaseSection = InferSchemaType<typeof SectionSchema>;
export type Section = BaseSection & { _id: string };

const SectionModel =
  mongoose.models.Section || mongoose.model("Section", SectionSchema);

export default SectionModel;
