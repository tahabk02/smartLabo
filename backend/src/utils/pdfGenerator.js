// backend/src/utils/pdfGenerator.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Générer un PDF de facture
 */
async function generateInvoicePDF(invoice, patient, analyses = []) {
  return new Promise((resolve, reject) => {
    try {
      // Créer le dossier invoices
      const invoicesDir = path.join(__dirname, "../../uploads/invoices");
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      const filename = `${invoice.numeroFacture}_${Date.now()}.pdf`;
      const filepath = path.join(invoicesDir, filename);

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // ========== EN-TÊTE ==========
      doc.fontSize(20).fillColor("#2563eb").text("SMART LABO", 50, 50);

      doc
        .fontSize(10)
        .fillColor("#666666")
        .text("Laboratoire d'Analyses Médicales", 50, 75)
        .text("123 Avenue Mohammed V, Casablanca", 50, 90)
        .text("Tél: +212 5XX-XXXXXX", 50, 105)
        .text("Email: contact@smartlabo.ma", 50, 120);

      // FACTURE
      doc.fontSize(24).fillColor("#000000").text("FACTURE", 400, 50);

      doc
        .fontSize(12)
        .fillColor("#666666")
        .text(`N° ${invoice.numeroFacture}`, 400, 80)
        .text(
          `Date: ${new Date(invoice.dateFacture).toLocaleDateString("fr-FR")}`,
          400,
          100
        );

      // Ligne de séparation
      doc.moveTo(50, 150).lineTo(550, 150).strokeColor("#e5e7eb").stroke();

      // ========== INFORMATIONS PATIENT ==========
      doc
        .fontSize(14)
        .fillColor("#000000")
        .text("Informations Patient", 50, 170);

      doc
        .fontSize(11)
        .fillColor("#666666")
        .text(`Nom: ${patient.nom || ""} ${patient.prenom || ""}`, 50, 195)
        .text(`N° Patient: ${patient.numeroPatient || "N/A"}`, 50, 215)
        .text(`Email: ${patient.email || "N/A"}`, 50, 235)
        .text(`Téléphone: ${patient.telephone || "N/A"}`, 50, 255);

      // ========== TABLEAU DES ANALYSES ==========
      const tableTop = 300;

      doc
        .fontSize(14)
        .fillColor("#000000")
        .text("Analyses Prescrites", 50, tableTop);

      // En-têtes du tableau
      const headerY = tableTop + 30;
      doc
        .fontSize(11)
        .fillColor("#ffffff")
        .rect(50, headerY, 500, 25)
        .fill("#2563eb");

      doc
        .fillColor("#ffffff")
        .text("Description", 60, headerY + 7)
        .text("Quantité", 320, headerY + 7)
        .text("Prix Unit.", 400, headerY + 7)
        .text("Total", 480, headerY + 7);

      // Lignes des analyses
      let yPosition = headerY + 35;
      let subtotal = 0;

      analyses.forEach((analysis, index) => {
        const price = analysis.price || 0;
        const total = price;
        subtotal += total;

        // Alternance de couleur de fond
        if (index % 2 === 0) {
          doc
            .rect(50, yPosition - 5, 500, 25)
            .fillAndStroke("#f9fafb", "#e5e7eb");
        }

        doc
          .fillColor("#000000")
          .fontSize(10)
          .text(analysis.name || "Analyse", 60, yPosition, { width: 240 })
          .text("1", 330, yPosition)
          .text(`${price.toFixed(2)} MAD`, 390, yPosition)
          .text(`${total.toFixed(2)} MAD`, 470, yPosition);

        yPosition += 30;
      });

      // Ligne de séparation
      yPosition += 10;
      doc
        .moveTo(50, yPosition)
        .lineTo(550, yPosition)
        .strokeColor("#e5e7eb")
        .stroke();

      // ========== TOTAUX ==========
      yPosition += 20;

      doc
        .fontSize(11)
        .fillColor("#666666")
        .text("Sous-total:", 350, yPosition)
        .fillColor("#000000")
        .text(`${subtotal.toFixed(2)} MAD`, 470, yPosition);

      yPosition += 25;
      doc
        .fontSize(14)
        .fillColor("#000000")
        .text("TOTAL:", 350, yPosition)
        .fontSize(16)
        .fillColor("#2563eb")
        .text(`${invoice.montantTotal.toFixed(2)} MAD`, 450, yPosition);

      // ========== INFORMATIONS DE PAIEMENT ==========
      yPosition += 50;

      doc
        .fontSize(14)
        .fillColor("#000000")
        .text("Modalités de Paiement", 50, yPosition);

      yPosition += 25;
      doc.fontSize(10).fillColor("#666666");

      const paymentLabels = {
        cash: "💵 Espèces",
        carte: "💳 Carte bancaire",
        amana: "📱 Amana",
        cashplus: "📱 CashPlus",
        virement: "🏦 Virement bancaire",
        cheque: "📄 Chèque",
      };

      doc.text(
        `Mode de paiement: ${
          paymentLabels[invoice.modePaiement] ||
          invoice.modePaiement ||
          "Non défini"
        }`,
        50,
        yPosition
      );

      // Codes de paiement selon le mode
      yPosition += 20;

      if (invoice.modePaiement === "amana" && invoice.codeAmana) {
        doc
          .fontSize(12)
          .fillColor("#10b981")
          .text(`Code Amana: ${invoice.codeAmana}`, 50, yPosition);

        yPosition += 20;
        doc
          .fontSize(9)
          .fillColor("#666666")
          .text(
            "Composez *555# et entrez ce code pour effectuer le paiement",
            50,
            yPosition
          );
      }

      if (invoice.modePaiement === "cashplus" && invoice.codeCashPlus) {
        doc
          .fontSize(12)
          .fillColor("#10b981")
          .text(`Code CashPlus: ${invoice.codeCashPlus}`, 50, yPosition);

        yPosition += 20;
        doc
          .fontSize(9)
          .fillColor("#666666")
          .text(
            "Rendez-vous dans un point CashPlus avec ce code",
            50,
            yPosition
          );
      }

      if (invoice.modePaiement === "virement" && invoice.virementDetails) {
        doc
          .fontSize(10)
          .fillColor("#666666")
          .text(
            `Banque: ${invoice.virementDetails.banque || "Banque Populaire"}`,
            50,
            yPosition
          );

        yPosition += 15;
        doc.text(
          `RIB: ${
            invoice.virementDetails.rib || "230 810 0001234567890123 45"
          }`,
          50,
          yPosition
        );

        yPosition += 15;
        doc.text(
          `Référence: ${invoice.virementDetails.reference}`,
          50,
          yPosition
        );
      }

      // ========== STATUT ==========
      yPosition += 40;

      const statusColors = {
        pending: "#f59e0b",
        paid: "#10b981",
        partially_paid: "#3b82f6",
        cancelled: "#ef4444",
        refunded: "#6b7280",
      };

      const statusLabels = {
        pending: "EN ATTENTE",
        paid: "PAYÉE",
        partially_paid: "PARTIELLEMENT PAYÉE",
        cancelled: "ANNULÉE",
        refunded: "REMBOURSÉE",
      };

      const currentStatus =
        invoice.statusPaiement || invoice.statut || "pending";

      doc
        .rect(50, yPosition, 150, 30)
        .fill(statusColors[currentStatus] || "#6b7280");

      doc
        .fontSize(12)
        .fillColor("#ffffff")
        .text(statusLabels[currentStatus] || "INCONNU", 55, yPosition + 8);

      // ========== PIED DE PAGE ==========
      doc
        .fontSize(8)
        .fillColor("#999999")
        .text("Merci de votre confiance!", 50, 750, {
          align: "center",
          width: 500,
        })
        .text("Cette facture est générée électroniquement", 50, 765, {
          align: "center",
          width: 500,
        });

      // Finaliser le PDF
      doc.end();

      stream.on("finish", () => {
        resolve(filename);
      });

      stream.on("error", (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateInvoicePDF };
