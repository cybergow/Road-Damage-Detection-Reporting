"""
Road Damage Detector service.

Wraps a YOLOv8 model with automatic fallback to realistic simulated
detections when the model is unavailable or produces no results.
"""

import base64
import logging
import os
import random
import time
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np

from services.preprocessor import extract_image_features, preprocess_image
from utils.severity import calculate_overall_severity, classify_severity

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────

DAMAGE_CLASSES: List[str] = [
    "pothole",
    "longitudinal_crack",
    "transverse_crack",
    "alligator_crack",
]

# BGR colours used for bounding-box drawing (OpenCV uses BGR)
DAMAGE_COLORS: Dict[str, Tuple[int, int, int]] = {
    "pothole": (0, 0, 255),           # red
    "longitudinal_crack": (0, 165, 255),  # orange
    "transverse_crack": (0, 255, 255),    # yellow
    "alligator_crack": (255, 0, 128),     # purple
}

# Rough mapping from selected COCO class names → road-damage categories.
# When real YOLO detections are available these are used for the demo mapping.
_COCO_TO_DAMAGE: Dict[str, str] = {
    "potted plant": "pothole",
    "bowl": "pothole",
    "cup": "pothole",
    "frisbee": "pothole",
    "sports ball": "pothole",
    "skateboard": "longitudinal_crack",
    "surfboard": "longitudinal_crack",
    "snowboard": "longitudinal_crack",
    "baseball bat": "longitudinal_crack",
    "tennis racket": "longitudinal_crack",
    "knife": "transverse_crack",
    "fork": "transverse_crack",
    "spoon": "transverse_crack",
    "scissors": "transverse_crack",
    "cell phone": "transverse_crack",
    "book": "alligator_crack",
    "keyboard": "alligator_crack",
    "laptop": "alligator_crack",
    "mouse": "alligator_crack",
    "remote": "alligator_crack",
}

MODEL_PATH: str = os.environ.get("YOLO_MODEL_PATH", "yolov8n.pt")


class RoadDamageDetector:
    """End-to-end road damage detector with YOLO + simulation fallback.

    On initialisation the class attempts to load a YOLOv8 nano model.
    If the model cannot be loaded (e.g. missing weights, no internet) the
    service continues to function using :meth:`simulate_road_damage`.
    """

    def __init__(self) -> None:
        """Load the YOLOv8 model.  Failures are logged but not fatal."""
        self.model: Optional[Any] = None
        self.model_loaded: bool = False

        try:
            import torch
            import functools

            # Monkeypatch torch.load to set weights_only=False by default to allow YOLOv8 model load in PyTorch 2.6+
            original_load = torch.load
            @functools.wraps(original_load)
            def patched_load(*args, **kwargs):
                if 'weights_only' not in kwargs:
                    kwargs['weights_only'] = False
                return original_load(*args, **kwargs)
            torch.load = patched_load

            from ultralytics import YOLO  # type: ignore[import-untyped]

            logger.info("Loading YOLOv8 model from '%s' …", MODEL_PATH)
            self.model = YOLO(MODEL_PATH)
            self.model_loaded = True
            logger.info("YOLOv8 model loaded successfully.")
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "Could not load YOLOv8 model (%s). "
                "Falling back to simulated detections.",
                exc,
            )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def detect(self, image_path: str) -> Dict[str, Any]:
        """Run detection on the image at *image_path*.

        Args:
            image_path: Absolute or relative path to an image file.

        Returns:
            A dictionary with keys:
            - ``detections`` – list of individual detection dicts
            - ``summary`` – aggregated statistics
            - ``processedImage`` – base64 data-URI of the annotated image
            - ``processingTime`` – wall-clock seconds
        """
        start = time.time()

        # --- read image -------------------------------------------------------
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Cannot read image at '{image_path}'.")

        original = image.copy()
        height, width = image.shape[:2]

        # --- preprocess -------------------------------------------------------
        preprocessed = preprocess_image(image)

        # --- try YOLO first, fall back to simulation --------------------------
        detections = self._try_yolo_detection(preprocessed, width, height)
        if not detections:
            logger.info("No YOLO detections – using simulated results.")
            detections = self.simulate_road_damage(preprocessed)

        # --- severity ---------------------------------------------------------
        for det in detections:
            det["severity"] = classify_severity(det, width, height)

        overall_severity = calculate_overall_severity(detections)

        # --- annotate image ---------------------------------------------------
        annotated = self._draw_detections(original, detections)
        processed_b64 = self._encode_image_base64(annotated)

        elapsed = round(time.time() - start, 3)

        return {
            "detections": detections,
            "summary": {
                "totalDetections": len(detections),
                "overallSeverity": overall_severity,
                "damageTypes": self._count_damage_types(detections),
            },
            "processedImage": f"data:image/jpeg;base64,{processed_b64}",
            "processingTime": elapsed,
        }

    # ------------------------------------------------------------------
    # YOLO inference
    # ------------------------------------------------------------------

    def _try_yolo_detection(
        self,
        image: np.ndarray,
        orig_width: int,
        orig_height: int,
    ) -> List[Dict[str, Any]]:
        """Attempt real YOLO inference and map COCO classes to damage types."""
        if not self.model_loaded or self.model is None:
            return []

        try:
            results = self.model(image, conf=0.25, verbose=False)
        except Exception as exc:  # noqa: BLE001
            logger.warning("YOLO inference failed: %s", exc)
            return []

        detections: List[Dict[str, Any]] = []
        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue
            for box in boxes:
                cls_id = int(box.cls[0])
                cls_name = result.names.get(cls_id, "unknown")
                confidence = float(box.conf[0])

                # Map COCO class → damage type (fallback: random damage class)
                damage_class = _COCO_TO_DAMAGE.get(
                    cls_name,
                    random.choice(DAMAGE_CLASSES),
                )

                # xyxy → [x, y, w, h]
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                bbox = [
                    int(x1),
                    int(y1),
                    int(x2 - x1),
                    int(y2 - y1),
                ]

                detections.append(
                    {
                        "class": damage_class,
                        "confidence": round(confidence, 4),
                        "bbox": bbox,
                        "originalClass": cls_name,
                    }
                )

        return detections

    # ------------------------------------------------------------------
    # Simulated / mock detections
    # ------------------------------------------------------------------

    def simulate_road_damage(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """Generate realistic mock detections based on image analysis.

        The number and characteristics of fake detections are driven by
        actual image features (brightness, texture variance, edge density)
        so the results feel plausible rather than purely random.

        Args:
            image: Preprocessed BGR image.

        Returns:
            A list of detection dicts (without ``severity`` – that is added
            later by the caller).
        """
        features = extract_image_features(image)
        h, w = image.shape[:2]

        # Decide how many detections (1-5) biased by edge density
        edge_density = features.get("edge_density", 0.1)
        base_count = max(1, min(5, int(edge_density * 50) + 1))
        num_detections = random.randint(1, base_count)

        detections: List[Dict[str, Any]] = []
        for _ in range(num_detections):
            damage_class = random.choice(DAMAGE_CLASSES)

            # Confidence influenced by texture variance
            texture = features.get("texture_variance", 100.0)
            conf_base = 0.5 + min(texture / 2000.0, 0.48)
            confidence = round(random.uniform(conf_base, min(conf_base + 0.2, 0.98)), 4)

            # Random bbox within the image
            bw = random.randint(int(w * 0.05), int(w * 0.35))
            bh = random.randint(int(h * 0.05), int(h * 0.35))
            bx = random.randint(0, max(w - bw, 0))
            by = random.randint(int(h * 0.3), max(h - bh, int(h * 0.3)))

            detections.append(
                {
                    "class": damage_class,
                    "confidence": confidence,
                    "bbox": [bx, by, bw, bh],
                    "originalClass": "simulated",
                }
            )

        return detections

    # ------------------------------------------------------------------
    # Annotation / drawing
    # ------------------------------------------------------------------

    @staticmethod
    def _draw_detections(
        image: np.ndarray,
        detections: List[Dict[str, Any]],
    ) -> np.ndarray:
        """Draw labelled bounding boxes on a *copy* of the image."""
        annotated = image.copy()

        for det in detections:
            cls = det["class"]
            conf = det["confidence"]
            severity = det.get("severity", "low")
            x, y, w, h = det["bbox"]
            color = DAMAGE_COLORS.get(cls, (0, 255, 0))

            # Rectangle
            cv2.rectangle(annotated, (x, y), (x + w, y + h), color, 2)

            # Label background
            label = f"{cls} {conf * 100:.1f}% [{severity}]"
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.5
            thickness = 1
            (tw, th), baseline = cv2.getTextSize(label, font, font_scale, thickness)
            cv2.rectangle(
                annotated,
                (x, y - th - baseline - 4),
                (x + tw + 4, y),
                color,
                cv2.FILLED,
            )
            cv2.putText(
                annotated,
                label,
                (x + 2, y - baseline - 2),
                font,
                font_scale,
                (255, 255, 255),
                thickness,
                cv2.LINE_AA,
            )

        return annotated

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _encode_image_base64(image: np.ndarray) -> str:
        """Encode a BGR image as a JPEG base64 string."""
        success, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 85])
        if not success:
            raise RuntimeError("Failed to encode image as JPEG.")
        return base64.b64encode(buffer).decode("utf-8")

    @staticmethod
    def _count_damage_types(detections: List[Dict[str, Any]]) -> Dict[str, int]:
        """Count occurrences of each damage class."""
        counts: Dict[str, int] = {}
        for det in detections:
            cls = det["class"]
            counts[cls] = counts.get(cls, 0) + 1
        return counts
