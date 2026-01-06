"""
Append-only event persistence with verification utilities.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable, List

from .events import Event


class EventStore:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.touch()

    def append(self, event: Event) -> None:
        """Append a new event; update/delete not supported."""
        with self.path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(event.to_record()) + "\n")

    def read_all(self) -> List[Event]:
        events: List[Event] = []
        with self.path.open("r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                data = json.loads(line)
                events.append(Event.from_record(data))
        return events

    def verify_append_only(self) -> bool:
        """There is no update/delete path; presence of duplicate IDs indicates an issue."""
        ids = set()
        with self.path.open("r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                data = json.loads(line)
                event_id = data.get("event_id")
                if event_id in ids:
                    return False
                ids.add(event_id)
        return True


def scan_for_violations(events: Iterable[Event]) -> List[str]:
    """
    Verify immutable, append-only properties and ordering constraints.
    Returns a list of human-readable violations; empty list means clean.
    """
    violations: List[str] = []
    seen_ids = set()
    last_timestamp_per_station = {}

    for event in events:
        if event.event_id in seen_ids:
            violations.append(f"duplicate event_id detected: {event.event_id}")
        seen_ids.add(event.event_id)

        last_ts = last_timestamp_per_station.get(event.station_id)
        if last_ts and event.timestamp <= last_ts:
            violations.append(
                f"non-increasing timestamp for station {event.station_id}: {event.timestamp.isoformat()}"
            )
        last_timestamp_per_station[event.station_id] = event.timestamp
    return violations
