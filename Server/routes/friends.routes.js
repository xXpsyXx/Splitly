import express from "express";
import Friend from "../models/friend.model.js";
import User from "../models/user.model.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(authenticate);

// Get all friends
router.get("/", async (req, res) => {
  try {
    const friends = await Friend.find({
      $or: [
        { user: req.user._id, status: "accepted" },
        { friend: req.user._id, status: "accepted" },
      ],
    })
      .populate("user", "name email avatar")
      .populate("friend", "name email avatar");

    const friendsList = friends.map((f) => ({
      id: f._id,
      user:
        f.user._id.toString() === req.user._id.toString() ? f.friend : f.user,
      status: f.status,
      createdAt: f.createdAt,
    }));

    res.json({ friends: friendsList });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send friend request
router.post("/request", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const friendUser = await User.findOne({ email });
    if (!friendUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (friendUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "Cannot add yourself as a friend" });
    }

    // Check if friendship already exists
    const existing = await Friend.findOne({
      $or: [
        { user: req.user._id, friend: friendUser._id },
        { user: friendUser._id, friend: req.user._id },
      ],
    });

    if (existing) {
      return res.status(400).json({ error: "Friendship already exists" });
    }

    const friendRequest = new Friend({
      user: req.user._id,
      friend: friendUser._id,
      status: "pending",
    });

    await friendRequest.save();

    res.status(201).json({
      message: "Friend request sent",
      friend: {
        id: friendRequest._id,
        user: friendUser,
        status: friendRequest.status,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept friend request
router.put("/accept/:id", async (req, res) => {
  try {
    const friendRequest = await Friend.findById(req.params.id);

    if (!friendRequest) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    if (friendRequest.friend.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    res.json({
      message: "Friend request accepted",
      friend: {
        id: friendRequest._id,
        status: friendRequest.status,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending requests
router.get("/pending", async (req, res) => {
  try {
    const pending = await Friend.find({
      friend: req.user._id,
      status: "pending",
    }).populate("user", "name email avatar");

    res.json({ requests: pending });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
