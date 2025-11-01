import express from "express";
import Transaction from "../models/transaction.model.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(authenticate);

// Get all transactions for user
router.get("/", async (req, res) => {
  try {
    const { groupId, status } = req.query;
    let query = {
      $or: [{ fromUser: req.user._id }, { toUser: req.user._id }],
    };

    if (groupId) {
      query.group = groupId;
    }

    if (status) {
      query.status = status;
    }

    const transactions = await Transaction.find(query)
      .populate("fromUser", "name email avatar")
      .populate("toUser", "name email avatar")
      .populate("group", "name")
      .populate("expense", "description amount")
      .sort({ createdAt: -1 });

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get summary of balances
router.get("/summary", async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [
        { fromUser: req.user._id, status: "pending" },
        { toUser: req.user._id, status: "pending" },
      ],
    })
      .populate("fromUser", "name email avatar")
      .populate("toUser", "name email avatar")
      .populate("group", "name");

    const balances = {};

    transactions.forEach((t) => {
      const otherUserId =
        t.fromUser._id.toString() === req.user._id.toString()
          ? t.toUser._id.toString()
          : t.fromUser._id.toString();
      const otherUserName =
        t.fromUser._id.toString() === req.user._id.toString()
          ? t.toUser.name
          : t.fromUser.name;
      const otherUser =
        t.fromUser._id.toString() === req.user._id.toString()
          ? t.toUser
          : t.fromUser;

      if (!balances[otherUserId]) {
        balances[otherUserId] = {
          user: otherUser,
          amount: 0,
        };
      }

      if (t.fromUser._id.toString() === req.user._id.toString()) {
        // User owes money
        balances[otherUserId].amount += t.amount;
      } else {
        // User is owed money
        balances[otherUserId].amount -= t.amount;
      }
    });

    const balancesList = Object.values(balances).map((b) => ({
      user: b.user,
      amount: Math.round(b.amount * 100) / 100,
    }));

    res.json({ balances: balancesList });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Settle transaction
router.put("/:id/settle", async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("fromUser", "name email")
      .populate("toUser", "name email");

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Only the person who owes can settle
    if (transaction.fromUser._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (transaction.status === "settled") {
      return res.status(400).json({ error: "Transaction already settled" });
    }

    transaction.status = "settled";
    transaction.settledAt = new Date();
    await transaction.save();

    res.json({ message: "Transaction settled", transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
