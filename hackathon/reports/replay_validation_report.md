# HackaVerse Replay Validation Report

| Field | Value |
|-------|-------|
| Status | **PASS** |
| Generated | 2026-05-27 08:06:11 UTC |
| Checks | 9/9 passed |

## Results

| Check | Result | Detail |
|-------|--------|--------|
| health_replay_1_contract | PASS | trace=hv-b6c9fcc2e5894545 |
| health_replay_2_contract | PASS | trace=hv-b11e505966534a53 |
| health_replay_3_contract | PASS | trace=hv-f3b1d02263734b64 |
| health_schema_stable_across_replays | PASS | fingerprint={'data': 'object', 'error_code': 'null', 'message': 'string', 'success': 'bool', 'trace_id': 'string:hv-*', 'data.database': 'string', 'data.status': 'string', 'data.timestamp': 'string'} |
| health_trace_ids_unique_per_request | PASS | traces=['hv-b6c9fcc2e5894545', 'hv-b11e505966534a53', 'hv-f3b1d02263734b64'] |
| trace_continuity_parent_child | PASS | parent=hv-b6c9fcc2e5894545 child=hv-a4c4c540ef71431d |
| replay_store_accepts_first_request | PASS | Request replay_proof_2236619931792 is new and will be processed |
| replay_store_blocks_duplicate | PASS | Request replay_proof_2236619931792 was already processed |
| error_envelope_contract | PASS | error_code=AUTH_INVALID_TOKEN |

## Log excerpt

```
[REPLAY] GET /health attempt 1 -> HTTP 200
[REPLAY] GET /health attempt 2 -> HTTP 200
[REPLAY] GET /health attempt 3 -> HTTP 200
[REPLAY] check_replay first=True second=False
```

## Deterministic guarantees verified

- APIResponse envelope (`success`, `message`, `data`, `trace_id`, `error_code`)
- `trace_id` matches `X-Request-Id` response header
- Replay-safe structure stable across identical read requests
