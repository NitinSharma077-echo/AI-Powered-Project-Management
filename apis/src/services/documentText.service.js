const path = require("path");
const mammoth = require("mammoth");
// Require the library file directly: the package entry point runs a debug
// self-test that reads a sample PDF from disk when it is the main module.
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

const HttpError = require("../utils/httpError");

// Large enough for a detailed spec, small enough for one AI request.
const MAX_DOCUMENT_CHARS = 60000;
const MIN_DOCUMENT_CHARS = 20;

const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md", ".csv"];

async function extractRawText(file) {
  const extension = path.extname(file.originalname || "").toLowerCase();

  switch (extension) {
    case ".pdf": {
      const result = await pdfParse(file.buffer);
      return result.text;
    }
    case ".docx": {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    }
    case ".txt":
    case ".md":
    case ".csv":
      return file.buffer.toString("utf8");
    default:
      throw new HttpError(
        `Unsupported file type. Upload one of: ${SUPPORTED_EXTENSIONS.join(", ")}.`,
        400
      );
  }
}

// Returns clean text plus whether it had to be shortened.
async function extractDocumentText(file) {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw new HttpError("Choose a document to upload.", 400);
  }

  let raw;

  try {
    raw = await extractRawText(file);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(
      "Could not read that document. Check that it is not password protected or corrupted.",
      400
    );
  }

  const text = String(raw || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (text.length < MIN_DOCUMENT_CHARS) {
    throw new HttpError(
      "Not enough readable text was found in that document. Scanned or image-only files are not supported.",
      400
    );
  }

  return {
    text: text.slice(0, MAX_DOCUMENT_CHARS),
    truncated: text.length > MAX_DOCUMENT_CHARS,
    characters: text.length,
  };
}

module.exports = {
  extractDocumentText,
  SUPPORTED_EXTENSIONS,
};
