# PRD: Receipt extractor

**Goal**: Upload a receipt or invoice image and get back `{ vendor, date, total, line_items }` as structured JSON.

**User**: Someone who wants a receipt's key fields without typing them in by hand.

## Core flow

1. User picks a receipt image (PNG/JPEG) in the browser and clicks Extract.
2. Frontend sends the file to `POST /api/extract` through the Vite proxy.
3. Backend sends the file to Mistral OCR (`mistral-ocr-latest`) and gets markdown text back.
4. Backend asks a Mistral chat model (`MISTRAL_MODEL`) to turn that text into the schema, using structured output.
5. Backend returns the JSON; frontend shows vendor, date, total and a line-items table.
6. M5–M6: user edits the fields and line items in place.
7. M7: user clicks Export CSV and downloads the edited result.

## Out of scope

PDF upload (images only for now), database or saved history, auth, multi-file or batch upload, saving edits back to the server, adding/removing line items, currency conversion, multi-page invoice handling beyond what OCR returns, Docker, tests, styling.

## Endpoints and data

- `GET /api/health` (exists).
- `POST /api/extract`: multipart `file` (PNG/JPEG) → `Receipt`.
- `Receipt`: `vendor: str | None`, `date: str | None` (ISO `YYYY-MM-DD`), `total: float | None`, `line_items: list[LineItem]`.
- `LineItem`: `description: str`, `quantity: float | None`, `amount: float | None`.
- Nothing stored; each request is in memory only.
- M5–M7: edits live in React state only; CSV is built in the browser (no new endpoint, no dependency). One row per line item: `vendor,date,total,description,quantity,amount`.
- Sample input for testing: `data/test-receipt.png`.

## Milestones

- [x] **M1 Stub slice**: `POST /api/extract` accepts a file and returns a hardcoded `Receipt`; frontend has a file input + button and shows the raw JSON.
      Done when: uploading any file in the UI shows the stub JSON.
- [x] **M2 OCR**: shared async Mistral client in lifespan; upload the file to Mistral OCR and return the extracted markdown (temporary debug response).
      Done when: `curl` with `data/test-receipt.png` returns its OCR text.
- [x] **M3 Structured extraction**: send the OCR text to the chat model with the `Receipt` schema and return the parsed result.
      Done when: `curl` and the UI return real vendor, date, total and line items for `data/test-receipt.png`.
- [x] **M4 Result view**: render fields and a line-items table, with loading, error and empty states.
      Done when: the UI shows a readable result, a spinner while waiting, and an error message on failure.
- [x] **M5 Editable fields**: `ReceiptView` shows vendor, date and total as inputs; edits update the receipt in `App` state.
      Done when: changing the vendor in the UI updates the value shown and kept in state.
- [x] **M6 Editable line items**: the table cells (description, qty, amount) are inputs that update state.
      Done when: editing a quantity in the table keeps the new value after clicking elsewhere.
- [x] **M7 CSV export**: an Export CSV button builds a CSV from the edited receipt (quoting commas/quotes) and downloads `receipt.csv`.
      Done when: the downloaded file opens with one row per line item, including the user's edits.
- [x] **M8 Hardening**: validate file type/size (400/413), SDK timeout + retry config (429/5xx/timeouts), map errors (429 passthrough, 502/504).
      Done when: a bad file type gets a 400 and a forced upstream failure gets a clear 502/504.

## Decisions

1. `python-multipart` added for file uploads (installed).
2. Image sent to Mistral OCR inline as a base64 data URL (no Files API).
3. Two steps: OCR → chat model with structured output.
