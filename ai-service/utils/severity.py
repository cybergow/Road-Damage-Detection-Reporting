"""
Severity classification utilities for road damage detections.

Provides functions to classify individual detection severity and
calculate overall severity for a set of detections.
"""

from typing import Dict, List, Any


def classify_severity(
    detection: Dict[str, Any],
    image_width: int = 640,
    image_height: int = 640,
) -> str:
    """Classify the severity of a single road damage detection.

    Severity is determined by a combination of the bounding-box area ratio
    (relative to the full image) and the model confidence score.

    Args:
        detection: A detection dictionary containing at least:
            - ``bbox`` (list[float]): ``[x, y, width, height]``
            - ``confidence`` (float): detection confidence in ``[0, 1]``
        image_width: Width of the source image in pixels.
        image_height: Height of the source image in pixels.

    Returns:
        One of ``"high"``, ``"medium"``, or ``"low"``.
    """
    bbox = detection.get("bbox", [0, 0, 0, 0])
    confidence = detection.get("confidence", 0.0)

    # --- area ratio -----------------------------------------------------------
    bbox_area = max(float(bbox[2]), 0.0) * max(float(bbox[3]), 0.0)
    image_area = max(image_width * image_height, 1)  # avoid division by zero
    area_ratio = bbox_area / image_area

    # --- classification rules -------------------------------------------------
    if area_ratio > 0.15 or confidence > 0.85:
        return "high"
    if area_ratio > 0.05 or confidence > 0.6:
        return "medium"
    return "low"


def calculate_overall_severity(detections: List[Dict[str, Any]]) -> str:
    """Calculate the overall severity given a list of detections.

    Aggregation rules:
    * If **any** detection is ``"high"`` → overall ``"high"``
    * If **two or more** detections are ``"medium"`` → overall ``"high"``
    * If **any** detection is ``"medium"`` → overall ``"medium"``
    * Otherwise → ``"low"``

    Args:
        detections: List of detection dicts, each expected to have a
            ``severity`` key produced by :func:`classify_severity`.

    Returns:
        One of ``"high"``, ``"medium"``, or ``"low"``.
    """
    if not detections:
        return "low"

    severities = [d.get("severity", "low") for d in detections]

    if "high" in severities:
        return "high"

    medium_count = severities.count("medium")
    if medium_count >= 2:
        return "high"
    if medium_count >= 1:
        return "medium"

    return "low"
