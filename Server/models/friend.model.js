import mongoose from "mongoose";

const friendSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    friend: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure unique friendship pairs
friendSchema.index({ user: 1, friend: 1 }, { unique: true });

export default mongoose.model("Friend", friendSchema);
