from fastapi import APIRouter
from services.enhanced_model_service import train_all_models, get_model_info, get_available_algorithms

router = APIRouter()

@router.get("/train-all")
def train_all_ml_models():
    """Train all available ML algorithms"""
    return train_all_models()

@router.get("/models")
def get_models_info():
    """Get information about all available ML models"""
    return {
        "models": get_model_info(),
        "available_algorithms": get_available_algorithms()
    }
