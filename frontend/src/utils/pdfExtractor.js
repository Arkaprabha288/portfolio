/**
 * pdfExtractor.js
 * Extracts raw text from a PDF File using pdf.js.
 */

let pdfjsLib = null

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib

  const pdfjs = await import('pdfjs-dist')

  // Use unpkg CDN — version must exactly match installed pdfjs-dist
  const version = pdfjs.version
  pdfjs.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`

  pdfjsLib = pdfjs
  return pdfjsLib
}

/**
 * Extract all text from a PDF File object.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromPDF(file) {
  const lib = await loadPdfJs()
  const arrayBuffer = await file.arrayBuffer()

  const loadingTask = lib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise

  const pageTexts = []
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ')
    pageTexts.push(pageText)
  }

  return pageTexts.join('\n').trim()
}
