/**
 * PDF Parser Utility
 * Extracts and analyzes data from PDF documents
 * Requires: pdf-parse npm package
 * Install: npm install pdf-parse
 */

const fs = require("fs");
const pdf = require("pdf-parse");
const path = require("path");

class PDFParser {
  /**
   * Parse PDF file and extract text
   * @param {string|Buffer} source - PDF file path or buffer
   * @returns {Promise<object>} Parsed PDF data
   */
  static async parsePDF(source) {
    try {
      let dataBuffer;

      // Check if source is a file path or buffer
      if (typeof source === "string") {
        dataBuffer = fs.readFileSync(source);
      } else if (Buffer.isBuffer(source)) {
        dataBuffer = source;
      } else {
        throw new Error("Invalid source: must be a file path or Buffer");
      }

      const data = await pdf(dataBuffer);

      return {
        success: true,
        text: data.text,
        pages: data.numpages,
        info: data.info,
        metadata: data.metadata,
        version: data.version,
      };
    } catch (error) {
      console.error("Error parsing PDF:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract text from specific page
   * @param {string|Buffer} source - PDF file path or buffer
   * @param {number} pageNumber - Page number (1-indexed)
   * @returns {Promise<string>} Extracted text
   */
  static async extractPageText(source, pageNumber) {
    try {
      let dataBuffer;

      if (typeof source === "string") {
        dataBuffer = fs.readFileSync(source);
      } else {
        dataBuffer = source;
      }

      const data = await pdf(dataBuffer, {
        pagerender: function (pageData) {
          return pageData.getTextContent().then((textContent) => {
            return textContent.items.map((item) => item.str).join(" ");
          });
        },
      });

      const pages = data.text.split("\f"); // Form feed character separates pages

      if (pageNumber < 1 || pageNumber > pages.length) {
        throw new Error(`Invalid page number. PDF has ${pages.length} pages.`);
      }

      return pages[pageNumber - 1];
    } catch (error) {
      console.error("Error extracting page text:", error);
      throw error;
    }
  }

  /**
   * Extract medical analysis data from PDF
   * @param {string|Buffer} source - PDF file path or buffer
   * @returns {Promise<object>} Extracted medical data
   */
  static async extractMedicalData(source) {
    try {
      const result = await this.parsePDF(source);

      if (!result.success) {
        return result;
      }

      const text = result.text;

      // Extract patient information
      const patientInfo = this.extractPatientInfo(text);

      // Extract test results
      const testResults = this.extractTestResults(text);

      // Extract dates
      const dates = this.extractDates(text);

      // Extract doctor/lab information
      const labInfo = this.extractLabInfo(text);

      return {
        success: true,
        patientInfo,
        testResults,
        dates,
        labInfo,
        rawText: text,
      };
    } catch (error) {
      console.error("Error extracting medical data:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract patient information from text
   * @param {string} text - PDF text content
   * @returns {object} Patient information
   */
  static extractPatientInfo(text) {
    const info = {};

    // Extract name (common patterns)
    const namePatterns = [
      /(?:Patient|Nom|Name)[:\s]+([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)+)/i,
      /Nom\s*:\s*([^\n]+)/i,
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        info.name = match[1].trim();
        break;
      }
    }

    // Extract age
    const ageMatch = text.match(/(?:Age|Âge)[:\s]+(\d+)/i);
    if (ageMatch) {
      info.age = parseInt(ageMatch[1]);
    }

    // Extract gender
    const genderMatch = text.match(
      /(?:Sexe|Gender|Sex)[:\s]+(M|F|Masculin|Féminin|Male|Female)/i
    );
    if (genderMatch) {
      info.gender = genderMatch[1].charAt(0).toUpperCase();
    }

    // Extract ID/Reference number
    const idMatch = text.match(
      /(?:ID|Référence|Reference|N°)[:\s]+([A-Z0-9-]+)/i
    );
    if (idMatch) {
      info.referenceId = idMatch[1];
    }

    return info;
  }

  /**
   * Extract test results from text
   * @param {string} text - PDF text content
   * @returns {Array} Array of test results
   */
  static extractTestResults(text) {
    const results = [];

    // Common test patterns with units
    const testPatterns = [
      // Pattern: Test Name : Value Unit (Range)
      /([A-Za-zÀ-ÿ\s]+)\s*[:\s]+(\d+\.?\d*)\s*([a-zA-Z/]+)?\s*(?:\(([^)]+)\))?/g,
      // Pattern: Test Name | Value | Unit | Range
      /([A-Za-zÀ-ÿ]+)\s*\|\s*(\d+\.?\d*)\s*\|\s*([a-zA-Z/]+)?\s*\|\s*([^|\n]+)?/g,
    ];

    const commonTests = [
      "Glycémie",
      "Glucose",
      "Cholestérol",
      "Cholesterol",
      "Hémoglobine",
      "Hemoglobin",
      "Leucocytes",
      "Plaquettes",
      "Créatinine",
      "Urée",
      "Urea",
      "TSH",
      "T3",
      "T4",
      "HDL",
      "LDL",
      "Triglycérides",
      "Triglycerides",
    ];

    for (const pattern of testPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const testName = match[1].trim();

        // Check if it's a common test name
        if (
          commonTests.some((test) =>
            testName.toLowerCase().includes(test.toLowerCase())
          )
        ) {
          results.push({
            test: testName,
            value: parseFloat(match[2]),
            unit: match[3] ? match[3].trim() : "",
            range: match[4] ? match[4].trim() : "",
          });
        }
      }
    }

    return results;
  }

  /**
   * Extract dates from text
   * @param {string} text - PDF text content
   * @returns {object} Extracted dates
   */
  static extractDates(text) {
    const dates = {};

    // Date patterns (DD/MM/YYYY, DD-MM-YYYY, etc.)
    const datePatterns = [
      /(?:Date\s+(?:de\s+)?prélèvement|Sample\s+Date)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      /(?:Date\s+(?:de\s+)?résultat|Result\s+Date)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      /(?:Date)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    ];

    datePatterns.forEach((pattern, index) => {
      const match = text.match(pattern);
      if (match) {
        if (index === 0) dates.sampleDate = match[1];
        else if (index === 1) dates.resultDate = match[1];
        else if (!dates.sampleDate) dates.date = match[1];
      }
    });

    return dates;
  }

  /**
   * Extract laboratory information
   * @param {string} text - PDF text content
   * @returns {object} Laboratory information
   */
  static extractLabInfo(text) {
    const info = {};

    // Extract lab name
    const labMatch = text.match(/(?:Laboratoire|Laboratory)[:\s]+([^\n]+)/i);
    if (labMatch) {
      info.labName = labMatch[1].trim();
    }

    // Extract doctor name
    const doctorMatch = text.match(
      /(?:Dr\.?|Docteur|Doctor)[:\s]+([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)*)/i
    );
    if (doctorMatch) {
      info.doctorName = doctorMatch[1].trim();
    }

    // Extract phone
    const phoneMatch = text.match(/(?:Tél|Tel|Phone)[:\s]+([\d\s\-+()]+)/i);
    if (phoneMatch) {
      info.phone = phoneMatch[1].trim();
    }

    return info;
  }

  /**
   * Search for keywords in PDF
   * @param {string|Buffer} source - PDF file path or buffer
   * @param {string|Array} keywords - Keyword(s) to search
   * @returns {Promise<Array>} Array of matches with context
   */
  static async searchKeywords(source, keywords) {
    try {
      const result = await this.parsePDF(source);

      if (!result.success) {
        return [];
      }

      const text = result.text;
      const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
      const matches = [];

      keywordArray.forEach((keyword) => {
        const regex = new RegExp(`.{0,50}${keyword}.{0,50}`, "gi");
        const found = text.match(regex);

        if (found) {
          found.forEach((match) => {
            matches.push({
              keyword,
              context: match.trim(),
              position: text.indexOf(match),
            });
          });
        }
      });

      return matches;
    } catch (error) {
      console.error("Error searching keywords:", error);
      return [];
    }
  }

  /**
   * Get PDF metadata
   * @param {string|Buffer} source - PDF file path or buffer
   * @returns {Promise<object>} PDF metadata
   */
  static async getMetadata(source) {
    try {
      const result = await this.parsePDF(source);

      if (!result.success) {
        return null;
      }

      return {
        pages: result.pages,
        info: result.info,
        metadata: result.metadata,
        version: result.version,
      };
    } catch (error) {
      console.error("Error getting metadata:", error);
      return null;
    }
  }

  /**
   * Validate if file is a valid PDF
   * @param {string} filePath - Path to file
   * @returns {boolean} True if valid PDF
   */
  static isValidPDF(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }

      const buffer = fs.readFileSync(filePath);
      // Check PDF signature (first 4 bytes should be %PDF)
      return buffer.toString("utf8", 0, 4) === "%PDF";
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert PDF text to structured JSON
   * @param {string|Buffer} source - PDF file path or buffer
   * @returns {Promise<object>} Structured data
   */
  static async toJSON(source) {
    try {
      const medicalData = await this.extractMedicalData(source);
      const metadata = await this.getMetadata(source);

      return {
        ...medicalData,
        metadata,
        extractedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error converting to JSON:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = PDFParser;

// Example usage:
/*
const PDFParser = require('./pdfParser');

// Parse a PDF file
PDFParser.parsePDF('./analyse.pdf')
  .then(result => console.log(result))
  .catch(err => console.error(err));

// Extract medical data
PDFParser.extractMedicalData('./analyse.pdf')
  .then(data => console.log(data))
  .catch(err => console.error(err));

// Search for keywords
PDFParser.searchKeywords('./analyse.pdf', ['glucose', 'cholesterol'])
  .then(matches => console.log(matches))
  .catch(err => console.error(err));
*/
