import mongoose from "mongoose";

// Mirrors the fields the FastAPI /predict endpoint expects, plus
// the fields we compute after calling it (churnProbability, riskLevel).
// Keeping the raw customer fields here (not just the risk score) is
// what makes the Phase 3 "what-if" simulator possible later: we need
// the original inputs on hand to tweak and re-score them.
const customerSchema = new mongoose.Schema({
  customerRef: { type: String, required: true, unique: true },
  gender: String,
  seniorCitizen: Number,
  partner: String,
  dependents: String,
  tenure: Number,
  phoneService: String,
  multipleLines: String,
  internetService: String,
  onlineSecurity: String,
  onlineBackup: String,
  deviceProtection: String,
  techSupport: String,
  streamingTV: String,
  streamingMovies: String,
  contract: String,
  paperlessBilling: String,
  paymentMethod: String,
  monthlyCharges: Number,
  totalCharges: Number,
  actualChurn: String, // ground truth label from the dataset, for reference only
  churnProbability: Number,
  riskLevel: String,
  scoredAt: Date,
});

export default mongoose.model("Customer", customerSchema);
