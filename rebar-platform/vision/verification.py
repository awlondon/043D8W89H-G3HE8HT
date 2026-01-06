"""
Utility to verify append-only event storage and ordering constraints.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from .persistence import EventStore, scan_for_violations


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify event log for append-only compliance")
    parser.add_argument("--path", required=True, help="Path to JSONL event store")
    args = parser.parse_args()

    store = EventStore(Path(args.path))
    events = store.read_all()
    violations = scan_for_violations(events)
    if violations:
        for v in violations:
            print(v)
        return 1
    print("No violations detected")
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
