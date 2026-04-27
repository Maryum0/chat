import * as pdfjsLib from 'pdfjs-dist';

// In Vite, this creates a proper worker URL
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * Gets the total number of pages in a PDF file.
 * @param {File} file
 * @returns {Promise<number>}
 */
export async function getPageCount(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  return pdf.numPages;
}

/**
 * Extracts text from a File object representing a PDF.
 * Supports optional page range via startPage and endPage (1-indexed, inclusive).
 * @param {File} file
 * @param {number} [startPage=1]
 * @param {number} [endPage] Defaults to last page if not provided.
 * @returns {Promise<string>} The extracted text.
 */
export async function extractTextFromPDF(file, startPage = 1, endPage = null) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

    const effectiveEnd = endPage ? Math.min(endPage, pdf.numPages) : pdf.numPages;
    const effectiveStart = Math.max(1, startPage);

    let textContent = '';

    for (let i = effectiveStart; i <= effectiveEnd; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      const pageText = text.items.map(item => item.str).join(' ');
      textContent += `\n[Page ${i}]\n` + pageText + '\n';
    }

    return textContent;
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    throw new Error('Failed to parse PDF.');
  }
}
