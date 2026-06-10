import express from "express";
import checkAuth from "../middleware/authMiddleware.js";
import UserModel from "../models/UserModel.js";
import { verifyOTP } from "./OTPController.js";
import LocaltransferModel from "../models/LocaltransferModel.js";
import { requireKYC } from "./KYCController.js";
import resend from "../lib/resend.js";
const TransferRouter = express.Router();

// GET /api/transfer/user-data
TransferRouter.get("/user-data", checkAuth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id).select(
      "name lastname balance transactionLimit transactionMinimum isAllowedToTransact accountStatus",
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    res.json({
      success: true,
      name: `${user.name} ${user.lastname}`,
      balance: user.balance,
      transactionLimit: user.transactionLimit || 500000,
      transactionMinimum: user.transactionMinimum || 4000,
      isAllowedToTransact: user.isAllowedToTransact,
      accountStatus: user.accountStatus || "active",
    });
  } catch (err) {
    console.error("[transfer/user-data]", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// POST /api/transfer/local
TransferRouter.post("/local", checkAuth, requireKYC, async (req, res) => {
  try {
    const {
      amount,
      accountname,
      accountnumber,
      bankname,
      Accounttype,
      routing_number,
      swift_code,
      Description,
      pin,
      otp_code,
      receiver_email,
    } = req.body;

    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Invalid transfer amount." });
    if (!accountname || !accountnumber || !bankname)
      return res
        .status(400)
        .json({ success: false, message: "Recipient details are required." });
    if (!pin)
      return res
        .status(400)
        .json({ success: false, message: "Transaction PIN is required." });
    if (!otp_code)
      return res
        .status(400)
        .json({ success: false, message: "OTP code is required." });

    const user = await UserModel.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    if (user.accountStatus === "suspended" || user.accountStatus === "closed") {
      return res.status(403).json({
        message: `Your account has been ${user.accountStatus}. ${
          user.suspensionReason
            ? `Reason: ${user.suspensionReason}`
            : "Please contact support."
        }`,
      });
    }

    if (!user.isAllowedToTransfer) {
      return res.status(403).json({
        message: user.blockedTransferReason
          ? user.blockedTransferReason
          : "Transfers are currently disabled on your account. Please contact support.",
      });
    }

    const pinMatch = String(pin) === String(user.pin);
    if (!pinMatch)
      return res
        .status(401)
        .json({ success: false, message: "Incorrect transaction PIN." });

    const otpResult = verifyOTP(req.user._id, otp_code, "local_transfer");
    if (!otpResult.valid)
      return res
        .status(401)
        .json({ success: false, message: otpResult.reason });

    const minTransfer = user.transactionMinimum || 4000;
    const maxTransfer = user.transactionLimit || 500000;

    if (parsedAmount < minTransfer)
      return res.status(400).json({
        success: false,
        message: `Minimum transfer amount is $${minTransfer.toLocaleString()}.`,
      });
    if (parsedAmount > maxTransfer)
      return res.status(400).json({
        success: false,
        message: `Maximum transfer amount is $${maxTransfer.toLocaleString()}.`,
      });
    if (user.balance < parsedAmount)
      return res
        .status(400)
        .json({ success: false, message: "Insufficient account balance." });

    // ── Deduct balance immediately and mark as completed ──
    const balanceBefore = user.balance; // snapshot FIRST
    user.balance -= parsedAmount;
    await user.save();

    // ── NO balance deduction here — stays pending until admin approves ──
    const reference = `LT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const transfer = new LocaltransferModel({
      user: user._id,
      amount: parsedAmount,
      accountname,
      accountnumber,
      bankname,
      accounttype: Accounttype || "Online Banking",
      routing_number: routing_number || "",
      swift_code: swift_code || "",
      description: Description || "",
      receiver_email: receiver_email || "",
      balanceBefore: balanceBefore, // snapshot for admin reference
      balanceAfter: user.balance, // same — no deduction yet
      status: "successful",
      reference,
    });
    await transfer.save();

    // ── Confirmation email ──
    // ── Confirmation email ──
    try {
      const senderDetails = [
        ["Reference Number", reference],
        ["Sender Name", user.name],
        ["Beneficiary Name", accountname],
        ["Beneficiary Account", accountnumber],
        ["Bank Name", bankname],
        ["Account Type", Accounttype || "Online Banking"],
        ...(routing_number ? [["Routing Number", routing_number]] : []),
        ...(swift_code ? [["SWIFT Code", swift_code]] : []),
        [
          "Amount",
          "$" +
            parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }),
        ],
        ["Description", Description || "—"],
        [
          "Transaction Date",
          new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        ],
        ["Status", "Successful"],
      ];

      const receiverDetails = [
        ["Reference Number", reference],
        ["Sender Name", user.name],
        ["Sender Email", user.email],
        ["Beneficiary Name", accountname],
        ["Beneficiary Account", accountnumber],
        [
          "Amount Received",
          "$" +
            parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }),
        ],
        ["Description", Description || "—"],
        [
          "Transaction Date",
          new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        ],
        ["Status", "Successful"],
      ];

      const buildEmailHtml = (heading, subheading, greeting, details) => `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
      <tr><td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9,#0369a1);padding:36px 24px;text-align:center;">
              <div style="background:rgba(0,0,0,0.25);display:inline-block;padding:10px 28px;border-radius:10px;margin-bottom:16px;">
                <span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:1px;">Wealth Access</span>
              </div>
              <div style="font-size:40px;margin-bottom:8px;">🏦</div>
              <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;">${heading}</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">${subheading}</p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:32px 28px;">
              <p style="margin:0 0 20px;font-size:16px;color:#0f172a;">${greeting} 👋</p>
              <div style="background:#f0f9ff;border:2px solid #bae6fd;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-size:12px;color:#0369a1;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Transfer Amount</p>
                <p style="margin:0;font-size:32px;font-weight:900;color:#0ea5e9;">
                  $${parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <p style="margin:0 0 12px;font-size:13px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.06em;">Transfer Details</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
                ${details
                  .map(
                    ([label, value], i) => `
                  <tr style="background:${i % 2 === 0 ? "#f8fafc" : "#ffffff"};">
                    <td style="padding:11px 16px;font-size:13px;color:#64748b;font-weight:600;width:45%;border-bottom:1px solid #f1f5f9;">${label}</td>
                    <td style="padding:11px 16px;font-size:13px;color:#0f172a;font-weight:700;border-bottom:1px solid #f1f5f9;">${value}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </table>
              <p style="margin:0;font-size:14px;color:#64748b;">If you have any questions, please contact support immediately.</p>
              <p style="margin:16px 0 0;font-size:14px;color:#0f172a;font-weight:700;">Cheers,<br>The Wealth Access Team</p>
            </td>
          </tr>
          <tr>
            <td style="background:#0f172a;padding:20px 24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.5);">© Wealth Access – A fresh approach to banking!</p>
              <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,0.3);">This is an automated message, please do not reply.</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`;

      // ── Send to sender ──
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "info@wealth-access-intl.pro",
        to: user.email,
        subject: `Local Transfer Submitted – Wealth Access`,
        html: buildEmailHtml(
          "Transfer Submitted",
          "Your local transfer has been received",
          `Hello, <strong>${user.name}</strong>`,
          senderDetails,
        ),
      });

      // ── Send to receiver if email provided ──
      if (receiver_email && receiver_email.trim()) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "info@wealth-access-intl.pro",
          to: receiver_email.trim(),
          subject: `You Have Received a Transfer – Wealth Access`,
          html: buildEmailHtml(
            "You've Received Money 💸",
            "A transfer has been sent to your account",
            `Hello, <strong>${accountname}</strong>`,
            receiverDetails,
          ),
        });
      }
    } catch (emailErr) {
      console.error("[LocalTransfer] Email error:", emailErr.message);
    }

    res.json({
      success: true,
      message: "Transfer completed successfully.",
      reference: transfer.reference,
    });
  } catch (err) {
    console.error("[transfer/local]", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export default TransferRouter;
