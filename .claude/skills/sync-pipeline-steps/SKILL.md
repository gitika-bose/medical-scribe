# Skill: sync-pipeline-steps

**Trigger**: User asks to update, add, rename, or reorder pipeline steps in the simplify tool — or the UI progress tracker is out of sync with the backend SSE pipeline.

---

## The Two Source-of-Truth Locations

| What | File | Symbol |
|------|------|--------|
| Backend step registry | `backend/backend-processing/routes/simplify.py` | `STEPS` dict (~line 34) |
| Frontend step definitions | `frontend/simplify/src/App.tsx` | `INITIAL_STEPS` array (~line 33) |

Always edit **both** files together. The `id` integer is what the SSE event matches on — it must be consistent across both files.

---

## Current Step Mapping (as of April 2026)

| ID | Backend label | Frontend label | Frontend description |
|----|---------------|----------------|----------------------|
| 1 | `Reading your document` | `Reading your document` | Extracting text from your file |
| 2 | `Simplifying language` | `Simplifying language` | Rewriting to a 6th-grade reading level |
| 3 | `Adding explanations for medical terms` | `Adding term explanations` | Defining medical jargon in plain language |
| 4 | `Clarifying numbers and actions` | `Clarifying numbers and actions` | Converting medical shorthand and emphasising what to do |
| 5 | `Organizing for clarity` | `Organizing for clarity` | Structuring into sections that are easy to scan |
| 6 | `Generating follow-up questions` | `Generating follow-up questions` | Creating questions you may want to ask your doctor |

> **Note**: Step 3 label differs cosmetically — backend says "Adding explanations for medical terms", frontend shows "Adding term explanations". The `id` integer is what drives SSE matching; the `label` in `INITIAL_STEPS` is display-only.

---

## SSE Event Schema (what the backend emits)

```json
{ "step": 1, "status": "active", "label": "Reading your document" }
{ "step": 1, "status": "done",   "label": "Reading your document" }
{ "step": "result", "data": { ...structured output... } }
{ "step": "error",  "error": "..." }
```

The frontend matches on `step` (integer ID), **not** on `label`.

---

## How to Make Each Type of Change

### Adding a step
1. In `routes/simplify.py` → `STEPS` dict: add `<new_id>: "<label>"`
2. In `frontend/simplify/src/App.tsx` → `INITIAL_STEPS` array: add `{ id: <new_id>, label: "...", description: "...", status: 'pending' }`
3. Emit the SSE event in `simplify.py` where the new processing happens: `yield _sse("step", {"step": <new_id>, "status": "active", "label": ...})`

### Renaming a step (display only)
- Change `label` / `description` in `INITIAL_STEPS` in `App.tsx` for UI display
- Optionally update the `label` in `STEPS` in `simplify.py` for consistency
- **Do NOT change the `id` integer** — the SSE matching will break

### Reordering steps
- Update `id` values in **both** `STEPS` (backend) and `INITIAL_STEPS` (frontend) together
- Also update the SSE emit calls in `simplify.py` to use the new integer IDs

### Removing a step
1. Remove entry from `STEPS` in `simplify.py`
2. Remove from `INITIAL_STEPS` in `App.tsx`
3. Remove the SSE emit calls for that step

---

## Internal Step (No SSE Event)

**Step 0** — jargon detection via scispaCy — runs silently between Step 1 and Step 2.
- Has **no** entry in `STEPS`
- Has **no** corresponding entry in `INITIAL_STEPS`
- No SSE event is emitted for it

---

## Description Writing Guidelines

- Use second-person present continuous: "Extracting…", "Rewriting…", "Defining…"
- Max ~60 characters — shown on one line on mobile
- Describe what the AI is **doing**, not the output

---

## Quick Reference — Code Locations

```python
# backend/backend-processing/routes/simplify.py  (~line 34)
STEPS = {
    1: "Reading your document",
    2: "Simplifying language",
    3: "Adding explanations for medical terms",
    4: "Clarifying numbers and actions",
    5: "Organizing for clarity",
    6: "Generating follow-up questions",
}

# SSE emit pattern (used throughout simplify.py)
yield _sse("step", {"step": 1, "status": "active", "label": STEPS[1]})
yield _sse("step", {"step": 1, "status": "done",   "label": STEPS[1]})
```

```ts
// frontend/simplify/src/App.tsx  (~line 33)
const INITIAL_STEPS: Step[] = [
  { id: 1, label: 'Reading your document',        description: 'Extracting text from your file',                              status: 'pending' },
  { id: 2, label: 'Simplifying language',          description: 'Rewriting to a 6th-grade reading level',                    status: 'pending' },
  { id: 3, label: 'Adding term explanations',      description: 'Defining medical jargon in plain language',                  status: 'pending' },
  { id: 4, label: 'Clarifying numbers and actions',description: 'Converting medical shorthand and emphasising what to do',    status: 'pending' },
  { id: 5, label: 'Organizing for clarity',        description: 'Structuring into sections that are easy to scan',            status: 'pending' },
  { id: 6, label: 'Generating follow-up questions',description: 'Creating questions you may want to ask your doctor',         status: 'pending' },
];
```
