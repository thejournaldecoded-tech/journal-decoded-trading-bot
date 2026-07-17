import numpy as np
from typing import Dict, List, Tuple
from datetime import datetime

class ConsensusService:
    """Service to handle consensus between multiple ML models and dynamic accuracy tracking"""
    
    def __init__(self):
        self.model_performance = {
            "RandomForest": {"correct": 0, "total": 0, "accuracy": 66.03},
            "SVM": {"correct": 0, "total": 0, "accuracy": 60.16},
            "LogisticRegression": {"correct": 0, "total": 0, "accuracy": 60.0}
        }
        self.prediction_history = []
    
    def get_consensus_signal(self, predictions: Dict[str, Dict]) -> Dict:
        """
        Get consensus signal from multiple model predictions
        Returns: {
            "consensus_signal": "BUY/SELL/HOLD",
            "consensus_strength": "STRONG/MODERATE/WEAK",
            "voting_breakdown": {"RandomForest": "SELL", "SVM": "SELL", "LogisticRegression": "SELL"},
            "weighted_confidence": 75.5,
            "explanation": "Educational explanation of the decision"
        }
        """
        
        # Extract signals and confidences
        signals = {}
        confidences = {}
        accuracies = {}
        
        for model_name, pred in predictions.items():
            signals[model_name] = pred.get("signal", "HOLD")
            confidences[model_name] = pred.get("confidence", 0)
            accuracies[model_name] = pred.get("model_accuracy", 0)
        
        # Count votes for each signal
        vote_counts = {"BUY": 0, "SELL": 0, "HOLD": 0}
        for signal in signals.values():
            vote_counts[signal] += 1
        
        # Determine consensus signal
        max_votes = max(vote_counts.values())
        consensus_candidates = [sig for sig, count in vote_counts.items() if count == max_votes]
        
        if len(consensus_candidates) == 1:
            consensus_signal = consensus_candidates[0]
            consensus_strength = self._calculate_strength(max_votes, len(signals))
        else:
            # Tie-breaking: use weighted confidence
            consensus_signal = self._tie_break_by_weighted_confidence(signals, confidences, accuracies)
            consensus_strength = "WEAK"
        
        # Calculate weighted confidence
        weighted_confidence = self._calculate_weighted_confidence(confidences, accuracies)
        
        # Generate explanation
        explanation = self._generate_explanation(
            signals, confidences, vote_counts, consensus_signal, consensus_strength, weighted_confidence
        )
        
        return {
            "consensus_signal": consensus_signal,
            "consensus_strength": consensus_strength,
            "voting_breakdown": signals,
            "vote_counts": vote_counts,
            "weighted_confidence": round(weighted_confidence, 2),
            "explanation": explanation,
            "individual_predictions": predictions
        }
    
    def _calculate_strength(self, votes: int, total_models: int) -> str:
        """Calculate consensus strength based on voting unanimity"""
        if votes == total_models:
            return "STRONG"
        elif votes >= total_models * 0.67:  # 2/3 majority
            return "MODERATE"
        else:
            return "WEAK"
    
    def _tie_break_by_weighted_confidence(self, signals: Dict, confidences: Dict, accuracies: Dict) -> str:
        """Break ties using weighted confidence"""
        weighted_scores = {}
        for model in signals:
            weight = accuracies.get(model, 0) / 100  # Convert accuracy to weight
            weighted_scores[model] = confidences.get(model, 0) * weight
        
        # Find model with highest weighted score
        best_model = max(weighted_scores, key=weighted_scores.get)
        return signals[best_model]
    
    def _calculate_weighted_confidence(self, confidences: Dict, accuracies: Dict) -> float:
        """Calculate weighted average confidence using model accuracies as weights"""
        total_weight = 0
        weighted_sum = 0
        
        for model in confidences:
            weight = accuracies.get(model, 0) / 100  # Convert accuracy to weight
            total_weight += weight
            weighted_sum += confidences.get(model, 0) * weight
        
        if total_weight == 0:
            return 0
        
        return weighted_sum / total_weight
    
    def _generate_explanation(self, signals: Dict, confidences: Dict, vote_counts: Dict, 
                           consensus_signal: str, consensus_strength: str, weighted_confidence: float) -> str:
        """Generate educational explanation for the consensus decision"""
        
        # Count agreement
        total_models = len(signals)
        agreement_count = vote_counts[consensus_signal]
        agreement_percent = (agreement_count / total_models) * 100
        
        explanation_parts = []
        
        # Main consensus explanation
        if consensus_strength == "STRONG":
            explanation_parts.append(f"🎯 **Strong Consensus**: All {total_models} models agree on {consensus_signal}")
        elif consensus_strength == "MODERATE":
            explanation_parts.append(f"⚖️ **Moderate Consensus**: {agreement_count}/{total_models} models ({agreement_percent}%) agree on {consensus_signal}")
        else:
            explanation_parts.append(f"🤔 **Weak Consensus**: Models disagree, using weighted confidence to decide {consensus_signal}")
        
        # Confidence explanation
        if weighted_confidence >= 70:
            confidence_desc = "high confidence"
        elif weighted_confidence >= 50:
            confidence_desc = "moderate confidence"
        else:
            confidence_desc = "low confidence"
        
        explanation_parts.append(f"📊 **Weighted Confidence**: {weighted_confidence:.1f}% ({confidence_desc})")
        
        # Individual model breakdown
        explanation_parts.append("🤖 **Model Breakdown**:")
        for model, signal in signals.items():
            conf = confidences.get(model, 0)
            explanation_parts.append(f"  • {model}: {signal} ({conf:.1f}% confidence)")
        
        # Decision recommendation
        if consensus_strength == "STRONG" and weighted_confidence >= 70:
            recommendation = "✅ **Strong Buy/Sell Signal** - High confidence with model agreement"
        elif consensus_strength == "MODERATE" and weighted_confidence >= 60:
            recommendation = "⚠️ **Consider Signal** - Moderate confidence with some agreement"
        else:
            recommendation = "❌ **Weak Signal** - Low confidence or significant disagreement"
        
        explanation_parts.append(f"💡 **Recommendation**: {recommendation}")
        
        return "\n".join(explanation_parts)
    
    def update_model_performance(self, model_name: str, predicted_signal: str, actual_signal: str):
        """Update model performance tracking for dynamic accuracy"""
        if model_name not in self.model_performance:
            return
        
        self.model_performance[model_name]["total"] += 1
        if predicted_signal == actual_signal:
            self.model_performance[model_name]["correct"] += 1
        
        # Update accuracy
        if self.model_performance[model_name]["total"] > 0:
            accuracy = (self.model_performance[model_name]["correct"] / 
                       self.model_performance[model_name]["total"]) * 100
            self.model_performance[model_name]["accuracy"] = round(accuracy, 2)
    
    def get_dynamic_accuracies(self) -> Dict[str, float]:
        """Get current dynamic accuracies for all models"""
        return {model: data["accuracy"] for model, data in self.model_performance.items()}
    
    def get_performance_summary(self) -> Dict:
        """Get detailed performance summary for all models"""
        summary = {}
        for model_name, data in self.model_performance.items():
            summary[model_name] = {
                "accuracy": data["accuracy"],
                "predictions_made": data["total"],
                "correct_predictions": data["correct"],
                "last_updated": datetime.now().isoformat()
            }
        return summary

# Global consensus service instance
consensus_service = ConsensusService()
