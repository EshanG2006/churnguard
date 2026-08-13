"""
ChurnGuard - Model training
Phase 1, Steps 2 & 3

Trains a baseline Logistic Regression, then XGBoost, and compares
them properly (not just accuracy - see the explanation printed at
the bottom). Handles class imbalance via class weighting.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
)
from xgboost import XGBClassifier
import joblib

from data_prep import load_and_clean, encode_features


def main():
    # ---- Load & prepare data ----
    df = load_and_clean("data/telco_churn.csv")
    df = encode_features(df)

    X = df.drop(columns=["Churn"])
    y = df["Churn"]

    # Save the exact column order - the FastAPI service needs to
    # build input rows in this exact same order at inference time,
    # or the model will silently misread which number means what.
    feature_columns = X.columns.tolist()

    # stratify=y keeps the 73.5%/26.5% split ratio consistent in both
    # the train and test sets. Without it, random chance could give
    # you a test set with a different churn rate than training,
    # making your evaluation numbers misleading.
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"Train size: {len(X_train)}, Test size: {len(X_test)}")
    print(f"Train churn rate: {y_train.mean():.3f}, Test churn rate: {y_test.mean():.3f}")

    # ---- Baseline: Logistic Regression ----
    # Logistic Regression is sensitive to feature scale (a column
    # like TotalCharges ranging 0-8000 would dominate a column like
    # SeniorCitizen ranging 0-1 unless we scale them first).
    # XGBoost (tree-based) doesn't need this - trees split on
    # thresholds, not distances, so scale doesn't matter to it.
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # class_weight="balanced" automatically up-weights the minority
    # class (churners) during training, so mistakes on churners cost
    # the model more than mistakes on non-churners - directly
    # countering the 73.5/26.5 imbalance instead of ignoring it.
    log_reg = LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42)
    log_reg.fit(X_train_scaled, y_train)
    log_reg_preds = log_reg.predict(X_test_scaled)
    log_reg_proba = log_reg.predict_proba(X_test_scaled)[:, 1]

    print("\n" + "=" * 60)
    print("LOGISTIC REGRESSION (baseline)")
    print("=" * 60)
    print(confusion_matrix(y_test, log_reg_preds))
    print(classification_report(y_test, log_reg_preds, target_names=["No Churn", "Churn"]))
    print(f"ROC-AUC: {roc_auc_score(y_test, log_reg_proba):.4f}")

    # ---- XGBoost ----
    # scale_pos_weight is XGBoost's equivalent of class_weight balanced -
    # it's the ratio of negative to positive examples, telling the
    # model to pay proportionally more attention to the minority class.
    scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

    xgb = XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        scale_pos_weight=scale_pos_weight,
        random_state=42,
        eval_metric="logloss",
    )
    xgb.fit(X_train, y_train)  # no scaling needed for tree models
    xgb_preds = xgb.predict(X_test)
    xgb_proba = xgb.predict_proba(X_test)[:, 1]

    print("\n" + "=" * 60)
    print("XGBOOST")
    print("=" * 60)
    print(confusion_matrix(y_test, xgb_preds))
    print(classification_report(y_test, xgb_preds, target_names=["No Churn", "Churn"]))
    print(f"ROC-AUC: {roc_auc_score(y_test, xgb_proba):.4f}")

    # ---- Why these metrics, not just accuracy ----
    print("\n" + "=" * 60)
    print("WHY WE DON'T JUST LOOK AT ACCURACY")
    print("=" * 60)
    print(
        "73.5% of customers don't churn. A model that predicts "
        "'No Churn' for EVERY customer would score 73.5% accuracy "
        "while catching zero actual churners - useless for a "
        "retention team.\n"
        "Recall (for the 'Churn' class) tells us: of the customers "
        "who actually churned, what fraction did we catch? This is "
        "the number that matters most here, because a missed "
        "churner is a lost customer the business never got a chance "
        "to retain. Precision tells us: of the customers we flagged "
        "as at-risk, how many really were? Too low, and the "
        "retention team wastes effort on false alarms.\n"
        "ROC-AUC summarizes how well the model ranks churners above "
        "non-churners across all thresholds, independent of any "
        "single cutoff - useful for comparing two models fairly."
    )

    # ---- Pick the better model and save it ----
    # We compare on recall for the churn class specifically, since
    # that's the metric that matters most for this business problem.
    xgb_recall = classification_report(
        y_test, xgb_preds, target_names=["No Churn", "Churn"], output_dict=True
    )["Churn"]["recall"]
    log_reg_recall = classification_report(
        y_test, log_reg_preds, target_names=["No Churn", "Churn"], output_dict=True
    )["Churn"]["recall"]

    print(f"\nLogReg churn recall: {log_reg_recall:.3f}")
    print(f"XGBoost churn recall: {xgb_recall:.3f}")

    if xgb_recall >= log_reg_recall:
        print("-> Saving XGBoost as the production model.")
        joblib.dump(xgb, "models/churn_model.pkl")
        joblib.dump(None, "models/scaler.pkl")  # XGBoost doesn't need scaling
        model_type = "xgboost"
    else:
        print("-> Saving Logistic Regression as the production model.")
        joblib.dump(log_reg, "models/churn_model.pkl")
        joblib.dump(scaler, "models/scaler.pkl")
        model_type = "logistic_regression"

    joblib.dump(feature_columns, "models/feature_columns.pkl")
    joblib.dump(model_type, "models/model_type.pkl")

    print(f"\nSaved model ({model_type}) and metadata to models/")


if __name__ == "__main__":
    main()
