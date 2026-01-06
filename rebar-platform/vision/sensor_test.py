from datetime import datetime, timedelta, timezone

from .cut_sensor import CutSensor, CutSensorConfig, RegionOfInterest
from .events import CUT_EVENT_TYPE, create_cut_event
from .lease import LeaseEnforcer, LeaseSigner


def _frame(height: int = 120, width: int = 120, value: int = 0):
    return [[value for _ in range(width)] for _ in range(height)]


def _bar_frame(y_top: int, y_bottom: int, x_left: int = 20, x_right: int = 80):
    frame = _frame()
    for y in range(y_top, y_bottom):
        for x in range(x_left, x_right):
            frame[y][x] = 255
    return frame


def _build_sensor(persistence_ms=80, min_area_px=400, stabilization_ms=150):
    roi = RegionOfInterest(x=10, y=10, width=100, height=80)
    timestamps = []

    def timestamp_provider():
        base = datetime(2024, 1, 1, tzinfo=timezone.utc)
        offset_ms = 50 * len(timestamps)
        ts = base + timedelta(milliseconds=offset_ms)
        timestamps.append(ts)
        return ts

    sensor = CutSensor(
        CutSensorConfig(
            roi=roi,
            persistence_ms=persistence_ms,
            min_area_px=min_area_px,
            stabilization_ms=stabilization_ms,
        ),
        station_id="station-1",
        timestamp_provider=timestamp_provider,
    )
    return sensor, timestamps


def test_hand_motion_does_not_trigger_cut():
    sensor, _ = _build_sensor()
    for y in [15, 20, 25]:
        frame = _frame()
        for yy in range(y, y + 5):
            for xx in range(15, 20):
                frame[yy][xx] = 255
        assert sensor.process_frame(frame) is None


def test_bar_through_roi_triggers_single_cut():
    sensor, _ = _build_sensor()
    events = []
    for step in range(5):
        frame = _bar_frame(10 + step * 5, 30 + step * 5)
        event = sensor.process_frame(frame)
        if event:
            events.append(event)
    assert len(events) == 1
    assert events[0].event_type == CUT_EVENT_TYPE


def test_rapid_motion_not_double_counted():
    sensor, _ = _build_sensor(stabilization_ms=200)
    events = []
    for step in range(6):
        frame = _bar_frame(10 + step * 15, 40 + step * 15)
        event = sensor.process_frame(frame)
        if event:
            events.append(event)
    for _ in range(3):
        event = sensor.process_frame(_frame())
        if event:
            events.append(event)
    assert len(events) == 1


def test_offline_lease_expiration_blocks_events():
    signer = LeaseSigner(secret="secret")
    issued_at = datetime(2024, 1, 1, tzinfo=timezone.utc)
    lease = signer.sign("lease-1", issued_at, duration_hours=1)
    enforcer = LeaseEnforcer(lease, signer)
    expired_event = create_cut_event("station-1", confidence=0.9, timestamp=issued_at + timedelta(hours=2))
    assert enforcer.accept_event(expired_event) is False


def test_reconciliation_rejects_out_of_window_events():
    signer = LeaseSigner(secret="secret")
    issued_at = datetime(2024, 1, 1, tzinfo=timezone.utc)
    lease = signer.sign("lease-1", issued_at, duration_hours=1)
    enforcer = LeaseEnforcer(lease, signer)
    valid_event = create_cut_event("station-1", confidence=0.9, timestamp=issued_at + timedelta(minutes=10))
    late_event = create_cut_event("station-1", confidence=0.9, timestamp=issued_at + timedelta(hours=2))
    enforcer.buffered_events = [valid_event, late_event]
    accepted, rejected = enforcer.reconcile_buffered_events(online_timestamp=issued_at + timedelta(hours=3))
    assert valid_event in accepted
    assert late_event in rejected
    assert enforcer.buffered_events == []
