import json
from datetime import datetime, timedelta

transcripts = []
for i in range(3):
    transcripts.append(
        {
            "callId": f"CALL-{i}",
            "timestamp": (datetime.utcnow() - timedelta(days=i)).isoformat(),
            "summary": "AI agent called demo shop and gathered workflow details.",
            "disposition": "follow_up",
        }
    )

print(json.dumps(transcripts, indent=2))
