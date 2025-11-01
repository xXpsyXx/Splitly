import express from "express";
import Group from "../models/group.model.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(authenticate);

// Get all groups for user
router.get("/", async (req, res) => {
  try {
    const groups = await Group.find({
      "members.user": req.user._id,
    })
      .populate("createdBy", "name email")
      .populate("members.user", "name email avatar")
      .sort({ updatedAt: -1 });

    res.json({ groups });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single group
router.get("/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("members.user", "name email avatar");

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is a member
    const isMember = group.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    res.json({ group });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create group
router.post("/", async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Group name is required" });
    }

    const members = [
      { user: req.user._id, role: "admin" },
      ...(memberIds || []).map((id) => ({ user: id, role: "member" })),
    ];

    const group = new Group({
      name,
      description: description || "",
      createdBy: req.user._id,
      members,
    });

    await group.save();
    await group.populate("members.user", "name email avatar");

    res.status(201).json({ group });
  } catch (error) {
    console.error("Group creation error:", error);
    console.error("User data:", req.user);
    res.status(500).json({ error: error.message });
  }
});

// Add member to group
router.post("/:id/members", async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is admin
    const isAdmin = group.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.role === "admin"
    );

    if (!isAdmin) {
      return res.status(403).json({ error: "Only admins can add members" });
    }

    // Check if user is already a member
    const isMember = group.members.some((m) => m.user.toString() === userId);

    if (isMember) {
      return res.status(400).json({ error: "User is already a member" });
    }

    group.members.push({ user: userId, role: "member" });
    await group.save();
    await group.populate("members.user", "name email avatar");

    res.json({ group });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove member from group
router.delete("/:id/members/:userId", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is admin
    const isAdmin = group.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.role === "admin"
    );

    if (!isAdmin) {
      return res.status(403).json({ error: "Only admins can remove members" });
    }

    group.members = group.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );

    await group.save();

    res.json({ message: "Member removed", group });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
