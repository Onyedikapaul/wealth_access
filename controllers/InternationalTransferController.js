import express from "express";
import checkAuth from "../middleware/authMiddleware.js";
import UserModel from "../models/UserModel.js";
import InternationalTransferModel from "../models/InternationalTransferModel.js";
import resend from "../lib/resend.js";
import { verifyOTP } from "./OTPController.js";
import { requireKYC } from "./KYCController.js";

const InternationalTransferRouter = express.Router();

InternationalTransferRouter.post(
  "/submit",
  checkAuth,
  requireKYC,
  async (req, res) => {
    try {
      const {
        withdrawMethod,
        amount,
        pin,
        otp_code,
        Description,
        balance_type,
        accountName,
        accountNumber,
        bankName,
        bankaddress,
        Accounttype,
        country,
        iban,
        swiftCode,
        routingNumber,
        cryptoCurrency,
        cryptoNetwork,
        wallet_address,
        paypalEmail,
        wiseFullName,
        wiseEmail,
        wiseCountry,
        skrillEmail,
        skrillFullName,
        venmoUsername,
        venmoPhone,
        zelleEmail,
        zellePhone,
        zelleName,
        cashAppTag,
        cashAppFullName,
        revolutFullName,
        revolutEmail,
        revolutPhone,
        alipayId,
        alipayFullName,
        wechatId,
        wechatName,
        receiver_email,
      } = req.body;

      const isCrypto =
        withdrawMethod === "Cryptocurrency" ||
        String(balance_type || "").toLowerCase() === "btc";

      // ── Validation ──
      if (!withdrawMethod)
        return res.json({
          success: false,
          message: "Transfer method is required.",
        });

      const parsedAmount = parseFloat(amount);
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0)
        return res.json({
          success: false,
          message: "Please enter a valid amount.",
        });

      if (!pin || String(pin).length < 4)
        return res.json({
          success: false,
          message: "Transaction PIN is required.",
        });

      if (!otp_code || String(otp_code).length !== 6)
        return res.json({
          success: false,
          message: "Please enter the 6-digit OTP.",
        });

      // ── Fetch user ──
      const user = await UserModel.findById(req.user._id);
      if (!user)
        return res.json({ success: false, message: "User not found." });

      // ── Account status ──
      if (user.accountStatus === "suspended" || user.accountStatus === "closed")
        return res.json({
          success: false,
          message: `Your account has been ${user.accountStatus}. Please contact support.`,
        });

      if (!user.isAllowedToTransfer)
        return res.json({
          success: false,
          message:
            user.blockedTransferReason ||
            "Transfers are currently disabled on your account. Please contact support.",
        });

      // ── OTP check ──
      const { valid, reason } = verifyOTP(
        req.user._id,
        otp_code,
        "international_transfer",
      );
      if (!valid) return res.json({ success: false, message: reason });

      // ── PIN check ──
      if (!user.pin)
        return res.json({
          success: false,
          message: "No transaction PIN set. Please set one in settings.",
        });
      if (String(pin) !== String(user.pin))
        return res.json({
          success: false,
          message: "Incorrect transaction PIN.",
        });

      // ── Balance check (just validate, no deduction) ──
      if (isCrypto) {
        const btcBalance = Number(user.crypto_balance) || 0;
        if (parsedAmount > btcBalance)
          return res.json({
            success: false,
            message: `Insufficient BTC balance. Available: ${btcBalance.toFixed(8)} BTC`,
          });
      } else {
        const fiatBalance = Number(user.balance) || 0;
        if (parsedAmount > fiatBalance)
          return res.json({
            success: false,
            message: `Insufficient balance. Available: $${fiatBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
          });
      }

      // ── Build method-specific details ──
      const transferDetails = { method: withdrawMethod };
      switch (withdrawMethod) {
        case "Wire Transfer":
          Object.assign(transferDetails, {
            accountName,
            accountNumber,
            bankName,
            bankAddress: bankaddress,
            accountType: Accounttype,
            country,
            iban,
            swiftCode,
            routingNumber,
          });
          break;
        case "Cryptocurrency":
          Object.assign(transferDetails, {
            cryptoCurrency,
            cryptoNetwork,
            walletAddress: wallet_address,
          });
          break;
        case "PayPal":
          Object.assign(transferDetails, { paypalEmail });
          break;
        case "Wise Transfer":
          Object.assign(transferDetails, {
            fullName: wiseFullName,
            email: wiseEmail,
            country: wiseCountry,
          });
          break;
        case "Skrill":
          Object.assign(transferDetails, {
            email: skrillEmail,
            fullName: skrillFullName,
          });
          break;
        case "Venmo":
          Object.assign(transferDetails, {
            username: venmoUsername,
            phone: venmoPhone,
          });
          break;
        case "Zelle":
          Object.assign(transferDetails, {
            email: zelleEmail,
            phone: zellePhone,
            fullName: zelleName,
          });
          break;
        case "Cash App":
          Object.assign(transferDetails, {
            cashtag: cashAppTag,
            fullName: cashAppFullName,
          });
          break;
        case "Revolut":
          Object.assign(transferDetails, {
            fullName: revolutFullName,
            email: revolutEmail,
            phone: revolutPhone,
          });
          break;
        case "Alipay":
          Object.assign(transferDetails, {
            alipayId,
            fullName: alipayFullName,
          });
          break;
        case "WeChat Pay":
          Object.assign(transferDetails, { wechatId, fullName: wechatName });
          break;
      }

      // ── Deduct balance immediately ──
      if (isCrypto) {
        user.crypto_balance = (Number(user.crypto_balance) || 0) - parsedAmount;
      } else {
        user.balance = (Number(user.balance) || 0) - parsedAmount;
      }
      await user.save();

      const transfer = new InternationalTransferModel({
        userId: user._id,
        type: "debit",
        method: withdrawMethod,
        amount: parsedAmount,
        balanceType: isCrypto ? "btc" : "fiat",
        currency: isCrypto ? "BTC" : "USD",
        details: transferDetails,
        description: Description || "",
        balanceSnapshot: isCrypto
          ? Number(user.crypto_balance) + parsedAmount // snapshot before deduction
          : Number(user.balance) + parsedAmount,
        status: "successful", // ← straight to completed
      });

      await transfer.save();

      // ── Confirmation email ──
      try {
        const amountDisplay = isCrypto
          ? parsedAmount.toFixed(8) + " BTC"
          : "$" +
            parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 });

        const senderDetails = [
          ["Transfer Method", withdrawMethod],
          ["Sender Name", user.name],
          [
            "Beneficiary Name",
            transferDetails.accountName ||
              transferDetails.fullName ||
              transferDetails.paypalEmail ||
              transferDetails.cashtag ||
              transferDetails.wechatId ||
              transferDetails.alipayId ||
              "—",
          ],
          [
            "Beneficiary Account",
            transferDetails.accountNumber ||
              transferDetails.walletAddress ||
              transferDetails.email ||
              transferDetails.phone ||
              transferDetails.username ||
              "—",
          ],
          ["Amount", amountDisplay],
          ["Currency", isCrypto ? "BTC" : "USD"],
          ...(transferDetails.bankName
            ? [["Bank Name", transferDetails.bankName]]
            : []),
          ...(transferDetails.swiftCode
            ? [["SWIFT Code", transferDetails.swiftCode]]
            : []),
          ...(transferDetails.iban ? [["IBAN", transferDetails.iban]] : []),
          ...(transferDetails.country
            ? [["Country", transferDetails.country]]
            : []),
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
          ["Reference", transfer._id.toString()],
          ["Sender Name", user.name],
          ["Sender Email", user.email],
          ["Amount Received", amountDisplay],
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
                <span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:1px;">Crest Wealth</span>
              </div>
              <div style="font-size:40px;margin-bottom:8px;">💸</div>
              <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;">${heading}</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">${subheading}</p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:32px 28px;">
              <p style="margin:0 0 20px;font-size:16px;color:#0f172a;">${greeting} 👋</p>
              <div style="background:#f0f9ff;border:2px solid #bae6fd;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-size:12px;color:#0369a1;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Transfer Amount</p>
                <p style="margin:0;font-size:32px;font-weight:900;color:#0ea5e9;">${amountDisplay}</p>
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
              <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px;padding:14px 16px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
                  <strong>NOTE:</strong> International transfers take up to 2–3 working days to reflect in the beneficiary's account.
                </p>
              </div>
              <p style="margin:0;font-size:14px;color:#64748b;">If you have any questions, please contact support immediately.</p>
              <p style="margin:16px 0 0;font-size:14px;color:#0f172a;font-weight:700;">Cheers,<br>The Crest Wealth Team</p>
            </td>
          </tr>
          <tr>
            <td style="background:#0f172a;padding:20px 24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.5);">© Crest Wealth – A fresh approach to banking!</p>
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
          from: process.env.EMAIL_FROM || "info@crestwealth-plc.com",
          to: user.email,
          subject: `International Transfer Submitted – Crest Wealth`,
          html: buildEmailHtml(
            "Transfer Submitted",
            "Your international transfer has been received",
            `Hello, <strong>${user.name}</strong>`,
            senderDetails,
          ),
        });

        // ── Send to receiver if email provided ──
        if (receiver_email && receiver_email.trim()) {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || "info@crestwealth-plc.com",
            to: receiver_email.trim(),
            subject: `You Have Received an International Transfer – Crest Wealth`,
            html: buildEmailHtml(
              "You've Received Money 💸",
              "An international transfer has been sent to you",
              `Hello, <strong>${transferDetails.accountName || transferDetails.fullName || "there"}</strong>`,
              receiverDetails,
            ),
          });
        }
      } catch (emailErr) {
        console.error("[InternationalTransfer] Email error:", emailErr.message);
      }

      return res.json({
        success: true,
        message: "Transfer completed successfully.",
        transferId: transfer._id.toString(),
      });
    } catch (error) {
      console.error("[InternationalTransfer] Error:", error);
      return res.json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
    }
  },
);

// GET USER INTERNATIONAL TRANSFERS HISTORY
// /api/history/international-transfers
InternationalTransferRouter.get("/", checkAuth, async (req, res) => {
  try {
    const userId = req.user._id; // from auth middleware

    let { page = 1, limit = 10, status } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const filter = {
      userId,
    };

    if (status) {
      filter.status = status;
    }

    const total = await InternationalTransferModel.countDocuments(filter);

    const transfers = await InternationalTransferModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // console.log(transfers);

    res.json({
      success: true,
      transfers,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("International history error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch transfer history",
    });
  }
});

export default InternationalTransferRouter;
