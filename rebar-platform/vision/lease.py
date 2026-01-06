"""
Offline lease enforcement utilities.
"""
from __future__ import annotations

import hmac
import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from typing import Iterable, List, Tuple

from .events import Event


@dataclass(frozen=True)
class Lease:
    lease_id: str
    issued_at: datetime
    duration_hours: int
    token: str

    def expires_at(self) -> datetime:
        return self.issued_at + timedelta(hours=self.duration_hours)

    def is_valid_at(self, ts: datetime) -> bool:
        return ts <= self.expires_at()


class LeaseSigner:
    def __init__(self, secret: str):
        self.secret = secret.encode("utf-8")

    def sign(self, lease_id: str, issued_at: datetime, duration_hours: int) -> Lease:
        if duration_hours <= 0 or duration_hours > 100:
            raise ValueError("duration_hours must be between 1 and 100")
        payload = json.dumps({
            "lease_id": lease_id,
            "issued_at": issued_at.isoformat(),
            "duration_hours": duration_hours,
        }, sort_keys=True)
        signature = hmac.new(self.secret, payload.encode("utf-8"), sha256).hexdigest()
        return Lease(lease_id=lease_id, issued_at=issued_at, duration_hours=duration_hours, token=signature)

    def verify(self, lease: Lease) -> bool:
        expected = self.sign(lease.lease_id, lease.issued_at, lease.duration_hours)
        return hmac.compare_digest(expected.token, lease.token)


class LeaseEnforcer:
    def __init__(self, lease: Lease, signer: LeaseSigner):
        self.lease = lease
        self.signer = signer
        self.buffered_events: List[Event] = []

    def accept_event(self, event: Event) -> bool:
        if not self.signer.verify(self.lease):
            return False
        if not self.lease.is_valid_at(event.timestamp):
            return False
        self.buffered_events.append(event)
        return True

    def reconcile_buffered_events(self, online_timestamp: datetime) -> Tuple[List[Event], List[Event]]:
        """Return (accepted, rejected) events based on lease window and signature."""
        accepted: List[Event] = []
        rejected: List[Event] = []
        for event in self.buffered_events:
            if self.signer.verify(self.lease) and self.lease.is_valid_at(event.timestamp):
                accepted.append(event)
            else:
                rejected.append(event)
        # Clear buffer after reconciliation
        self.buffered_events = []
        return accepted, rejected
