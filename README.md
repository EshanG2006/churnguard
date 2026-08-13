# ChurnGuard — Phase 1 (MVP)

Customer churn prediction with a live risk dashboard. Built as a
three-service app: a Python ML service (FastAPI), a Node API
(Express + MongoDB), and a React frontend.

## What's done (Phase 1, steps 1–5)

- ✅ Data loading & cleaning (`backend-ml/app/ml/data_prep.py`)
- ✅ Baseline Logistic Regression vs XGBoost, with class-imbalance
  handling and full evaluation (`backend-ml/app/ml/train.py`)
- ✅ FastAPI `/predict` endpoint serving the trained model
  (`backend-ml/app/main.py`)
- ✅ Express API + MongoDB storing customers and their risk scores
  (`backend-node/src/`)
- ✅ React dashboard: sortable, filterable customer risk table
  (`frontend/src/`)

**Not built yet (later phases, don't touch tonight):**
Phase 2 (SHAP explainability), Phase 3 (what-if retention simulator).

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB running locally (`mongod`), or a free MongoDB Atlas URI

---

## Run order (four terminals)

### 1. Python ML service

```bash
cd backend-ml
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Train the model (only needs to be run once, or after changing train.py)
python3 app/ml/train.py

# Start the API
uvicorn app.main:app --reload --port 8000
```
Check it's alive: open http://localhost:8000 — should show
`{"status": "ok", "model_type": "xgboost"}`.

### 2. MongoDB

Make sure `mongod` is running locally, or set `MONGO_URI` in
`backend-node/.env` to your Atlas connection string.

### 3. Seed the database

This loads 150 real customers from the dataset, sends each one to
FastAPI for scoring, and stores the results in MongoDB. Run this
**after** step 1's API is up.

```bash
cd backend-node
npm install
cp .env.example .env
npm run seed
```

### 4. Express API

```bash
cd backend-node
npm start
```
Check it's alive: http://localhost:4000/api/customers should return
a JSON array of scored customers.

### 5. React frontend

```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 — you should see the customer table,
sortable by clicking column headers, filterable by risk level.

---

## Project structure

```
churnguard/
├── backend-ml/
│   ├── app/
│   │   ├── main.py           # FastAPI app + /predict endpoint
│   │   └── ml/
│   │       ├── data_prep.py  # load_and_clean, encode_features
│   │       └── train.py      # trains + evaluates + saves the model
│   ├── models/                # saved churn_model.pkl etc. (generated)
│   ├── data/                  # telco_churn.csv
│   └── requirements.txt
├── backend-node/
│   ├── src/
│   │   ├── server.js          # Express app, /api/customers
│   │   ├── seed.js            # loads + scores customers into Mongo
│   │   └── models/Customer.js # Mongoose schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/CustomerTable.jsx
│   │   └── index.css
│   └── package.json
└── README.md
```

---

## Key results to remember (for your own reference / interview prep)

- Dataset: IBM Telco Customer Churn, 7,043 customers, 26.5% churn rate
  (imbalanced).
- 11 rows had blank `TotalCharges` — all brand-new customers
  (tenure=0), filled with 0 rather than dropped or mean-imputed.
- Logistic Regression (class_weight="balanced") vs XGBoost
  (scale_pos_weight) both trained and compared on churn-class recall,
  not accuracy.
- XGBoost won on recall (~79.4% vs ~78.6%) and was saved as the
  production model. ROC-AUC ~0.84 for both.
- Metric choice reasoning: accuracy is misleading on a 73.5/26.5 split
  (always predicting "No Churn" gets 73.5% "accuracy" while catching
  zero churners) — recall on the churn class is what a retention team
  actually cares about.

## Next steps (when you're ready — don't start tonight)

- **Phase 2:** Add SHAP to explain *why* each customer is flagged
  (per-feature contribution), surfaced in the React UI per row.
- **Phase 3:** Build the what-if simulator — sliders to adjust a
  customer's contract type / monthly charge / etc. and re-call
  `/predict` live to see the risk score change.
