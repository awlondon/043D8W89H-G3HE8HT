"""
Event contract definitions for CUT and BEND events.
Events are immutable, append-only records emitted by the vision layer.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict
import uuid

CUT_EVENT_TYPE = "CUT"
BEND_EVENT_TYPE = "BEND"  # Stub only; emitted by vision when implemented


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _validate_confidence(confidence: float) -> float:
    if not 0.0 <= confidence <= 1.0:
        raise ValueError("confidence must be between 0 and 1 inclusive")
    return confidence


@dataclass(frozen=True)
class Event:
    event_id: str
    timestamp: datetime
    station_id: str
    event_type: str
    confidence: float = field(metadata={"range": (0.0, 1.0)})

    def __post_init__(self) -> None:
        _validate_confidence(self.confidence)
        if not self.station_id:
            raise ValueError("station_id is required")
        if self.event_type not in {CUT_EVENT_TYPE, BEND_EVENT_TYPE}:
            raise ValueError("invalid event_type")

    def to_record(self) -> Dict[str, str]:
        return {
            "event_id": self.event_id,
            "timestamp": self.timestamp.isoformat(),
            "station_id": self.station_id,
            "event_type": self.event_type,
            "confidence": self.confidence,
        }

    @staticmethod
    def from_record(data: Dict[str, str]) -> "Event":
        return Event(
            event_id=data["event_id"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            station_id=data["station_id"],
            event_type=data["event_type"],
            confidence=data["confidence"],
        )


def create_cut_event(station_id: str, confidence: float, timestamp: datetime | None = None) -> Event:
    return Event(
        event_id=str(uuid.uuid4()),
        timestamp=timestamp or _utcnow(),
        station_id=station_id,
        event_type=CUT_EVENT_TYPE,
        confidence=_validate_confidence(confidence),
    )


def create_bend_event(station_id: str, confidence: float, timestamp: datetime | None = None) -> Event:
    # Stub only for future implementation
    return Event(
        event_id=str(uuid.uuid4()),
        timestamp=timestamp or _utcnow(),
        station_id=station_id,
        event_type=BEND_EVENT_TYPE,
        confidence=_validate_confidence(confidence),
    )
