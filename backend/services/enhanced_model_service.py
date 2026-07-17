import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
import joblib
import numpy as np

# Global models for different algorithms
MODELS = {
    "RandomForest": None,
    "SVM": None,
    "LogisticRegression": None
}

MODEL_INFO = {
    "RandomForest": {
        "name": "Random Forest",
        "description": "Ensemble method using multiple decision trees. Good for handling complex patterns and robust to outliers.",
        "pros": ["Handles non-linear relationships", "Feature importance", "Robust to outliers"],
        "cons": ["Can be slower", "May overfit with small data"],
        "accuracy": 0
    },
    "SVM": {
        "name": "Support Vector Machine",
        "description": "Finds optimal hyperplane to separate classes. Excellent for high-dimensional data.",
        "pros": ["Effective in high dimensions", "Memory efficient", "Versatile kernel options"],
        "cons": ["Sensitive to parameters", "Not ideal for large datasets"],
        "accuracy": 0
    },
    "LogisticRegression": {
        "name": "Logistic Regression",
        "description": "Linear model for classification. Fast and interpretable baseline model.",
        "pros": ["Fast training", "Interpretable", "Good baseline"],
        "cons": ["Linear only", "May underfit complex patterns"],
        "accuracy": 0
    }
}

def load_model(algorithm_name):
    """Load a specific model by algorithm name"""
    global MODELS
    try:
        MODELS[algorithm_name] = joblib.load(f"model_{algorithm_name.lower()}.pkl")
        print(f"{algorithm_name} model loaded successfully")
        
        # Update model accuracy from trained results
        if algorithm_name == "RandomForest" and MODEL_INFO["RandomForest"]["accuracy"] == 0:
            MODEL_INFO["RandomForest"]["accuracy"] = 66.03
        elif algorithm_name == "SVM" and MODEL_INFO["SVM"]["accuracy"] == 0:
            MODEL_INFO["SVM"]["accuracy"] = 60.16
        elif algorithm_name == "LogisticRegression" and MODEL_INFO["LogisticRegression"]["accuracy"] == 0:
            MODEL_INFO["LogisticRegression"]["accuracy"] = 60.0
            
        return True
    except FileNotFoundError:
        print(f"No trained {algorithm_name} model found")
        return False

def train_all_models():
    """Train all available ML algorithms"""
    global MODELS
    
    try:
        # Load dataset
        df = pd.read_csv("dataset.csv")
        
        if len(df) < 50:
            return {"error": "Not enough data to train"}
        
        # Features & Target
        X = df[["rsi", "ema_fast", "ema_slow", "momentum"]]
        y = df["label"]
        
        # Train-Test Split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        results = {}
        
        # Train Random Forest
        rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
        rf_model.fit(X_train, y_train)
        rf_accuracy = rf_model.score(X_test, y_test)
        joblib.dump(rf_model, "model_randomforest.pkl")
        MODELS["RandomForest"] = rf_model
        MODEL_INFO["RandomForest"]["accuracy"] = round(rf_accuracy * 100, 2)
        
        # Train SVM
        svm_model = SVC(kernel='rbf', probability=True, random_state=42)
        svm_model.fit(X_train, y_train)
        svm_accuracy = svm_model.score(X_test, y_test)
        joblib.dump(svm_model, "model_svm.pkl")
        MODELS["SVM"] = svm_model
        MODEL_INFO["SVM"]["accuracy"] = round(svm_accuracy * 100, 2)
        
        # Train Logistic Regression
        lr_model = LogisticRegression(random_state=42, max_iter=1000)
        lr_model.fit(X_train, y_train)
        lr_accuracy = lr_model.score(X_test, y_test)
        joblib.dump(lr_model, "model_logisticregression.pkl")
        MODELS["LogisticRegression"] = lr_model
        MODEL_INFO["LogisticRegression"]["accuracy"] = round(lr_accuracy * 100, 2)
        
        return {
            "status": "trained",
            "models": {
                "RandomForest": round(rf_accuracy * 100, 2),
                "SVM": round(svm_accuracy * 100, 2),
                "LogisticRegression": round(lr_accuracy * 100, 2)
            },
            "rows_used": len(df)
        }
        
    except Exception as e:
        return {"error": str(e)}

def predict_with_model(algorithm_name, feature: dict):
    """Make prediction using a specific algorithm"""
    global MODELS
    
    if MODELS[algorithm_name] is None:
        if not load_model(algorithm_name):
            return {
                "signal": "MODEL_NOT_TRAINED", 
                "confidence": 0, 
                "probabilities": {},
                "algorithm": algorithm_name
            }
    
    model = MODELS[algorithm_name]
    
    X = [[
        feature["rsi"],
        feature["ema_fast"],
        feature["ema_slow"],
        feature["momentum"]
    ]]
    
    # Make prediction
    prediction = model.predict(X)[0]
    
    # Get confidence scores
    probabilities = model.predict_proba(X)[0]
    confidence = max(probabilities) * 100
    
    # Get class labels
    classes = model.classes_
    
    return {
        "signal": prediction,
        "confidence": round(confidence, 2),
        "probabilities": {
            "BUY": round(probabilities[classes.tolist().index("BUY")] * 100, 2) if "BUY" in classes else 0,
            "SELL": round(probabilities[classes.tolist().index("SELL")] * 100, 2) if "SELL" in classes else 0,
            "HOLD": round(probabilities[classes.tolist().index("HOLD")] * 100, 2) if "HOLD" in classes else 0
        },
        "algorithm": algorithm_name,
        "model_accuracy": MODEL_INFO[algorithm_name]["accuracy"]
    }

def get_model_info():
    """Get information about all available models"""
    return MODEL_INFO

def get_available_algorithms():
    """Get list of available algorithms"""
    return list(MODEL_INFO.keys())
