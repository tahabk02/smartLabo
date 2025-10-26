// backend/src/utils/paymentCodes.js

const crypto = require("crypto");

/**
 * Générer un code Amana unique
 * Format: AMA-XXXX-XXXX-XXXX
 */
function generateAmanaCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  const code = `${timestamp}${random}`;
  return `AMA-${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
}

/**
 * Générer un code CashPlus unique
 * Format: CP-XXXXXXXXXX (10 chiffres)
 */
function generateCashPlusCode() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `CP-${timestamp}${random}`;
}

/**
 * Générer une référence de virement
 * Format: VIR-FACXXXXXX-YYYYMMDD
 */
function generateVirementReference(factureNumber) {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `VIR-${factureNumber}-${dateStr}`;
}

module.exports = {
  generateAmanaCode,
  generateCashPlusCode,
  generateVirementReference,
};
