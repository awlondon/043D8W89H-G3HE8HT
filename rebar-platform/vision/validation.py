"""
Validation guardrails for event streams.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Dict, List

from .events import Event


@dataclass
class ValidationState:
    last_timestamp_per_station: Dict[str, datetime] = field(default_factory=dict)


class EventValidator:
    def __init__(self, max_clock_skew_seconds: int = 5):
        self.state = ValidationState()
        self.max_clock_skew = timedelta(seconds=max_clock_skew_seconds)

    def validate(self, event: Event, now: datetime | None = None) -> List[str]:
        problems: List[str] = []
        now = now or datetime.now(timezone.utc)

        last_ts = self.state.last_timestamp_per_station.get(event.station_id)
        if last_ts and event.timestamp <= last_ts:
            problems.append(
                f"non-increasing timestamp for station {event.station_id}: {event.timestamp.isoformat()}"
            )

        if abs(now - event.timestamp) > self.max_clock_skew:
            problems.append(
                f"clock drift exceeded ({abs(now - event.timestamp).total_seconds()}s) for station {event.station_id}"
            )

        self.state.last_timestamp_per_station[event.station_id] = event.timestamp
        return problems
