"""
Image preprocessing utilities for the RoadGuard AI detection pipeline.

Handles resizing, contrast enhancement (CLAHE), optional denoising,
and feature extraction used by the mock-detection fallback.
"""

from typing import Dict, Tuple

import cv2
import numpy as np


def preprocess_image(
    image: np.ndarray,
    max_size: int = 640,
    denoise: bool = False,
) -> np.ndarray:
    """Preprocess an image for YOLO inference.

    Steps:
    1. Resize to fit within ``max_size × max_size`` while preserving the
       aspect ratio.
    2. Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) on the
       L-channel of the LAB colour space to improve local contrast.
    3. Optionally apply fast non-local-means denoising.

    Args:
        image: BGR image as a NumPy array (OpenCV format).
        max_size: Maximum dimension (width or height) after resizing.
        denoise: If ``True``, run ``cv2.fastNlMeansDenoisingColored``.

    Returns:
        The preprocessed BGR image as a NumPy array.
    """
    if image is None or image.size == 0:
        raise ValueError("preprocess_image received an empty or None image.")

    # --- resize ---------------------------------------------------------------
    image = _resize_keeping_aspect(image, max_size)

    # --- CLAHE on L-channel ---------------------------------------------------
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_channel = clahe.apply(l_channel)

    lab = cv2.merge([l_channel, a_channel, b_channel])
    image = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    # --- optional denoising ---------------------------------------------------
    if denoise:
        image = cv2.fastNlMeansDenoisingColored(
            image, None, h=10, hForColoredComponents=10, templateWindowSize=7, searchWindowSize=21
        )

    return image


def extract_image_features(image: np.ndarray) -> Dict[str, float]:
    """Extract simple statistical features from an image.

    These features are consumed by the mock/simulated detection fallback
    in :class:`services.detector.RoadDamageDetector` to generate realistic
    bounding boxes.

    Args:
        image: BGR image as a NumPy array.

    Returns:
        Dictionary with keys:
        - ``brightness``: mean pixel intensity (0–255).
        - ``texture_variance``: variance of the Laplacian (higher → more
          texture / detail).
        - ``edge_density``: fraction of edge pixels detected by Canny
          (0.0–1.0).
    """
    if image is None or image.size == 0:
        return {"brightness": 128.0, "texture_variance": 100.0, "edge_density": 0.1}

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # brightness
    brightness = float(np.mean(gray))

    # texture variance (Laplacian)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    texture_variance = float(np.var(laplacian))

    # edge density (Canny)
    edges = cv2.Canny(gray, 50, 150)
    total_pixels = max(gray.shape[0] * gray.shape[1], 1)
    edge_density = float(np.count_nonzero(edges)) / total_pixels

    return {
        "brightness": brightness,
        "texture_variance": texture_variance,
        "edge_density": edge_density,
    }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _resize_keeping_aspect(image: np.ndarray, max_size: int) -> np.ndarray:
    """Resize *image* so the longest side equals *max_size*."""
    h, w = image.shape[:2]
    if max(h, w) <= max_size:
        return image

    scale = max_size / max(h, w)
    new_w = int(w * scale)
    new_h = int(h * scale)
    return cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
