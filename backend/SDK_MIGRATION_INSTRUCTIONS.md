# Google GenAI SDK Migration Instructions

## Overview
Migrate from `google-generativeai` to `google-genai` SDK to enable `thinking_budget=0` parameter for disabling thinking mode in Gemini 2.5 Flash.

## Step 1: Update Dependencies

**File: `requirements.txt`**
Replace line 22:
```
# OLD
google-generativeai==0.8.4

# NEW  
google-genai
```

Install new dependency:
```bash
pip uninstall google-generativeai
pip install google-genai
```

## Step 2: Update rag_core.py Imports

**File: `rag_core.py`**

Replace line 6:
```python
# OLD
import google.generativeai as genai

# NEW
from google import genai
from google.genai import types
```

## Step 3: Update _initialize_llm Method

**In rag_core.py, replace the entire `_initialize_llm` method (lines 81-90):**

```python
def _initialize_llm(self, model_name: str, llm_type: str) -> dict | None:
    """Initializes a Google Generative AI model client."""
    try:
        # Store model name and client info for later use
        model_config = {
            'client': self.client,
            'model_name': model_name
        }
        logger.info(f"Loaded {llm_type} LLM: {model_name}")
        return model_config
    except Exception as e:
        logger.error(f"Failed to initialize {llm_type} LLM ({model_name}): {e}. This functionality will be unavailable.", exc_info=True)
        return None
```

## Step 4: Update __init__ Method

**In rag_core.py, replace lines 47-61:**

```python
try:
    # Initialize the GenAI client
    self.client = genai.Client(api_key=GEMINI_API_KEY)
    logger.info("Google GenAI Client configured.")
except Exception as e:
    logger.error(f"CRITICAL: Failed to configure Google GenAI client: {e}", exc_info=True)
    raise

# Initialize Generator LLM (2.5 Flash)
self.generator_llm = self._initialize_llm(GEMINI_MODEL_NAME, "Generator")

# Initialize Evaluator LLM (Pro 1.5)
self.evaluator_llm = self._initialize_llm(EVALUATOR_LLM_MODEL_NAME, "Evaluator")
```

## Step 5: Update _call_llm Method

**In rag_core.py, replace the entire `_call_llm` method (lines 285-327):**

```python
def _call_llm(self, llm_config, prompt: str, description: str) -> tuple[str, float]:
    """Helper function to call an LLM, handle errors, and time the call."""
    logger.info(f"Sending prompt to {description} LLM ({llm_config['model_name'] if llm_config else 'N/A'})...")
    response_text = f"Error: Failed to generate {description} response."
    llm_call_duration = 0.0
    if llm_config is None:
        logger.error(f"{description} LLM is not available.")
        return f"Error: {description} LLM not initialized.", 0.0

    start_time = time.time()
    try:
        # Configure thinking budget for 2.5 models
        config = None
        if "2.5" in llm_config['model_name']:
            config = types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)  # Disable thinking
            )
        
        response_obj = llm_config['client'].models.generate_content(
            model=llm_config['model_name'],
            contents=prompt,
            config=config
        )

        # For checking of response object structure
        if hasattr(response_obj, 'prompt_feedback') and response_obj.prompt_feedback.block_reason:
             block_reason = response_obj.prompt_feedback.block_reason
             logger.warning(f"{description} LLM blocked prompt. Reason: {block_reason}")
             response_text = f"Error: Content generation blocked by safety settings ({block_reason})..."
        elif not response_obj.candidates:
             logger.warning(f"{description} LLM response had no candidates.")
             block_reason = getattr(getattr(response_obj, 'prompt_feedback', None), 'block_reason', None)
             response_text = f"Error: Content generation failed (no candidates){f', likely due to safety settings ({block_reason})' if block_reason else '.'}"
        else:
            try:
                # Access response text
                response_text = response_obj.text
                logger.info(f"{description} LLM response extracted successfully.")
            except (IndexError, AttributeError, TypeError) as e:
                 logger.error(f"Could not extract text from {description} LLM response structure: {e}", exc_info=True)
                 response_text = f"Error: Could not parse {description} LLM's response structure."
    except Exception as e:
        logger.error(f"Exception during {description} LLM call: {e}", exc_info=True)
        response_text = f"Error generating {description} response: {type(e).__name__}" 
    finally:
        end_time = time.time()
        llm_call_duration = end_time - start_time
        logger.info(f"LLM generate_content call duration ({description}): {llm_call_duration:.4f} seconds")

    return response_text, llm_call_duration
```

## Step 6: Remove Safety Settings (Optional)

**Since the new SDK handles safety differently, you can remove the SAFETY_SETTINGS_OFF constant (lines 28-31) or keep it for reference.**

## Step 7: Test Migration

1. **Stop the current server** (Ctrl+C)
2. **Install dependencies:**
   ```bash
   pip install google-genai
   pip uninstall google-generativeai
   ```
3. **Start server:**
   ```bash
   python3 app.py
   ```
4. **Test with thinking disabled:**
   ```bash
   curl -X POST http://localhost:5002/api/query \
     -H "Content-Type: application/json" \
     -d '{"query": "What were the major political events in 2015?"}' \
     -w "\nTime: %{time_total}s\n" -s | tail -1
   ```

## Expected Results

- **Gemini 2.5 Flash with thinking disabled** should achieve **< 5s response times**
- **Much faster than the 32.73s average** we saw with thinking enabled
- **Better performance than 1.5 Flash** (which averaged 9.30s)

## Key Changes Summary

1. ✅ **New SDK**: `google-genai` instead of `google-generativeai`
2. ✅ **Client-based**: Use `genai.Client()` instead of `genai.GenerativeModel()`
3. ✅ **Thinking control**: `thinking_budget=0` parameter available
4. ✅ **Simplified calls**: Direct `client.models.generate_content()` calls
5. ✅ **Better performance**: Optimized SDK + disabled thinking mode

The migration enables the core functionality we need: **disabling thinking mode in Gemini 2.5 Flash for dramatically improved performance**.