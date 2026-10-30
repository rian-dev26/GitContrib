"""ML prediction engine."""

import sys
from pathlib import Path
import logging

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

logger = logging.getLogger(__name__)


class MLPredictor:
    """Load and run ML models."""

    def __init__(self, models_dir: Path = None):
        self.models_dir = self._resolve_models_dir(models_dir)
        self.models_loaded = False
        self.scaler = None
        self.kmeans = None
        self.classifier = None
        self.load_models()

    def _resolve_models_dir(self, custom_dir: Path = None) -> Path:
        """Find the models directory across possible locations."""
        if custom_dir and Path(custom_dir).exists():
            return Path(custom_dir)

        # Check common locations
        candidates = [
            Path(__file__).resolve().parent.parent.parent / "models" / "artifacts",
            Path(__file__).resolve().parent.parent / "models" / "artifacts",
            Path.cwd() / "models" / "artifacts",
            Path.cwd() / "backend" / "models" / "artifacts",
        ]

        for candidate in candidates:
            if candidate.exists() and (candidate / "commit_type_classifier.joblib").exists():
                return candidate

        return candidates[0]

    def load_models(self):
        try:
            import joblib
            scaler_path = self.models_dir / "contributor_scaler.joblib"
            kmeans_path = self.models_dir / "contributor_kmeans.joblib"
            classifier_path = self.models_dir / "commit_type_classifier.joblib"

            if scaler_path.exists() and kmeans_path.exists() and classifier_path.exists():
                self.scaler = joblib.load(scaler_path)
                self.kmeans = joblib.load(kmeans_path)
                self.classifier = joblib.load(classifier_path)
                self.models_loaded = True
                logger.info(f"Models successfully loaded from {self.models_dir}")
            else:
                logger.warning(
                    f"Model artifacts not found in {self.models_dir}. "
                    "Inference will use rule-based conventional commit classification."
                )
                self.models_loaded = False
        except Exception as e:
            logger.warning(f"Error loading models: {e}")
            self.models_loaded = False


_predictor = None


def get_predictor() -> MLPredictor:
    global _predictor
    if _predictor is None:
        _predictor = MLPredictor()
    return _predictor
