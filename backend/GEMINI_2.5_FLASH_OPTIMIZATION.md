# Gemini 2.5 Flash Performance Optimization

## Performance Benchmark Results

### Gemini 1.5 Flash (Current - Good Performance)
- Test 1: 8.15s
- Test 2: 12.75s  
- Test 3: 7.01s
- **Average: 9.30s**

### Gemini 2.5 Flash (With Thinking Enabled - SLOW)
- Test 1: 26.64s
- Test 2: 40.87s
- Test 3: 30.67s
- **Average: 32.73s** (252% slower!)

## Root Cause
Gemini 2.5 Flash has "thinking mode" enabled by default, causing massive slowdowns.

## Solution: Disable Thinking Mode

### Code Changes Required

**File: `backend/rag_core.py`**

In the `_call_llm` method, modify the `generate_content` call:

```python
# BEFORE:
response_obj = llm_instance.generate_content(
    prompt,
    safety_settings=SAFETY_SETTINGS_OFF
)

# AFTER:
response_obj = llm_instance.generate_content(
    prompt,
    safety_settings=SAFETY_SETTINGS_OFF,
    generation_config={
        "thinking_config": {
            "thinking_budget": 0  # Disables thinking for speed
        }
    }
)
```

### Expected Results
- Should be **faster than 1.5 Flash** (target: <9s average)
- Maintains 2.5 Flash quality improvements
- Google docs: "budget of 0 prioritizes speed and cost"

## Test Commands (After Changes)

Run these 3 tests to benchmark:

```bash
# Test 1
curl -X POST http://localhost:5002/api/query -H "Content-Type: application/json" -d '{"query": "What were the major political events in 2015?"}' -w "\nTime: %{time_total}s\n" -s | tail -1

# Wait 15s, then Test 2  
curl -X POST http://localhost:5002/api/query -H "Content-Type: application/json" -d '{"query": "What were the biggest economic challenges in 2015?"}' -w "\nTime: %{time_total}s\n" -s | tail -1

# Wait 15s, then Test 3
curl -X POST http://localhost:5002/api/query -H "Content-Type: application/json" -d '{"query": "What cultural events defined 2015?"}' -w "\nTime: %{time_total}s\n" -s | tail -1
```

**Target: All tests should be <9s (faster than 1.5 Flash baseline)**