import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const result = await mongoose.connection.db
      .collection("international_transfers")
      .updateMany(
        { type: { $in: ["international", "local"] } },
        { $set: { type: "debit" } },
      );

    console.log(`✅ Matched: ${result.matchedCount}`);
    console.log(`✅ Updated: ${result.modifiedCount}`);

    await mongoose.disconnect();
    console.log("✅ Done, disconnected.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

migrate();
