const pdf = require("pdf-parse");
const fs = require("fs").promises;

class PDFService {
  async extractTextFromPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);

      return {
        text: data.text,
        pages: data.numpages,
        info: data.info,
      };
    } catch (error) {
      console.error("PDF Extraction Error:", error);
      throw new Error("Failed to extract text from PDF");
    }
  }

  async cleanAnalysisText(text) {
    // Nettoyer le texte extrait
    return text
      .replace(/\s+/g, " ") // Espaces multiples
      .replace(/\n{3,}/g, "\n\n") // Sauts de ligne multiples
      .trim();
  }
}

module.exports = new PDFService();
