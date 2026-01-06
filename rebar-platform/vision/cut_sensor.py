"""
Deterministic CUT sensor using OpenCV ROI differencing.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional

from .events import create_cut_event, Event
from . import opencv_adapter as cv2


@dataclass
class RegionOfInterest:
    x: int
    y: int
    width: int
    height: int

    @property
    def slice(self) -> tuple:
        return (slice(self.y, self.y + self.height), slice(self.x, self.x + self.width))


@dataclass
class CutSensorConfig:
    roi: RegionOfInterest
    persistence_ms: int
    min_area_px: int
    stabilization_ms: int
    direction: str = "down"  # only single direction supported


class CutSensor:
    def __init__(self, config: CutSensorConfig, station_id: str, timestamp_provider=lambda: datetime.now(timezone.utc)):
        self.config = config
        self.station_id = station_id
        self.timestamp_provider = timestamp_provider
        self._last_event_time: Optional[datetime] = None
        self._motion_start: Optional[datetime] = None
        self._last_centroid_y: Optional[float] = None
        self._background: Optional[list[list[float]]] = None

    def _extract_roi(self, frame):
        y_slice, x_slice = self.config.roi.slice
        return [row[x_slice] for row in frame[y_slice]]

    def _detect_motion(self, roi) -> tuple[bool, float, float]:
        if self._background is None:
            self._background = [[float(v) for v in row] for row in roi]
            return False, 0.0, 0.0

        frame_delta = cv2.absdiff(cv2.convert_scale_abs(self._background), roi)
        _, thresh = cv2.threshold(frame_delta, 25, 255, cv2.THRESH_BINARY)
        thresh = cv2.dilate(thresh, None, iterations=2)
        contours, _ = cv2.find_contours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        max_area = 0.0
        centroid_y = 0.0
        for cnt in contours:
            area = cv2.contour_area(cnt)
            if area > max_area:
                max_area = area
                moments = cv2.moments(cnt)
                if moments["m00"]:
                    centroid_y = moments["m01"] / moments["m00"]

        if max_area == 0.0:
            return False, 0.0, 0.0

        # Update running background to stabilize after events
        cv2.accumulate_weighted([[float(v) for v in row] for row in roi], self._background, 0.05)
        return True, max_area, centroid_y

    def _reset_after_event(self):
        self._motion_start = None
        self._last_centroid_y = None
        self._last_event_time = self.timestamp_provider()

    def process_frame(self, frame) -> Optional[Event]:
        now = self.timestamp_provider()
        roi_frame = self._extract_roi(frame)
        motion_detected, area, centroid_y = self._detect_motion(roi_frame)

        if self._last_event_time:
            if now - self._last_event_time < timedelta(milliseconds=self.config.stabilization_ms):
                return None

        if not motion_detected or area < self.config.min_area_px:
            self._motion_start = None
            self._last_centroid_y = None
            return None

        if self._motion_start is None:
            self._motion_start = now
            self._last_centroid_y = centroid_y
            return None

        # Ensure consistent direction
        if self.config.direction == "down" and centroid_y < (self._last_centroid_y or centroid_y):
            self._motion_start = None
            self._last_centroid_y = centroid_y
            return None

        self._last_centroid_y = centroid_y

        if now - self._motion_start >= timedelta(milliseconds=self.config.persistence_ms):
            confidence = min(1.0, area / max(self.config.min_area_px, 1))
            event = create_cut_event(self.station_id, confidence=confidence, timestamp=now)
            self._reset_after_event()
            return event

        return None
