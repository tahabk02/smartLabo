/**
 * Text Analyzer Utility
 * Provides various text analysis and manipulation functions
 */

class TextAnalyzer {
  /**
   * Count words in a text
   * @param {string} text - The text to analyze
   * @returns {number} Word count
   */
  static countWords(text) {
    if (!text || typeof text !== "string") return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Count characters in a text (with or without spaces)
   * @param {string} text - The text to analyze
   * @param {boolean} includeSpaces - Whether to include spaces
   * @returns {number} Character count
   */
  static countCharacters(text, includeSpaces = true) {
    if (!text || typeof text !== "string") return 0;
    return includeSpaces ? text.length : text.replace(/\s/g, "").length;
  }

  /**
   * Count sentences in a text
   * @param {string} text - The text to analyze
   * @returns {number} Sentence count
   */
  static countSentences(text) {
    if (!text || typeof text !== "string") return 0;
    return text.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0)
      .length;
  }

  /**
   * Calculate reading time (assuming 200 words per minute)
   * @param {string} text - The text to analyze
   * @returns {number} Reading time in minutes
   */
  static estimateReadingTime(text) {
    const wordCount = this.countWords(text);
    return Math.ceil(wordCount / 200);
  }

  /**
   * Get most frequent words
   * @param {string} text - The text to analyze
   * @param {number} limit - Number of top words to return
   * @returns {Array} Array of {word, count} objects
   */
  static getMostFrequentWords(text, limit = 10) {
    if (!text || typeof text !== "string") return [];

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 2);

    const frequency = {};
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }));
  }

  /**
   * Extract keywords from text
   * @param {string} text - The text to analyze
   * @returns {Array} Array of keywords
   */
  static extractKeywords(text) {
    if (!text || typeof text !== "string") return [];

    const stopWords = new Set([
      "le",
      "la",
      "les",
      "un",
      "une",
      "des",
      "de",
      "du",
      "et",
      "ou",
      "mais",
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word));

    const frequency = {};
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
  }

  /**
   * Calculate text complexity score (0-100)
   * Based on average word length and sentence length
   * @param {string} text - The text to analyze
   * @returns {number} Complexity score
   */
  static calculateComplexity(text) {
    if (!text || typeof text !== "string") return 0;

    const wordCount = this.countWords(text);
    const sentenceCount = this.countSentences(text);
    const charCount = this.countCharacters(text, false);

    if (wordCount === 0 || sentenceCount === 0) return 0;

    const avgWordLength = charCount / wordCount;
    const avgSentenceLength = wordCount / sentenceCount;

    // Normalize to 0-100 scale
    const complexityScore = Math.min(
      100,
      avgWordLength * 5 + avgSentenceLength * 2
    );

    return Math.round(complexityScore);
  }

  /**
   * Analyze sentiment (basic implementation)
   * @param {string} text - The text to analyze
   * @returns {object} Sentiment analysis result
   */
  static analyzeSentiment(text) {
    if (!text || typeof text !== "string") {
      return { score: 0, sentiment: "neutral" };
    }

    const positiveWords = new Set([
      "bon",
      "bien",
      "excellent",
      "super",
      "génial",
      "parfait",
      "merveilleux",
      "good",
      "great",
      "excellent",
      "amazing",
      "wonderful",
      "fantastic",
      "perfect",
    ]);

    const negativeWords = new Set([
      "mauvais",
      "mal",
      "terrible",
      "horrible",
      "nul",
      "médiocre",
      "bad",
      "terrible",
      "awful",
      "horrible",
      "poor",
      "worst",
    ]);

    const words = text.toLowerCase().split(/\s+/);
    let score = 0;

    words.forEach((word) => {
      if (positiveWords.has(word)) score++;
      if (negativeWords.has(word)) score--;
    });

    const sentiment =
      score > 0 ? "positive" : score < 0 ? "negative" : "neutral";

    return { score, sentiment };
  }

  /**
   * Get full analysis of text
   * @param {string} text - The text to analyze
   * @returns {object} Complete analysis object
   */
  static analyze(text) {
    return {
      wordCount: this.countWords(text),
      characterCount: this.countCharacters(text, true),
      characterCountNoSpaces: this.countCharacters(text, false),
      sentenceCount: this.countSentences(text),
      readingTime: this.estimateReadingTime(text),
      complexity: this.calculateComplexity(text),
      sentiment: this.analyzeSentiment(text),
      topWords: this.getMostFrequentWords(text, 5),
      keywords: this.extractKeywords(text).slice(0, 10),
    };
  }

  /**
   * Truncate text to specified length
   * @param {string} text - The text to truncate
   * @param {number} maxLength - Maximum length
   * @param {string} suffix - Suffix to add (e.g., '...')
   * @returns {string} Truncated text
   */
  static truncate(text, maxLength = 100, suffix = "...") {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length).trim() + suffix;
  }

  /**
   * Highlight keywords in text
   * @param {string} text - The text to process
   * @param {Array} keywords - Keywords to highlight
   * @returns {string} Text with highlighted keywords
   */
  static highlightKeywords(text, keywords) {
    if (!text || !keywords || keywords.length === 0) return text;

    let result = text;
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      result = result.replace(regex, `<mark>$&</mark>`);
    });

    return result;
  }

  /**
   * Remove special characters from text
   * @param {string} text - The text to clean
   * @returns {string} Cleaned text
   */
  static removeSpecialCharacters(text) {
    if (!text || typeof text !== "string") return "";
    return text.replace(/[^\w\s]/g, "");
  }

  /**
   * Capitalize first letter of each word
   * @param {string} text - The text to capitalize
   * @returns {string} Capitalized text
   */
  static capitalizeWords(text) {
    if (!text || typeof text !== "string") return "";
    return text.replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

// Export for Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = TextAnalyzer;
}

// Example usage:
/*
const text = "Voici un exemple de texte à analyser. Il contient plusieurs phrases et mots intéressants.";

const analysis = TextAnalyzer.analyze(text);
console.log(analysis);

const wordCount = TextAnalyzer.countWords(text);
console.log("Word count:", wordCount);

const sentiment = TextAnalyzer.analyzeSentiment(text);
console.log("Sentiment:", sentiment);
*/
