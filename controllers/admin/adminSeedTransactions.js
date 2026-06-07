// /**
//  * routes/adminSeedTransactions.js
//  * -----------------------------------------------------------
//  * POST /api/admin/users/:userId/seed-transactions
//  * Body: { type: "local" | "international", count: 1..20 }
//  *
//  * Generates realistic-looking transactions and pushes them to
//  * the correct collection. Updates user balance based on
//  * credits/debits.
//  *
//  * Mount in your app:
//  *   import AdminSeedRouter from "./routes/adminSeedTransactions.js";
//  *   app.use("/api/admin", AdminSeedRouter);
//  * -----------------------------------------------------------
//  */

// import express from "express";
// import mongoose from "mongoose";
// import LocaltransferModel from "../../models/LocaltransferModel.js";
// import UserModel from "../../models/UserModel.js";
// import InternationalTransferModel from "../../models/InternationalTransferModel.js";

// const AdminSeedRouter = express.Router();

// // ============================================================
// // FAKE DATA POOLS
// // ============================================================

// // US banks for LOCAL transfers
// const US_BANKS = [
//   { name: "Chase Bank",            routing: "021000021", swift: "CHASUS33" },
//   { name: "Bank of America",       routing: "026009593", swift: "BOFAUS3N" },
//   { name: "Wells Fargo",           routing: "121000248", swift: "WFBIUS6S" },
//   { name: "Citibank",              routing: "021000089", swift: "CITIUS33" },
//   { name: "U.S. Bank",             routing: "091000022", swift: "USBKUS44IMT" },
//   { name: "PNC Bank",              routing: "043000096", swift: "PNCCUS33" },
//   { name: "Capital One",           routing: "051405515", swift: "NFBKUS33" },
//   { name: "TD Bank",               routing: "031101266", swift: "NRTHUS33" },
//   { name: "HSBC USA",              routing: "021001088", swift: "MRMDUS33" },
//   { name: "Goldman Sachs",         routing: "124085244", swift: "GSCMUS33" },
//   { name: "Charles Schwab Bank",   routing: "121202211", swift: "CSCHUS6S" },
//   { name: "Ally Bank",             routing: "124003116", swift: "ALLYUS31" },
// ];

// // US-style first/last names for LOCAL recipients
// const US_FIRST_NAMES = [
//   "Michael", "Jennifer", "Robert", "Linda", "David", "Patricia",
//   "James", "Mary", "John", "Susan", "Christopher", "Karen",
//   "Daniel", "Sarah", "Matthew", "Emily", "Andrew", "Jessica",
//   "Joseph", "Megan", "Ryan", "Amanda", "Brian", "Rachel",
//   "Kevin", "Laura", "Steven", "Nicole", "Eric", "Stephanie",
// ];

// const US_LAST_NAMES = [
//   "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia",
//   "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez",
//   "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson",
//   "Martin", "Lee", "Perez", "Thompson", "White", "Harris",
//   "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
// ];

// // INTERNATIONAL: mix of countries with culturally appropriate names
// const INTERNATIONAL_RECIPIENTS = [
//   // USA
//   { name: "Michael Anderson",  country: "USA" },
//   { name: "Jennifer Williams", country: "USA" },
//   { name: "Robert Johnson",    country: "USA" },
//   { name: "Sarah Mitchell",    country: "USA" },
//   // China
//   { name: "Wei Chen",          country: "China" },
//   { name: "Li Wang",           country: "China" },
//   { name: "Xiu Zhang",         country: "China" },
//   { name: "Hao Liu",           country: "China" },
//   { name: "Mei Lin",           country: "China" },
//   // Philippines
//   { name: "Juan Dela Cruz",    country: "Philippines" },
//   { name: "Maria Santos",      country: "Philippines" },
//   { name: "Jose Reyes",        country: "Philippines" },
//   { name: "Ana Garcia",        country: "Philippines" },
//   // UK
//   { name: "James Bennett",     country: "UK" },
//   { name: "Emma Thompson",     country: "UK" },
//   { name: "Oliver Hughes",     country: "UK" },
//   // Germany
//   { name: "Hans Müller",       country: "Germany" },
//   { name: "Anna Schmidt",      country: "Germany" },
//   { name: "Klaus Weber",       country: "Germany" },
//   // Japan
//   { name: "Hiroshi Tanaka",    country: "Japan" },
//   { name: "Yuki Sato",         country: "Japan" },
//   { name: "Kenji Watanabe",    country: "Japan" },
//   // Brazil
//   { name: "Lucas Silva",       country: "Brazil" },
//   { name: "Camila Oliveira",   country: "Brazil" },
//   // India
//   { name: "Raj Patel",         country: "India" },
//   { name: "Priya Sharma",      country: "India" },
//   { name: "Arjun Kumar",       country: "India" },
//   // France
//   { name: "Pierre Dubois",     country: "France" },
//   { name: "Sophie Martin",     country: "France" },
//   // South Korea
//   { name: "Min-jun Kim",       country: "South Korea" },
//   { name: "Ji-woo Park",       country: "South Korea" },
//   // Australia
//   { name: "Jack Wilson",       country: "Australia" },
//   { name: "Charlotte Brown",   country: "Australia" },
//   // Canada
//   { name: "Ethan MacKenzie",   country: "Canada" },
//   { name: "Sophia Tremblay",   country: "Canada" },
//   // Mexico
//   { name: "Carlos Hernandez",  country: "Mexico" },
//   { name: "Isabella Lopez",    country: "Mexico" },
// ];

// // International methods
// const INTL_METHODS = [
//   "Wire Transfer",
//   "PayPal",
//   "Wise Transfer",
//   "Skrill",
//   "Zelle",
//   "Cash App",
//   "Revolut",
//   "Alipay",
//   "WeChat Pay",
// ];

// // Descriptions
// const LOCAL_DESCRIPTIONS = [
//   "Salary payment",
//   "Rent payment",
//   "Invoice settlement",
//   "Consulting fee",
//   "Contract payment",
//   "Service charge",
//   "Refund processed",
//   "Bonus payment",
//   "Reimbursement",
//   "Project payment",
//   "Subscription fee",
//   "Loan disbursement",
// ];

// const INTL_DESCRIPTIONS = [
//   "International business payment",
//   "Cross-border invoice",
//   "Overseas contract settlement",
//   "Foreign supplier payment",
//   "International remittance",
//   "Global consulting fee",
//   "Overseas service charge",
//   "Import payment",
//   "Export proceeds",
//   "Cross-border refund",
// ];

// // ============================================================
// // HELPERS
// // ============================================================

// const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
// const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// const randomAmount = () => {
//   // $20,000 - $900,000 — biased toward round-ish numbers
//   const base = randInt(20000, 900000);
//   return Math.round(base / 100) * 100; // round to nearest 100
// };

// const randomDateBetween = (startYear = 2021, endYear = 2026) => {
//   const now = new Date();
//   const start = new Date(startYear, 0, 1).getTime();
//   // Cap at "now" so we don't get future dates
//   const end = Math.min(new Date(endYear, 11, 31, 23, 59, 59).getTime(), now.getTime());
//   const ts = randInt(start, end);
//   return new Date(ts);
// };

// const randomAccountNumber = () => {
//   // 10-digit account number
//   let n = "";
//   for (let i = 0; i < 10; i++) n += randInt(0, 9);
//   return n;
// };

// const randomReference = () => {
//   const prefix = "TXN";
//   const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//   let suffix = "";
//   for (let i = 0; i < 10; i++) {
//     suffix += chars[Math.floor(Math.random() * chars.length)];
//   }
//   return `${prefix}-${Date.now().toString(36).toUpperCase()}-${suffix}`;
// };

// const randomUSName = () =>
//   `${pick(US_FIRST_NAMES)} ${pick(US_LAST_NAMES)}`;

// // ============================================================
// // GENERATORS
// // ============================================================

// function buildLocalTransfer(userId, runningBalance) {
//   const txnType = Math.random() < 0.5 ? "credit" : "debit";
//   const amount = randomAmount();
//   const bank = pick(US_BANKS);
//   const balanceBefore = runningBalance;
//   const balanceAfter =
//     txnType === "credit" ? balanceBefore + amount : balanceBefore - amount;
//   const createdAt = randomDateBetween(2021, 2026);

//   return {
//     doc: {
//       user: userId,
//       amount,
//       accountname: randomUSName(),
//       accountnumber: randomAccountNumber(),
//       type: txnType,
//       bankname: bank.name,
//       accounttype: "Online Banking",
//       routing_number: bank.routing,
//       swift_code: bank.swift,
//       description: pick(LOCAL_DESCRIPTIONS),
//       balanceBefore,
//       balanceAfter,
//       status: "completed",
//       reference: randomReference(),
//       createdAt,
//       updatedAt: createdAt,
//     },
//     txnType,
//     amount,
//     newBalance: balanceAfter,
//   };
// }

// function buildInternationalTransfer(userId) {
//   // International schema is always "debit" outflow in your design
//   // (no `type: credit|debit` field — it's always money going out via method)
//   // But the user wants both credit + debit shown in activities.
//   // Workaround: stamp a `flow` field in `details` so we can differentiate,
//   // and dashboard JS already treats international as `debit` by default.
//   // To make BOTH show, we'll randomly mark some as credits using details.flow.
//   const flow = Math.random() < 0.5 ? "credit" : "debit";
//   const amount = randomAmount();
//   const recipient = pick(INTERNATIONAL_RECIPIENTS);
//   const method = pick(INTL_METHODS);
//   const createdAt = randomDateBetween(2021, 2026);

//   return {
//     doc: {
//       userId,
//       type: "international",
//       method,
//       amount,
//       balanceType: "fiat",
//       currency: "USD",
//       details: {
//         flow, // "credit" or "debit" — picked up by dashboard
//         recipientName: recipient.name,
//         recipientCountry: recipient.country,
//         recipientAccount: randomAccountNumber(),
//         swiftCode: pick(US_BANKS).swift,
//         reference: randomReference(),
//       },
//       description: `${pick(INTL_DESCRIPTIONS)} (${recipient.country})`,
//       status: "completed",
//       processedAt: createdAt,
//       createdAt,
//     },
//     txnType: flow,
//     amount,
//   };
// }

// // ============================================================
// // ROUTE
// // ============================================================

// AdminSeedRouter.post(
//   "/users/:userId/seed-transactions",
//   async (req, res) => {
//     try {
//       const { userId } = req.params;
//       const { type, count } = req.body || {};

//       // Validate
//       if (!mongoose.Types.ObjectId.isValid(userId)) {
//         return res.status(400).json({ success: false, message: "Invalid user ID." });
//       }
//       if (!["local", "international"].includes(type)) {
//         return res.status(400).json({
//           success: false,
//           message: "type must be 'local' or 'international'.",
//         });
//       }
//       const n = Number(count);
//       if (!Number.isInteger(n) || n < 1 || n > 20) {
//         return res.status(400).json({
//           success: false,
//           message: "count must be an integer between 1 and 20.",
//         });
//       }

//       const user = await UserModel.findById(userId);
//       if (!user) {
//         return res.status(404).json({ success: false, message: "User not found." });
//       }

//       let createdDocs = [];
//       let totalCredits = 0;
//       let totalDebits = 0;

//       if (type === "local") {
//         // Local requires balanceBefore/balanceAfter — walk a running balance
//         let runningBalance = Number(user.balance || 0);
//         const docs = [];

//         // Generate in chronological order so balanceBefore/After makes sense
//         const generated = Array.from({ length: n }, () => buildLocalTransfer(userId, 0));
//         // Sort by date ascending, then recompute running balances
//         generated.sort(
//           (a, b) => new Date(a.doc.createdAt) - new Date(b.doc.createdAt)
//         );

//         for (const item of generated) {
//           item.doc.balanceBefore = runningBalance;
//           item.doc.balanceAfter =
//             item.txnType === "credit"
//               ? runningBalance + item.amount
//               : runningBalance - item.amount;
//           runningBalance = item.doc.balanceAfter;

//           if (item.txnType === "credit") totalCredits += item.amount;
//           else totalDebits += item.amount;

//           docs.push(item.doc);
//         }

//         createdDocs = await LocaltransferModel.insertMany(docs);
//       } else {
//         // International
//         const generated = Array.from({ length: n }, () => buildInternationalTransfer(userId));
//         for (const item of generated) {
//           if (item.txnType === "credit") totalCredits += item.amount;
//           else totalDebits += item.amount;
//         }
//         createdDocs = await InternationalTransferModel.insertMany(
//           generated.map((g) => g.doc)
//         );
//       }

//       // Update user balance: credits add, debits subtract
//       const netChange = totalCredits - totalDebits;
//       const newBalance = Math.max(0, Number(user.balance || 0) + netChange);
//       user.balance = newBalance;
//       await user.save();

//       return res.json({
//         success: true,
//         message: `Generated ${createdDocs.length} ${type} transaction(s).`,
//         summary: {
//           count: createdDocs.length,
//           credits: totalCredits,
//           debits: totalDebits,
//           netChange,
//           previousBalance: Number(user.balance || 0) - netChange,
//           newBalance,
//         },
//       });
//     } catch (err) {
//       console.error("[admin/seed-transactions]", err);
//       return res.status(500).json({
//         success: false,
//         message: "Failed to seed transactions.",
//         error: err.message,
//       });
//     }
//   }
// );

// export default AdminSeedRouter;

import express from "express";
import mongoose from "mongoose";
import LocaltransferModel from "../../models/LocaltransferModel.js";
import UserModel from "../../models/UserModel.js";
import InternationalTransferModel from "../../models/InternationalTransferModel.js";

const AdminSeedRouter = express.Router();

// ============================================================
// FAKE DATA POOLS
// ============================================================

const US_BANKS = [
  { name: "Chase Bank", routing: "021000021", swift: "CHASUS33" },
  { name: "Bank of America", routing: "026009593", swift: "BOFAUS3N" },
  { name: "Wells Fargo", routing: "121000248", swift: "WFBIUS6S" },
  { name: "Citibank", routing: "021000089", swift: "CITIUS33" },
  { name: "U.S. Bank", routing: "091000022", swift: "USBKUS44IMT" },
  { name: "PNC Bank", routing: "043000096", swift: "PNCCUS33" },
  { name: "Capital One", routing: "051405515", swift: "NFBKUS33" },
  { name: "TD Bank", routing: "031101266", swift: "NRTHUS33" },
  { name: "HSBC USA", routing: "021001088", swift: "MRMDUS33" },
  { name: "Goldman Sachs", routing: "124085244", swift: "GSCMUS33" },
  { name: "Charles Schwab Bank", routing: "121202211", swift: "CSCHUS6S" },
  { name: "Ally Bank", routing: "124003116", swift: "ALLYUS31" },
];

const US_FIRST_NAMES = [
  "Michael",
  "Jennifer",
  "Robert",
  "Linda",
  "David",
  "Patricia",
  "James",
  "Mary",
  "John",
  "Susan",
  "Christopher",
  "Karen",
  "Daniel",
  "Sarah",
  "Matthew",
  "Emily",
  "Andrew",
  "Jessica",
  "Joseph",
  "Megan",
  "Ryan",
  "Amanda",
  "Brian",
  "Rachel",
  "Kevin",
  "Laura",
  "Steven",
  "Nicole",
  "Eric",
  "Stephanie",
];

const US_LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
];

const INTERNATIONAL_RECIPIENTS = [
  { name: "Michael Anderson", country: "USA" },
  { name: "Jennifer Williams", country: "USA" },
  { name: "Robert Johnson", country: "USA" },
  { name: "Sarah Mitchell", country: "USA" },
  { name: "Wei Chen", country: "China" },
  { name: "Li Wang", country: "China" },
  { name: "Xiu Zhang", country: "China" },
  { name: "Hao Liu", country: "China" },
  { name: "Mei Lin", country: "China" },
  { name: "Juan Dela Cruz", country: "Philippines" },
  { name: "Maria Santos", country: "Philippines" },
  { name: "Jose Reyes", country: "Philippines" },
  { name: "Ana Garcia", country: "Philippines" },
  { name: "James Bennett", country: "UK" },
  { name: "Emma Thompson", country: "UK" },
  { name: "Oliver Hughes", country: "UK" },
  { name: "Hans Müller", country: "Germany" },
  { name: "Anna Schmidt", country: "Germany" },
  { name: "Klaus Weber", country: "Germany" },
  { name: "Hiroshi Tanaka", country: "Japan" },
  { name: "Yuki Sato", country: "Japan" },
  { name: "Kenji Watanabe", country: "Japan" },
  { name: "Lucas Silva", country: "Brazil" },
  { name: "Camila Oliveira", country: "Brazil" },
  { name: "Raj Patel", country: "India" },
  { name: "Priya Sharma", country: "India" },
  { name: "Arjun Kumar", country: "India" },
  { name: "Pierre Dubois", country: "France" },
  { name: "Sophie Martin", country: "France" },
  { name: "Min-jun Kim", country: "South Korea" },
  { name: "Ji-woo Park", country: "South Korea" },
  { name: "Jack Wilson", country: "Australia" },
  { name: "Charlotte Brown", country: "Australia" },
  { name: "Ethan MacKenzie", country: "Canada" },
  { name: "Sophia Tremblay", country: "Canada" },
  { name: "Carlos Hernandez", country: "Mexico" },
  { name: "Isabella Lopez", country: "Mexico" },
];

const INTL_METHODS = [
  "Wire Transfer",
  "PayPal",
  "Wise Transfer",
  "Skrill",
  "Zelle",
  "Cash App",
  "Revolut",
  "Alipay",
  "WeChat Pay",
];

const LOCAL_DESCRIPTIONS = [
  "Salary payment",
  "Rent payment",
  "Invoice settlement",
  "Consulting fee",
  "Contract payment",
  "Service charge",
  "Refund processed",
  "Bonus payment",
  "Reimbursement",
  "Project payment",
  "Subscription fee",
  "Loan disbursement",
];

const INTL_DESCRIPTIONS = [
  "International business payment",
  "Cross-border invoice",
  "Overseas contract settlement",
  "Foreign supplier payment",
  "International remittance",
  "Global consulting fee",
  "Overseas service charge",
  "Import payment",
  "Export proceeds",
  "Cross-border refund",
];

// ============================================================
// HELPERS
// ============================================================

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomAmount = () => {
  const base = randInt(20000, 1000000);
  return Math.round(base / 100) * 100;
};

const randomDateBetween = () => {
  const start = new Date(2024, 0, 1).getTime();
  const end = Date.now();
  return new Date(randInt(start, end));
};

const randomAccountNumber = () => {
  let n = "";
  for (let i = 0; i < 10; i++) n += randInt(0, 9);
  return n;
};

const randomReference = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 10; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TXN-${Date.now().toString(36).toUpperCase()}-${suffix}`;
};

const randomUSName = () => `${pick(US_FIRST_NAMES)} ${pick(US_LAST_NAMES)}`;

// ✅ Balanced type generator
// Even  → exactly half credit, half debit
// Odd   → one side gets the extra, randomly decided, then shuffled
function generateBalancedTypes(n) {
  const half = Math.floor(n / 2);
  const types = [...Array(half).fill("credit"), ...Array(half).fill("debit")];

  // odd number — randomly add one more
  if (n % 2 !== 0) {
    types.push(Math.random() < 0.5 ? "credit" : "debit");
  }

  // shuffle so they're not grouped
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }

  return types;
}

// ============================================================
// GENERATORS
// ============================================================

function buildLocalTransfer(userId, runningBalance, forcedType) {
  const txnType = forcedType; // ✅ balanced type passed in
  const amount = randomAmount();
  const bank = pick(US_BANKS);
  const balanceBefore = runningBalance;
  const balanceAfter =
    txnType === "credit" ? balanceBefore + amount : balanceBefore - amount;
  const createdAt = randomDateBetween();

  return {
    doc: {
      user: userId,
      amount,
      accountname: randomUSName(),
      accountnumber: randomAccountNumber(),
      type: txnType,
      bankname: bank.name,
      accounttype: "Online Banking",
      routing_number: bank.routing,
      swift_code: bank.swift,
      description: pick(LOCAL_DESCRIPTIONS),
      balanceBefore,
      balanceAfter,
      status: "successful",
      reference: randomReference(),
      createdAt,
      updatedAt: createdAt,
    },
    txnType,
    amount,
    newBalance: balanceAfter,
  };
}

function buildInternationalTransfer(userId, forcedType) {
  const txnType = forcedType; // ✅ balanced type passed in
  const amount = randomAmount();
  const recipient = pick(INTERNATIONAL_RECIPIENTS);
  const method = pick(INTL_METHODS);
  const createdAt = randomDateBetween();

  return {
    doc: {
      userId,
      type: txnType,
      method,
      amount,
      balanceType: "fiat",
      currency: "USD",
      details: {
        accountName: recipient.name, // ✅ already correct
        accountNumber: randomAccountNumber(), // ❌ was "recipientAccount"
        bankName: pick(US_BANKS).name, // ❌ was missing
        country: recipient.country, // ❌ was "recipientCountry"
        swiftCode: pick(US_BANKS).swift, // ✅ already correct
        reference: randomReference(), // ✅ already correct
        iban: `GB${randInt(10, 99)}NWBK${randomAccountNumber()}`, // ❌ was missing
      },
      description: `${pick(INTL_DESCRIPTIONS)} (${recipient.country})`,
      status: "successful",
      processedAt: createdAt,
      createdAt,
    },
    txnType,
    amount,
  };
}

// ============================================================
// ROUTE
// ============================================================

AdminSeedRouter.post("/users/:userId/seed-transactions", async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, count } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID." });
    }
    if (!["local", "international"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "type must be 'local' or 'international'.",
      });
    }
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > 20) {
      return res.status(400).json({
        success: false,
        message: "count must be an integer between 1 and 20.",
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    let createdDocs = [];
    let totalCredits = 0;
    let totalDebits = 0;

    const balancedTypes = generateBalancedTypes(n); // ✅ one balanced pool for both types

    if (type === "local") {
      let runningBalance = Number(user.balance || 0);

      const generated = balancedTypes.map((t) =>
        buildLocalTransfer(userId, 0, t),
      );

      // sort chronologically so balanceBefore/After makes sense
      generated.sort(
        (a, b) => new Date(a.doc.createdAt) - new Date(b.doc.createdAt),
      );

      const docs = [];
      for (const item of generated) {
        item.doc.balanceBefore = runningBalance;
        item.doc.balanceAfter =
          item.txnType === "credit"
            ? runningBalance + item.amount
            : runningBalance - item.amount;
        runningBalance = item.doc.balanceAfter;

        if (item.txnType === "credit") totalCredits += item.amount;
        else totalDebits += item.amount;

        docs.push(item.doc);
      }

      createdDocs = await LocaltransferModel.insertMany(docs);
    } else {
      const generated = balancedTypes.map((t) =>
        buildInternationalTransfer(userId, t),
      );

      for (const item of generated) {
        if (item.txnType === "credit") totalCredits += item.amount;
        else totalDebits += item.amount;
      }

      createdDocs = await InternationalTransferModel.insertMany(
        generated.map((g) => g.doc),
      );
    }

    // update user balance
    const netChange = totalCredits - totalDebits;
    const previousBalance = Number(user.balance || 0);
    const newBalance = Math.max(0, previousBalance + netChange);
    user.balance = newBalance;
    await user.save();

    return res.json({
      success: true,
      message: `Generated ${createdDocs.length} ${type} transaction(s).`,
      summary: {
        count: createdDocs.length,
        credits: totalCredits,
        debits: totalDebits,
        netChange,
        previousBalance,
        newBalance,
      },
    });
  } catch (err) {
    console.error("[admin/seed-transactions]", err);
    return res.status(500).json({
      success: false,
      message: "Failed to seed transactions.",
      error: err.message,
    });
  }
});

export default AdminSeedRouter;
