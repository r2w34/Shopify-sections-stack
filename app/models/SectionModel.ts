import mongoose, { type InferSchemaType } from "mongoose"

const SectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    identifier: { type: String, required: true, unique: true },
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
    tags: [{ type: String }], // Array of tags for filtering
    thumbnailUrl: { type: String },
    imageGallery: [{ type: String }], // Array of image URLs
    price: { type: Number, default: 0 },
    filePath: { type: String, required: true },
    isFree: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    downloadCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    demoUrl: { type: String }, // URL to demo store
  },
  { timestamps: true },
)

type BaseSection = InferSchemaType<typeof SectionSchema>
export type Section = BaseSection & { _id: string }

const SectionModel = mongoose.models.Section || mongoose.model("Section", SectionSchema)

export default SectionModel
