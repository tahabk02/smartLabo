// backend/utils/invoiceGenerator.js
// Utilitaire pour générer automatiquement des factures

const Facture = require("../models/Facture");

/**
 * Génère automatiquement une facture pour un rendez-vous
 * @param {Object} appointment - Le rendez-vous créé
 * @param {Array} analyses - Liste des analyses commandées
 * @returns {Object} La facture créée
 */
const generateInvoiceForAppointment = async (appointment, analyses = []) => {
  try {
    console.log("📝 Génération de facture pour le RDV:", appointment._id);

    // 1. Générer le numéro de facture
    const count = await Facture.countDocuments();
    const numeroFacture = `FAC${String(count + 1).padStart(6, "0")}`;

    // 2. Calculer les montants basés sur les analyses
    let items = [];
    let montantHT = 0;

    if (analyses && analyses.length > 0) {
      items = analyses.map((analyse) => {
        const prix = analyse.prix || analyse.price || 100; // Prix par défaut
        return {
          name: analyse.nom || analyse.name || "Analyse médicale",
          description: analyse.description || "",
          quantity: 1,
          price: prix,
          total: prix,
        };
      });

      montantHT = items.reduce((sum, item) => sum + item.total, 0);
    } else {
      // Si aucune analyse spécifiée, créer une facture générique
      montantHT = 150; // Prix par défaut
      items = [
        {
          name: "Consultation médicale",
          description: "Rendez-vous d'analyse",
          quantity: 1,
          price: montantHT,
          total: montantHT,
        },
      ];
    }

    // 3. Calculer la TVA (20%)
    const montantTVA = montantHT * 0.2;
    const montantTotal = montantHT + montantTVA;

    // 4. Calculer la date d'échéance (30 jours après émission)
    const dateEcheance = new Date();
    dateEcheance.setDate(dateEcheance.getDate() + 30);

    // 5. Créer la facture
    const facture = new Facture({
      numeroFacture,
      patientId: appointment.patientId || appointment.patient,
      appointmentId: appointment._id,
      rendezvousId: appointment._id,

      dateEmission: new Date(),
      issueDate: new Date(),
      dateEcheance,
      dueDate: dateEcheance,

      montantHT,
      subtotal: montantHT,
      montantTVA,
      taxAmount: montantTVA,
      montantTotal,
      totalAmount: montantTotal,

      statut: "pending",
      status: "pending",

      items,
      lignes: items.map((item) => ({
        designation: item.name,
        quantite: item.quantity,
        prixUnitaire: item.price,
        montant: item.total,
      })),

      notes: `Facture générée automatiquement pour le rendez-vous du ${new Date(
        appointment.date
      ).toLocaleDateString("fr-FR")}`,
    });

    await facture.save();

    console.log(`✅ Facture créée: ${numeroFacture} - ${montantTotal} MAD`);

    return facture;
  } catch (error) {
    console.error("❌ Erreur création facture automatique:", error);
    throw error;
  }
};

/**
 * Met à jour le statut d'une facture selon le rendez-vous
 * @param {String} appointmentId - ID du rendez-vous
 * @param {String} newStatus - Nouveau statut
 */
const updateInvoiceStatus = async (appointmentId, appointmentStatus) => {
  try {
    const facture = await Facture.findOne({
      $or: [{ appointmentId }, { rendezvousId: appointmentId }],
    });

    if (!facture) {
      console.log("⚠️  Aucune facture trouvée pour ce RDV");
      return null;
    }

    // Mapper les statuts du rendez-vous aux statuts de facture
    let invoiceStatus = facture.statut;

    if (appointmentStatus === "completed") {
      // RDV terminé = facture en attente de paiement
      invoiceStatus = "pending";
    } else if (appointmentStatus === "cancelled") {
      // RDV annulé = facture annulée
      invoiceStatus = "cancelled";
    }

    facture.statut = invoiceStatus;
    facture.status = invoiceStatus;
    await facture.save();

    console.log(
      `✅ Statut facture mis à jour: ${facture.numeroFacture} → ${invoiceStatus}`
    );
    return facture;
  } catch (error) {
    console.error("❌ Erreur MAJ statut facture:", error);
    throw error;
  }
};

module.exports = {
  generateInvoiceForAppointment,
  updateInvoiceStatus,
};
