import base64
import os
from contextlib import asynccontextmanager

import httpx2
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, UploadFile
from mistralai.client import Mistral
from mistralai.client.errors.mistralerror import MistralError
from mistralai.client.utils import BackoffStrategy, RetryConfig
from pydantic import BaseModel

load_dotenv()

OCR_MODEL = "mistral-ocr-latest"
CHAT_MODEL = os.getenv("MISTRAL_MODEL", "mistral-small-latest")
ALLOWED_TYPES = {"image/png", "image/jpeg"}
MAX_BYTES = 10 * 1024 * 1024

# SDK retries 429/5xx by default; add backoff with jitter and retry connection errors
RETRY = RetryConfig(
    "backoff",
    BackoffStrategy(
        initial_interval=500,
        max_interval=5_000,
        exponent=2,
        max_elapsed_time=60_000,
        jitter_ms=300,
    ),
    retry_connection_errors=True,
)

EXTRACT_PROMPT = (
    "Extract the receipt fields from the OCR text. "
    "vendor is the business name at the top, date is YYYY-MM-DD, "
    "total is the final amount paid including tax as a number, "
    "and add one line item per purchased product. "
    "Use null for anything not present."
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # One shared async client for all requests
    async with Mistral(
        api_key=os.environ["MISTRAL_API_KEY"], timeout_ms=30_000, retry_config=RETRY
    ) as client:
        app.state.mistral = client
        yield


app = FastAPI(lifespan=lifespan)


class LineItem(BaseModel):
    description: str
    quantity: float | None
    amount: float | None


class Receipt(BaseModel):
    vendor: str | None
    date: str | None  # ISO YYYY-MM-DD
    total: float | None
    line_items: list[LineItem]


async def ocr_image(client: Mistral, data: bytes, mime: str) -> str:
    data_url = f"data:{mime};base64,{base64.b64encode(data).decode()}"
    res = await client.ocr.process_async(
        model=OCR_MODEL,
        document={"type": "image_url", "image_url": data_url},
    )
    return "\n\n".join(page.markdown for page in res.pages)


async def extract_receipt(client: Mistral, markdown: str) -> Receipt:
    res = await client.chat.parse_async(
        response_format=Receipt,
        model=CHAT_MODEL,
        temperature=0,
        messages=[
            {"role": "system", "content": EXTRACT_PROMPT},
            {"role": "user", "content": markdown},
        ],
    )
    parsed = res.choices[0].message.parsed
    if parsed is None:
        raise HTTPException(502, "Model returned no usable result")
    return parsed


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/extract", response_model=Receipt)
async def extract(file: UploadFile, request: Request):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Upload a PNG or JPEG image")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Image must be under 10 MB")

    client = request.app.state.mistral
    try:
        markdown = await ocr_image(client, data, file.content_type)
        return await extract_receipt(client, markdown)
    except MistralError as e:
        if e.status_code == 429:
            raise HTTPException(429, "Rate limited by Mistral, try again shortly")
        raise HTTPException(502, f"Mistral request failed ({e.status_code})")
    except httpx2.TimeoutException:
        raise HTTPException(504, "Mistral took too long to respond")
