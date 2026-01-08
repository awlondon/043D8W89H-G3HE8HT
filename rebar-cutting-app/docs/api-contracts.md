# API Contracts

## Recognition Proxy

**Endpoint**: `POST /recognition/proxy`

**Description**: Proxies a tablet image payload to the AI recognition service when online.

### Request Body
```json
{
  "imageBase64": "string",
  "metadata": {
    "captureId": "string",
    "timestamp": "string"
  }
}
```

### Response Body
```json
{
  "detections": [
    {
      "id": "string",
      "lengthInches": 0,
      "confidence": 0
    }
  ]
}
```

### Error Responses
- `503` when `RECOGNITION_API_URL` is not configured.
- `4xx/5xx` forwarded from the upstream recognition API.

## Health Check

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "ok"
}
```
