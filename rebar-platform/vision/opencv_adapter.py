"""
Minimal OpenCV-like operations with pure Python fallbacks.
When real OpenCV is available it is used; otherwise deterministic list-based implementations run.
"""
from __future__ import annotations

try:  # pragma: no cover - prefer real OpenCV when available
    import cv2 as _cv2
except Exception:  # pragma: no cover
    _cv2 = None

from typing import List, Tuple

RETR_EXTERNAL = 0
CHAIN_APPROX_SIMPLE = 2
THRESH_BINARY = 0

Frame = List[List[int]]  # 2D grayscale frame values 0-255


def absdiff(a: Frame, b: Frame) -> Frame:
    if _cv2:
        import numpy as np

        return _cv2.absdiff(np.array(a, dtype="uint8"), np.array(b, dtype="uint8")).tolist()
    return [[abs(int(ai) - int(bi)) for ai, bi in zip(ar, br)] for ar, br in zip(a, b)]


def convert_scale_abs(arr: Frame) -> Frame:
    if _cv2:
        import numpy as np

        return _cv2.convertScaleAbs(np.array(arr)).tolist()
    return [[abs(int(v)) for v in row] for row in arr]


def threshold(src: Frame, thresh: float, maxval: float, method: int):
    if _cv2:
        import numpy as np

        _, dst = _cv2.threshold(np.array(src, dtype="uint8"), thresh, maxval, method)
        return _, dst.tolist()
    dst = [[int(maxval if v > thresh else 0) for v in row] for row in src]
    return thresh, dst


def dilate(src: Frame, kernel=None, iterations: int = 1) -> Frame:
    if _cv2:
        import numpy as np

        return _cv2.dilate(np.array(src, dtype="uint8"), kernel, iterations=iterations).tolist()
    data = src
    for _ in range(iterations):
        height = len(data)
        width = len(data[0]) if height else 0
        padded = [[data[min(max(y - 1, 0), height - 1)][min(max(x - 1, 0), width - 1)] for x in range(width + 2)]
                  for y in range(height + 2)]
        result: Frame = []
        for y in range(1, height + 1):
            row: List[int] = []
            for x in range(1, width + 1):
                window = [padded[y + dy][x + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1)]
                row.append(max(window))
            result.append(row)
        data = result
    return data


def _connected_components(binary: Frame):
    height = len(binary)
    width = len(binary[0]) if height else 0
    visited = [[False for _ in range(width)] for _ in range(height)]
    contours = []
    for y in range(height):
        for x in range(width):
            if binary[y][x] == 0 or visited[y][x]:
                continue
            stack = [(x, y)]
            component = []
            visited[y][x] = True
            while stack:
                cx, cy = stack.pop()
                component.append((cx, cy))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < width and 0 <= ny < height and not visited[ny][nx] and binary[ny][nx] != 0:
                            visited[ny][nx] = True
                            stack.append((nx, ny))
            contours.append(component)
    return contours


def find_contours(src: Frame, mode=RETR_EXTERNAL, method=CHAIN_APPROX_SIMPLE):
    if _cv2:
        import numpy as np

        contours, hierarchy = _cv2.findContours(np.array(src, dtype="uint8"), mode, method)
        return contours, hierarchy
    contours = _connected_components(src)
    return contours, None


def contour_area(contour) -> float:
    if _cv2:
        return _cv2.contourArea(contour)
    return float(len(contour))


def moments(contour):
    if _cv2:
        return _cv2.moments(contour)
    if not contour:
        return {"m00": 0.0, "m10": 0.0, "m01": 0.0}
    xs = [pt[0] for pt in contour]
    ys = [pt[1] for pt in contour]
    area = float(len(contour))
    return {"m00": area, "m10": float(sum(xs)), "m01": float(sum(ys))}


def accumulate_weighted(src: Frame, dst: Frame, alpha: float) -> None:
    if _cv2:
        import numpy as np

        _cv2.accumulateWeighted(np.array(src, dtype="float32"), np.array(dst, dtype="float32"), alpha)
        return
    for y, row in enumerate(src):
        for x, value in enumerate(row):
            dst[y][x] = dst[y][x] * (1.0 - alpha) + value * alpha
