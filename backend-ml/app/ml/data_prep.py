"""
ChurnGuard - Data loading & cleaning
Phase 1, Step 1

This module is imported by both the training script AND (later) the
FastAPI inference endpoint, so raw customer input goes through the
exact same cleaning logic in both places. Keeping this in one place
avoids a classic real-world bug: training-serving skew (where the
model was trained on data cleaned one way, but live requests get
cleaned a different way, silently breaking predictions).
"""

import pandas as pd


def load_and_clean(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)

    # TotalCharges is loaded as a string because 11 rows have blank
    # values for brand-new customers (tenure == 0) who haven't been
    # billed yet. pd.to_numeric with errors="coerce" turns those
    # blanks into NaN so we can handle them explicitly instead of
    # silently having a broken numeric column.
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")

    # These are legitimately "0 spent so far", not missing/corrupted
    # data - so filling with 0 is the correct call here, not a
    # generic mean/median imputation.
    df["TotalCharges"] = df["TotalCharges"].fillna(0)

    # customerID is a unique identifier, not a predictive feature -
    # drop it before modeling (kept separately if needed for lookups).
    df = df.drop(columns=["customerID"])

    # Target column: convert "Yes"/"No" to 1/0 so scikit-learn can
    # use it directly.
    df["Churn"] = (df["Churn"] == "Yes").astype(int)

    return df


def encode_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    One-hot encode all categorical columns.

    drop_first=True drops one category per column (e.g. keeps
    "Partner_Yes" but not "Partner_No") since for a binary column the
    second is fully implied by the first - keeping both is redundant
    and can hurt Logistic Regression specifically (multicollinearity).
    XGBoost is largely unaffected by this, but there's no downside to
    doing it correctly for both.
    """
    categorical_cols = df.select_dtypes(include=["object", "str"]).columns.tolist()
    df_encoded = pd.get_dummies(df, columns=categorical_cols, drop_first=True)
    return df_encoded


if __name__ == "__main__":
    df = load_and_clean("data/telco_churn.csv")
    print("Shape after cleaning:", df.shape)

    df_encoded = encode_features(df)
    print("Shape after encoding:", df_encoded.shape)
    print("\nColumns after encoding:")
    print(df_encoded.columns.tolist())
