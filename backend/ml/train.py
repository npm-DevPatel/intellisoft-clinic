from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import classification_report
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

HERE = Path(__file__).parent
DATA = HERE / "data" / "Maternal Health Risk Data Set.csv"
OUT = HERE / "model.pkl"

FEATURES = ["Age", "SystolicBP", "DiastolicBP", "BS", "BodyTemp", "HeartRate"]
TARGET = "RiskLevel"


def main():
    df = pd.read_csv(DATA)

    # the Kaggle file has a lot of repeated rows; if we keep them, copies of the
    # same record land in both train and test and the score looks better than it is
    before = len(df)
    df = df.drop_duplicates()
    print(f"{before} rows, {len(df)} after dropping duplicates")

    X, y = df[FEATURES], df[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    candidates = {
        f"KNN (k={k})": make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=k))
        for k in (3, 5, 7, 9, 11, 15)
    }
    candidates["Naive Bayes"] = make_pipeline(StandardScaler(), GaussianNB())

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = {
        name: cross_val_score(model, X_train, y_train, cv=cv).mean()
        for name, model in candidates.items()
    }

    print("\nCross-validated accuracy on the training set:")
    for name, score in scores.items():
        print(f"  {name:<14} {score:.3f}")

    best = max(scores, key=scores.get)
    model = candidates[best].fit(X_train, y_train)
    print(f"\nChosen: {best}")
    print("\nHeld-out test set:")
    print(classification_report(y_test, model.predict(X_test)))

    # refit on everything before saving
    model.fit(X, y)
    joblib.dump(model, OUT)
    print(f"Saved to {OUT}")


if __name__ == "__main__":
    main()