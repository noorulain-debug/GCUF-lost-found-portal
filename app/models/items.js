import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  type: { type: String, enum: ["lost", "found" ,"resolved"] },
  location: String,
  date: Date,
  imageUrl: String,
  embedding: {
    type: [Number],
    default: [],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

export default mongoose.models.Item || mongoose.model("Item", ItemSchema);
