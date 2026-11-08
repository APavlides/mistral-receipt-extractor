# Pitch: Receipt Extractor

**One-liner:** Receipt Extractor reads a receipt image and fills in vendor, date, total and line items, ready to check and export.

**Opening question:** "How many receipts does your team type in by hand each month?"

1. **Problem:** A finance team with around 300 receipts a month types each one in by hand. It's slow, and typos reach the books.
2. **Solution:** Upload, review, export a CSV. People check instead of type.
3. **What I built:** Let me show you. *(switch to the app)*
4. **Next steps:** Today it's one image at a time, no PDFs. A 2-week pilot would measure accuracy and time saved.
5. **Thank you:** Receipts into your spreadsheet in seconds, checked by a person.

**Demo:**
1. Choose the receipt below, click **Extract**.
2. Point out vendor, date, total and three line items.
3. Change the Kids' tee quantity from 4 to 5, click **Export CSV**: "your correction is in the export".
4. Pick the text file below: it refuses non-images with a clear message.

    data/test-receipt.png

    README.md

**Likely questions:**
- *Is our data safe?* Images go to Mistral's API; the app stores nothing. For more control, Mistral Small is open-weight and can run on your own infrastructure.
- *How accurate is it?* The model fills a fixed form the code checks, and a person reviews every field. The pilot measures accuracy on your receipts.
- *Why Mistral?* Mistral OCR is built for documents and tables; Mistral Small turns the text into fields fast and cheaply.

**Close:** "Can we run a 2-week pilot on a month of your receipts?"
