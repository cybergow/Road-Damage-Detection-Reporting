"""
RoadGuard AI – Flask application entry point.

Exposes:
- ``POST /api/detect`` – upload an image for road-damage detection
- ``GET  /health``      – health / readiness check
"""

import logging
import os
import tempfile
from typing import Any, Dict, Tuple

from flask import Flask, jsonify, request
from flask_cors import CORS

from services.detector import RoadDamageDetector

# ──────────────────────────────────────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Application factory
# ──────────────────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# Maximum upload size: 16 MB
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "bmp", "webp", "tiff"}

# ──────────────────────────────────────────────────────────────────────────────
# Load detector at startup
# ──────────────────────────────────────────────────────────────────────────────
logger.info("Initialising RoadDamageDetector …")
detector = RoadDamageDetector()
logger.info("Detector ready (model_loaded=%s).", detector.model_loaded)


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _allowed_file(filename: str) -> bool:
    """Return ``True`` if *filename* has a permitted image extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ──────────────────────────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────────────────────────

@app.route("/api/detect", methods=["POST"])
@app.route("/detect", methods=["POST"])
def detect() -> Tuple[Any, int]:
    """Accept an uploaded image and return detection results.

    **Request**: ``multipart/form-data`` with an ``image`` field.

    **Response** (200):
    ```json
    {
        "success": true,
        "data": {
            "detections": [...],
            "summary": {...},
            "processedImage": "data:image/jpeg;base64,...",
            "processingTime": 0.123
        }
    }
    ```
    """
    # --- validate presence of file --------------------------------------------
    if "image" not in request.files:
        return jsonify({
            "success": False,
            "error": "No image file provided. Use the 'image' form field.",
        }), 400

    file = request.files["image"]

    if file.filename is None or file.filename.strip() == "":
        return jsonify({
            "success": False,
            "error": "No file selected.",
        }), 400

    if not _allowed_file(file.filename):
        return jsonify({
            "success": False,
            "error": (
                f"File type not allowed. "
                f"Supported: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            ),
        }), 400

    # --- save to a temp file and run detection --------------------------------
    tmp_fd = None
    tmp_path: str = ""
    try:
        suffix = os.path.splitext(file.filename)[1] or ".jpg"
        tmp_fd, tmp_path = tempfile.mkstemp(suffix=suffix)
        file.save(tmp_path)

        results: Dict[str, Any] = detector.detect(tmp_path)
        results["success"] = True
        return jsonify(results), 200

    except ValueError as ve:
        logger.error("Detection value error: %s", ve)
        return jsonify({"success": False, "error": str(ve)}), 400

    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected error during detection.")
        return jsonify({
            "success": False,
            "error": f"Detection failed: {exc}",
        }), 500

    finally:
        # Clean up the temp file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.close(tmp_fd)  # type: ignore[arg-type]
            except OSError:
                pass
            os.unlink(tmp_path)


@app.route("/health", methods=["GET"])
def health() -> Tuple[Any, int]:
    """Health / readiness check.

    Returns:
        JSON with ``status``, ``modelLoaded``, and ``modelPath``.
    """
    return jsonify({
        "status": "healthy",
        "modelLoaded": detector.model_loaded,
        "modelPath": os.environ.get("YOLO_MODEL_PATH", "yolov8n.pt"),
        "service": "RoadGuard AI Detection Service",
        "version": "1.0.0",
    }), 200


# ──────────────────────────────────────────────────────────────────────────────
# Error handlers
# ──────────────────────────────────────────────────────────────────────────────

@app.errorhandler(400)
def bad_request(error: Any) -> Tuple[Any, int]:
    """Handle 400 Bad Request errors."""
    return jsonify({
        "success": False,
        "error": "Bad request.",
        "details": str(error),
    }), 400


@app.errorhandler(404)
def not_found(error: Any) -> Tuple[Any, int]:
    """Handle 404 Not Found errors."""
    return jsonify({
        "success": False,
        "error": "The requested resource was not found.",
    }), 404


@app.errorhandler(413)
def payload_too_large(error: Any) -> Tuple[Any, int]:
    """Handle 413 Payload Too Large errors."""
    return jsonify({
        "success": False,
        "error": "File too large. Maximum upload size is 16 MB.",
    }), 413


@app.errorhandler(500)
def internal_error(error: Any) -> Tuple[Any, int]:
    """Handle 500 Internal Server Error."""
    return jsonify({
        "success": False,
        "error": "An internal server error occurred.",
    }), 500


# ──────────────────────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    logger.info("Starting RoadGuard AI service on port %d …", port)
    app.run(host="0.0.0.0", port=port, debug=False)
