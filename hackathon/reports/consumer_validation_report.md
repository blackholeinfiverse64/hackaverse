# HackaVerse Consumer Validation Report

| Field | Value |
|-------|-------|
| Status | **PASS** |
| Generated | 2026-05-27 08:06:14 UTC |
| Checks | 7/7 passed |

## Results

| Check | Result | Detail |
|-------|--------|--------|
| contract_file_loaded | PASS | api_response_contract.json |
| health_poll | PASS | APIResponse valid |
| versioned_system_health | PASS | contract OK |
| trace_lineage_chain | PASS | chain root=hv-940e48e14e83425a |
| auth_error_contract | PASS | error_code=AUTH_INVALID_TOKEN |
| webhook_subscribe_contract | PASS | HTTP 503 |
| deterministic_response_structure | PASS | success/data types stable; trace_id present each call |

## Log excerpt

```
[CONSUMER] health_poll HTTP 200 trace=hv-940e48e14e83425a
[CONSUMER] system_health HTTP 200
[CONSUMER] auth_me HTTP 401 error_code=AUTH_INVALID_TOKEN
[CONSUMER] webhook_subscribe HTTP 503
```

## Deterministic guarantees verified

- APIResponse envelope (`success`, `message`, `data`, `trace_id`, `error_code`)
- `trace_id` matches `X-Request-Id` response header
- Replay-safe structure stable across identical read requests
