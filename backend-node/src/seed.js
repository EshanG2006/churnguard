/**
 * ChurnGuard - seed script
 *
 * Loads a subset of customers from the Telco CSV, calls the FastAPI
 * /predict endpoint for each one, and stores both the raw customer
 * data and the resulting risk score in MongoDB.
 *
 * Run: node src/seed.js
 * (Requires FastAPI running on :8000 and MongoDB running on :27017 first)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import axios from "axios";
import mongoose from "mongoose";
import "dotenv/config";
import Customer from "./models/Customer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, "..", "..", "backend-ml", "data", "telco_churn.csv");
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/churnguard";
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";
const SEED_LIMIT = 150; // keep it small for a fast local demo

function toApiPayload(row) {
  return {
    gender: row.gender,
    SeniorCitizen: Number(row.SeniorCitizen),
    Partner: row.Partner,
    Dependents: row.Dependents,
    tenure: Number(row.tenure),
    PhoneService: row.PhoneService,
    MultipleLines: row.MultipleLines,
    InternetService: row.InternetService,
    OnlineSecurity: row.OnlineSecurity,
    OnlineBackup: row.OnlineBackup,
    DeviceProtection: row.DeviceProtection,
    TechSupport: row.TechSupport,
    StreamingTV: row.StreamingTV,
    StreamingMovies: row.StreamingMovies,
    Contract: row.Contract,
    PaperlessBilling: row.PaperlessBilling,
    PaymentMethod: row.PaymentMethod,
    MonthlyCharges: Number(row.MonthlyCharges),
    TotalCharges: row.TotalCharges === "" ? 0 : Number(row.TotalCharges),
  };
}

async function main() {
  const csvText = fs.readFileSync(CSV_PATH, "utf-8");
  const rows = parse(csvText, { columns: true, skip_empty_lines: true }).slice(0, SEED_LIMIT);

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  await Customer.deleteMany({});
  console.log("Cleared existing customers");

  let scored = 0;
  for (const row of rows) {
    const payload = toApiPayload(row);
    let churnProbability = null;
    let riskLevel = "Unknown";

    try {
      const res = await axios.post(`${FASTAPI_URL}/predict`, payload);
      churnProbability = res.data.churn_probability;
      riskLevel = res.data.risk_level;
      scored++;
    } catch (err) {
      console.error(`Failed to score ${row.customerID}:`, err.message);
    }

    await Customer.create({
      customerRef: row.customerID,
      gender: row.gender,
      seniorCitizen: Number(row.SeniorCitizen),
      partner: row.Partner,
      dependents: row.Dependents,
      tenure: Number(row.tenure),
      phoneService: row.PhoneService,
      multipleLines: row.MultipleLines,
      internetService: row.InternetService,
      onlineSecurity: row.OnlineSecurity,
      onlineBackup: row.OnlineBackup,
      deviceProtection: row.DeviceProtection,
      techSupport: row.TechSupport,
      streamingTV: row.StreamingTV,
      streamingMovies: row.StreamingMovies,
      contract: row.Contract,
      paperlessBilling: row.PaperlessBilling,
      paymentMethod: row.PaymentMethod,
      monthlyCharges: payload.MonthlyCharges,
      totalCharges: payload.TotalCharges,
      actualChurn: row.Churn,
      churnProbability,
      riskLevel,
      scoredAt: new Date(),
    });
  }

  console.log(`Seeded ${rows.length} customers, ${scored} successfully scored.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
