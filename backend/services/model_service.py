import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib

MODEL = None  # global model

def load_model():
    global MODEL
    try:
        MODEL = joblib.load("model.pkl")
        print("Model loaded successfully")
        return True
    except FileNotFoundError:
        print("No trained model found, please train first")
        return False


def train_model():
    global MODEL

    # 📊 Load dataset
    df = pd.read_csv("dataset.csv")

    if len(df) < 10:
        return {"error": "Not enough data to train"}

    # 🎯 Features & Target
    X = df[["rsi", "ema_fast", "ema_slow", "momentum"]]
    y = df["label"]

    # 🧪 Train-Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=True
    )

    # 🌲 Model
    model = RandomForestClassifier(n_estimators=100)
    model.fit(X_train, y_train)

    # 📈 Accuracy
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    MODEL = model

    return {
        "status": "trained",
        "accuracy": round(acc * 100, 2),
        "rows_used": len(df)
    }


def predict_signal(feature: dict):
    global MODEL

    if MODEL is None:
        if not load_model():
            return {"signal": "MODEL_NOT_TRAINED", "confidence": 0, "probabilities": {}}

    X = [[
        feature["rsi"],
        feature["ema_fast"],
        feature["ema_slow"],
        feature["momentum"]
    ]]

    prediction = MODEL.predict(X)[0]
    
    # Get confidence scores (probabilities)
    probabilities = MODEL.predict_proba(X)[0]
    confidence = max(probabilities) * 100
    
    # Get class labels
    classes = MODEL.classes_
    predicted_class = prediction
    
    return {
        "signal": predicted_class,
        "confidence": round(confidence, 2),
        "probabilities": {
            "BUY": round(probabilities[classes.tolist().index("BUY")] * 100, 2) if "BUY" in classes else 0,
            "SELL": round(probabilities[classes.tolist().index("SELL")] * 100, 2) if "SELL" in classes else 0,
            "HOLD": round(probabilities[classes.tolist().index("HOLD")] * 100, 2) if "HOLD" in classes else 0
        }
    }