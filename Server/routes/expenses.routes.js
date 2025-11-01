import express from "express";
import Expense from "../models/expense.model.js";
import Transaction from "../models/transaction.model.js";
import Group from "../models/group.model.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(authenticate);

// Get all expenses (for user's groups or individual)
router.get("/", async (req, res) => {
  try {
    const { groupId } = req.query;
    let query = {};

    if (groupId) {
      query.group = groupId;
    } else {
      // Get user's groups
      const groups = await Group.find({ "members.user": req.user._id });
      const groupIds = groups.map((g) => g._id);
      query = {
        $or: [{ group: { $in: groupIds } }, { paidBy: req.user._id }],
      };
    }

    const expenses = await Expense.find(query)
      .populate("paidBy", "name email avatar")
      .populate("group", "name")
      .populate("splits.user", "name email avatar")
      .sort({ date: -1 });

    res.json({ expenses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single expense
router.get("/:id", async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate("paidBy", "name email avatar")
      .populate("group", "name")
      .populate("splits.user", "name email avatar");

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ expense });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create expense
router.post("/", async (req, res) => {
  try {
    const { description, amount, groupId, category, splitType, splits } =
      req.body;

    console.log("Received splits:", JSON.stringify(splits, null, 2));

    if (!description || !amount || !splits || splits.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate splits sum equals amount
    const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalSplit - amount) > 0.01) {
      return res
        .status(400)
        .json({ error: "Split amounts must equal expense amount" });
    }

    // If group expense, verify user is member
    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      const isMember = group.members.some(
        (m) => m.user.toString() === req.user._id.toString()
      );
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this group" });
      }
    }

    const expense = new Expense({
      description,
      amount,
      paidBy: req.user._id,
      group: groupId || null,
      category: category || "General",
      splitType: splitType || "equal",
      splits: splits.map((s, index) => {
        console.log(`Processing split ${index}:`, JSON.stringify(s, null, 2));
        // Validate that either user or userId is provided
        if (!s.user && !s.userId) {
          throw new Error(
            `Split at index ${index} is missing both user and userId fields. Received: ${JSON.stringify(
              s
            )}`
          );
        }
        return {
          user: s.user || s.userId, // Accept either user or userId
          amount: s.amount,
          percentage: s.percentage || 0,
          shares: s.shares || 0,
        };
      }),
      date: new Date(req.body.date || Date.now()),
    });

    await expense.save();

    // Create transactions for each split (except for the person who paid)
    const transactions = [];
    for (const split of expense.splits) {
      if (split.user.toString() !== req.user._id.toString()) {
        const transaction = new Transaction({
          fromUser: split.user,
          toUser: req.user._id,
          amount: split.amount,
          group: groupId || null,
          expense: expense._id,
          status: "pending",
        });
        await transaction.save();
        transactions.push(transaction);
      }
    }

    await expense.populate("paidBy", "name email avatar");
    await expense.populate("group", "name");
    await expense.populate("splits.user", "name email avatar");

    res.status(201).json({ expense, transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete expense
router.delete("/:id", async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    if (expense.paidBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Delete associated transactions
    await Transaction.deleteMany({ expense: expense._id });
    await expense.deleteOne();

    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
