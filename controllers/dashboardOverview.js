import express from "express";
import mongoose from "mongoose";

import UserModel from "../models/UserModel.js";
import LocalTransfer from "../models/LocaltransferModel.js";
import InternationalTransfer from "../models/InternationalTransferModel.js";

import checkAuth from "../middleware/authMiddleware.js";

const DashboardOverviewRouter = express.Router();

// -------- Helpers --------
const isDone = (status) => status === "completed" || status === "successful";

const startOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);

const monthsAgo = (n, ref = new Date()) =>
  new Date(ref.getFullYear(), ref.getMonth() - n, 1, 0, 0, 0, 0);

const monthLabel = (d) => d.toLocaleString("en-US", { month: "short" });

const normalizeTransfer = (doc, source) => {
  const isLocal = source === "local";
  return {
    orderId: doc.reference || `TXN_${String(doc._id).slice(-6).toUpperCase()}`,
    activity: isLocal
      ? doc.bankname || "Local Transfer"
      : doc.method || "International Wire",
    method: isLocal ? "local" : doc.method,
    type: isLocal ? doc.type || "debit" : "debit",
    amount: Number(doc.amount || 0),
    status: (doc.status || "pending").toLowerCase(),
    date: doc.createdAt || doc.processedAt || new Date(),
    source,
  };
};

// -------- Route --------
DashboardOverviewRouter.get("/overview", checkAuth, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const uid = new mongoose.Types.ObjectId(userId);

    const [user, localTxs, intlTxs] = await Promise.all([
      UserModel.findById(uid).lean(),
      LocalTransfer.find({ user: uid }).sort({ createdAt: -1 }).lean(),
      InternationalTransfer.find({ userId: uid }).sort({ createdAt: -1 }).lean(),
    ]);

    if (!user) return res.status(404).json({ error: "User not found" });

    // ---- Merge & sort ----
    const all = [
      ...localTxs.map((d) => normalizeTransfer(d, "local")),
      ...intlTxs.map((d) => normalizeTransfer(d, "international")),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // ---- Recent activities ----
    const recentActivities = all.slice(0, 10);

    // ---- This month ----
    const monthStart = startOfMonth();
    const thisMonth = all.filter((t) => new Date(t.date) >= monthStart);

    const monthlyDeposits = thisMonth
      .filter((t) => t.type === "credit" && isDone(t.status))
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = thisMonth
      .filter((t) => t.type === "debit" && isDone(t.status))
      .reduce((sum, t) => sum + t.amount, 0);

    // ---- All-time volume ----
    const totalVolume = all
      .filter((t) => isDone(t.status))
      .reduce((sum, t) => sum + t.amount, 0);

    // ---- Total income & revenue ----
    const totalIncome = all
      .filter((t) => t.type === "credit" && isDone(t.status))
      .reduce((s, t) => s + t.amount, 0);

    const totalRevenue = all
      .filter((t) => isDone(t.status))
      .reduce((s, t) => s + t.amount, 0);

    // ---- Pending ----
    const pending = all.filter(
      (t) => t.status === "pending" || t.status === "processing",
    );
    const pendingTotal = pending.reduce((s, t) => s + t.amount, 0);
    const pendingCount = pending.length;

    // ---- Profit/Loss chart (last 6 months) ----
    const firstTxDate =
      all.length > 0
        ? new Date(Math.min(...all.map((t) => new Date(t.date).getTime())))
        : new Date();

    const sixMonthsAgo = monthsAgo(5);
    const userFirstMonth = startOfMonth(firstTxDate);
    const earliestMonth =
      sixMonthsAgo > userFirstMonth ? sixMonthsAgo : userFirstMonth;

    const profitLoss = [];
    const now = new Date();
    let cursor = new Date(earliestMonth);

    while (cursor <= now) {
      const monthStartDate = startOfMonth(cursor);
      const nextMonth = new Date(
        monthStartDate.getFullYear(),
        monthStartDate.getMonth() + 1,
        1,
      );

      const inMonth = all.filter((t) => {
        const d = new Date(t.date);
        return d >= monthStartDate && d < nextMonth && isDone(t.status);
      });

      const profit = inMonth
        .filter((t) => t.type === "credit")
        .reduce((s, t) => s + t.amount, 0);

      const loss = inMonth
        .filter((t) => t.type === "debit")
        .reduce((s, t) => s + t.amount, 0);

      profitLoss.push({ month: monthLabel(monthStartDate), profit, loss });

      cursor = new Date(
        monthStartDate.getFullYear(),
        monthStartDate.getMonth() + 1,
        1,
      );
    }

    // ---- Balances ----
    const fiatBalance = Number(user.balance || 0);
    const btcBalance = Number(user.crypto_balance || 0);
    const btcRate = 87221;
    const totalPortfolio = fiatBalance + btcBalance * btcRate;

    // ---- Stat changes (current vs previous month) ----
    const prevMonthStart = monthsAgo(1);
    const prevMonthTxs = all.filter((t) => {
      const d = new Date(t.date);
      return d >= prevMonthStart && d < monthStart;
    });

    const prevDeposits = prevMonthTxs
      .filter((t) => t.type === "credit" && isDone(t.status))
      .reduce((s, t) => s + t.amount, 0);

    const prevExpenses = prevMonthTxs
      .filter((t) => t.type === "debit" && isDone(t.status))
      .reduce((s, t) => s + t.amount, 0);

    const pctChange = (current, prev) => {
      if (!prev) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

    // ---- Spending limit ----
    const transactionLimit = Number(user.transactionLimit || 500000);
    const monthlyLimit = Number(user.monthlyLimit || transactionLimit * 0.011);

    // ---- Response ----
    res.json({
      user: {
        id: user._id,
        fullname:
          [user.name, user.middlename, user.lastname]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          user.username ||
          user.email ||
          "User",
        accountNumber: user.accountNumber || "",
        currencySymbol: "$",
      },
      balances: {
        fiat: fiatBalance,
        btc: btcBalance,
        btcRate,
        totalPortfolio,
      },
      stats: {
        transactionLimit,
        monthlyDeposits,
        monthlyExpenses,
        totalVolume,
        pendingTotal,
        pendingCount,
        totalIncome,
        totalRevenue,
      },
      changes: {
        balance: 5,
        earnings: pctChange(monthlyDeposits, prevDeposits),
        spending: pctChange(monthlyExpenses, prevExpenses),
        volume: 4,
      },
      spendingLimit: {
        spent: monthlyExpenses,
        limit: monthlyLimit,
      },
      profitLoss,
      recentActivities,
    });
  } catch (err) {
    console.error("[/api/dashboard/overview]", err);
    res.status(500).json({ error: "Failed to load dashboard overview" });
  }
});

export default DashboardOverviewRouter;