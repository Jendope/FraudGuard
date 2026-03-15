# Toggle Implementation — Raw LLM vs LLM+RAG

## How the Toggle Works

The `/process` endpoint accepts an optional `mode` field in the
`multipart/form-data` request body.

```
mode = request.form.get("mode", DEFAULT_MODE)
```

- If `mode` is omitted, the server uses the `DEFAULT_MODE` environment variable
  (default: `"raw"`).
- Accepted values: `"raw"` or `"rag"`.

### Backend dispatch logic (from `backend/app.py`)

```python
mode = request.form.get("mode", DEFAULT_MODE).strip().lower()

if mode == "rag":
    # Chunk and embed the OCR text, retrieve top-k passages,
    # prepend them as context to the LLM prompt.
    rag = _get_rag_client()
    rag.index_documents([ocr_text])
    retrieved_passages, context = rag.build_context(query, top_k=RAG_TOP_K)
    full_prompt = f"Context:\n{context}\n\nOCR text:\n{ocr_text}\n\n..."
else:
    # Raw mode: send OCR text + optional prompt directly to LLM.
    full_prompt = f"Extracted text:\n{ocr_text}\n\n..."

llm_output = _get_llm_client().ask(full_prompt)
```

### Frontend toggle

The `ToggleMode` component holds the selected mode in React state:

```jsx
const [mode, setMode] = useState('raw');
// ...
<ToggleMode value={mode} onChange={setMode} />
```

When the form is submitted, `mode` is included in the `FormData`:

```js
formData.append('mode', mode);  // "raw" or "rag"
```

---

## Example Requests

### Raw LLM mode (curl)

```bash
curl -X POST http://localhost:5000/process \
  -F "file=@invoice.png" \
  -F "mode=raw" \
  -F "prompt=Summarise the key figures"
```

### LLM+RAG mode (curl)

```bash
curl -X POST http://localhost:5000/process \
  -F "file=@invoice.png" \
  -F "mode=rag" \
  -F "prompt=What is the total amount?"
```

### Using the default mode

Omitting `mode` uses `DEFAULT_MODE` (default: `"raw"`):

```bash
curl -X POST http://localhost:5000/process \
  -F "file=@invoice.png"
```

### Changing the default mode via environment variable

```bash
DEFAULT_MODE=rag python backend/app.py
```

---

## Response Shape

Both modes return the same JSON structure:

```json
{
  "mode":        "raw",
  "ocr_text":    "Invoice #42\nTotal: $100",
  "retrieved":   null,
  "llm_output":  "This invoice is for $100...",
  "provenance":  {
    "mode": "raw",
    "ocr_model": "zai-org/GLM-OCR"
  }
}
```

In RAG mode, `"retrieved"` is a list of passage strings instead of `null`.

---

## Error Responses

| Condition | HTTP status | `error` field |
|---|---|---|
| No `file` in request | 400 | `"No 'file' field in request"` |
| Empty uploaded file | 400 | `"Uploaded file is empty"` |
| Invalid mode value | 400 | `"Invalid mode '…'. Use 'raw' or 'rag'."` |
| OCR failure | 500 | `"OCR failed: …"` |
| LLM failure | 500 | `"LLM failed: …"` |
