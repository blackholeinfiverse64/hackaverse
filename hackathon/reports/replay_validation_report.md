# HackaVerse Replay Validation Report

| Field | Value |
|-------|-------|
| Status | **PASS** |
| Generated | 2026-09-28 10:23:46 UTC |
| Checks | 9/9 passed |

## Results

| Check | Result | Detail |
|-------|--------|--------|
| health_replay_1_contract | PASS | trace=hv-09bc9a91333e4dd7 |
| health_replay_2_contract | PASS | trace=hv-466cea3e451746dd |
| health_replay_3_contract | PASS | trace=hv-e0ffcfe4d334463b |
| health_schema_stable_across_replays | PASS | fingerprint={'data': 'object', 'error_code': 'null', 'message': 'string', 'success': 'bool', 'trace_id': 'string:hv-*', 'data.database': 'string', 'data.status': 'string', 'data.timestamp': 'string'} |
| health_trace_ids_unique_per_request | PASS | traces=['hv-09bc9a91333e4dd7', 'hv-466cea3e451746dd', 'hv-e0ffcfe4d334463b'] |
| trace_continuity_parent_child | PASS | parent=hv-09bc9a91333e4dd7 child=hv-16c8dcdc47604b96 |
| replay_store_accepts_first_request | PASS | Request replay_proof_128580416053776 is new and will be processed |
| replay_store_blocks_duplicate | PASS | Request replay_proof_128580416053776 was already processed |
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
