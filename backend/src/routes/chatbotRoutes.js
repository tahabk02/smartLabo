const express = require("express");
const router = express.Router();
const { protect: auth } = require("../middleware/authMiddleware");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// @route   POST /api/chatbot
// @desc    Send message to chatbot and get response
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const userId = req.user.id;

    console.log("📨 Chatbot request:", { userId, conversationId, content });

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Le message ne peut pas être vide",
      });
    }

    let conversation;

    // Si pas de conversationId, créer une nouvelle conversation
    if (!conversationId) {
      conversation = new Conversation({
        user: userId,
        title: content.substring(0, 50),
      });
      await conversation.save();
      console.log("✅ Nouvelle conversation créée:", conversation._id);
    } else {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation non trouvée",
        });
      }

      // Vérifier que l'utilisateur est bien le propriétaire
      if (conversation.user.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé à cette conversation",
        });
      }
    }

    // Sauvegarder le message utilisateur
    const userMessage = new Message({
      conversation: conversation._id,
      sender: "user",
      content: content.trim(),
    });
    await userMessage.save();

    // Générer la réponse du bot
    const botResponse = generateBotResponse(content);

    // Sauvegarder la réponse du bot
    const botMessage = new Message({
      conversation: conversation._id,
      sender: "bot",
      content: botResponse,
    });
    await botMessage.save();

    // Mettre à jour la conversation
    conversation.lastMessage = content.substring(0, 100);
    await conversation.save();

    console.log("✅ Messages sauvegardés");

    res.json({
      success: true,
      data: {
        conversationId: conversation._id,
        message: botMessage,
      },
    });
  } catch (error) {
    console.error("❌ Chatbot error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/chatbot/conversations/:id
// @desc    Get conversation history
// @access  Private
router.get("/conversations/:id", auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation non trouvée",
      });
    }

    if (conversation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    const messages = await Message.find({
      conversation: req.params.id,
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("❌ Error fetching conversation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// @route   GET /api/chatbot/conversations
// @desc    Get all user conversations
// @access  Private
router.get("/conversations", auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      user: req.user.id,
    })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select("title lastMessage createdAt updatedAt");

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("❌ Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// @route   DELETE /api/chatbot/conversations/:id
// @desc    Delete conversation
// @access  Private
router.delete("/conversations/:id", auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation non trouvée",
      });
    }

    if (conversation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    await Message.deleteMany({ conversation: req.params.id });
    await Conversation.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Conversation supprimée",
    });
  } catch (error) {
    console.error("❌ Error deleting conversation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// Fonction IA pour générer les réponses
function generateBotResponse(userMessage) {
  const message = userMessage.toLowerCase().trim();

  // Salutations
  if (/^(bonjour|salut|hello|hi|hey|coucou)$/i.test(message)) {
    return `👋 Bonjour ! Je suis votre assistant SmartLabo.

Comment puis-je vous aider aujourd'hui ?

**Je peux vous renseigner sur :**
• 👤 Gestion des patients
• 🔬 Analyses médicales
• 💰 Facturation
• 📋 Tâches quotidiennes
• 👨‍⚕️ Médecins
• 👥 Utilisateurs

Posez-moi une question ! 🎯`;
  }

  // Remerciements
  if (message.includes("merci") || message.includes("thank")) {
    return `De rien ! 😊

Je suis là pour vous aider. N'hésitez pas à me poser d'autres questions !`;
  }

  // Aide
  if (message.includes("aide") || message.includes("help") || message === "?") {
    return `🆘 **Guide d'aide SmartLabo**

**Questions populaires :**
1. "Comment ajouter un patient ?"
2. "Comment créer une facture ?"
3. "Où voir les analyses ?"
4. "Comment gérer les tâches ?"
5. "Comment changer mon mot de passe ?"

Tapez votre question et je vous guiderai ! 💡`;
  }

  // Patients
  if (
    message.includes("patient") &&
    (message.includes("ajouter") ||
      message.includes("nouveau") ||
      message.includes("créer"))
  ) {
    return `📋 **Ajouter un nouveau patient**

**Étapes simples :**
1. 📂 Menu → "Patients"
2. ➕ Bouton "Nouveau Patient"
3. 📝 Remplissez les champs obligatoires :
   • Nom et Prénom
   • Date de naissance
   • Sexe (M/F)
   • Téléphone
4. 💾 Cliquez sur "Enregistrer"

✅ Un numéro unique sera généré automatiquement (ex: PAT000001)

💡 **Astuce :** Vous pouvez rechercher un patient par nom, numéro ou téléphone !`;
  }

  if (message.includes("patient") && message.includes("recherch")) {
    return `🔍 **Rechercher un patient**

**Méthodes de recherche :**
1. 🔎 Barre de recherche en haut
2. 🔢 Par numéro patient (PAT000XXX)
3. 📞 Par téléphone
4. 📧 Par email
5. 🏷️ Par nom/prénom

**Filtres disponibles :**
• Actifs / Inactifs
• Par date d'inscription
• Par médecin traitant

La recherche est instantanée ! ⚡`;
  }

  // Factures
  if (
    message.includes("facture") &&
    (message.includes("créer") ||
      message.includes("nouveau") ||
      message.includes("ajouter"))
  ) {
    return `💰 **Créer une nouvelle facture**

**Processus :**
1. 📄 Menu → "Factures"
2. ➕ "Nouvelle Facture"
3. 👤 Sélectionnez le patient
4. 📊 Ajoutez les prestations :
   • Type d'analyse
   • Prix unitaire
   • Quantité
5. 💵 Total calculé automatiquement
6. 📅 Date d'échéance
7. ✅ Valider

**Options :**
• 🖨️ Imprimer
• 📧 Envoyer par email
• 💳 Enregistrer le paiement

**Statuts :** En attente • Payée • En retard • Annulée`;
  }

  if (
    message.includes("facture") &&
    (message.includes("payer") || message.includes("paiement"))
  ) {
    return `💳 **Enregistrer un paiement**

**Étapes :**
1. 📄 Ouvrez la facture
2. 💰 Cliquez sur "Enregistrer paiement"
3. 💵 Choisissez le mode :
   • Espèces
   • Carte bancaire
   • Virement
   • Chèque
4. 📅 Date de paiement
5. ✅ Confirmer

La facture passera automatiquement en statut "Payée" ! 🎉`;
  }

  // Analyses
  if (
    message.includes("analyse") ||
    message.includes("test") ||
    message.includes("examen")
  ) {
    return `🔬 **Gestion des analyses médicales**

**Créer une analyse :**
1. 🧪 Menu → "Analyses"
2. ➕ "Nouvelle Analyse"
3. 👤 Sélectionner patient
4. 📋 Type d'analyse :
   • Hématologie (NFS, VS...)
   • Biochimie (Glycémie, Urée...)
   • Microbiologie (ECBU...)
   • Immunologie (Sérologies...)
5. ⏰ Délai de traitement
6. 💾 Enregistrer

**Statuts :**
• ⏳ En attente
• 🔄 En cours
• ✅ Terminée
• 📧 Notifier patient

**Résultats :** Saisissables une fois l'analyse terminée`;
  }

  // Tâches
  if (
    message.includes("tâche") ||
    message.includes("task") ||
    message.includes("todo")
  ) {
    return `📋 **Gestion des tâches**

**Créer une tâche :**
1. ✅ Menu → "Tâches"
2. ➕ "Nouvelle Tâche"
3. 📝 Informations :
   • Titre et description
   • 🏷️ Priorité (Haute/Moyenne/Basse)
   • 👤 Assigner à...
   • 📅 Date et heure
   • 🔗 Patient lié (optionnel)
4. 💾 Sauvegarder

**Gestion :**
• ✅ Cocher pour terminer
• 🔍 Filtrer par statut/priorité
• 📊 Vue du jour/semaine
• 📈 Suivi de progression

**Priorités :** 🔴 Haute • 🟡 Moyenne • 🟢 Basse`;
  }

  // Utilisateurs
  if (
    message.includes("utilisateur") ||
    message.includes("compte") ||
    message.includes("user")
  ) {
    return `👥 **Gestion des utilisateurs** (Admin)

**Ajouter un utilisateur :**
1. 🔐 Menu → "Utilisateurs"
2. ➕ "Nouvel Utilisateur"
3. 📝 Infos :
   • Nom, Prénom, Email
   • 🔑 Mot de passe
   • 🏷️ Rôle

**Rôles & Permissions :**
• 👑 Admin : Accès total
• 👨‍⚕️ Médecin : Patients + Analyses
• 📞 Réceptionniste : Patients + Factures
• 🔬 Technicien : Analyses + Tâches

**Actions :**
• ✏️ Modifier
• 🔒 Désactiver
• 🗑️ Supprimer
• 📧 Renvoyer invitation`;
  }

  // Médecins
  if (
    message.includes("médecin") ||
    message.includes("doctor") ||
    message.includes("docteur")
  ) {
    return `👨‍⚕️ **Gestion des médecins**

**Ajouter un médecin :**
1. 🩺 Menu → "Médecins"
2. ➕ "Nouveau Médecin"
3. 📝 Informations :
   • Nom et Prénom
   • 🏥 Spécialité
   • 📞 Contact
   • 📧 Email
   • 🏢 Établissement

**Utilisation :**
• 🔗 Associer aux patients
• 📋 Assigner aux analyses
• 📊 Historique prescriptions

Les médecins peuvent suivre leurs patients ! 🩺`;
  }

  // Dashboard
  if (
    message.includes("dashboard") ||
    message.includes("statistique") ||
    message.includes("rapport")
  ) {
    return `📊 **Dashboard - Vue d'ensemble**

**Statistiques temps réel :**
• 👥 Total patients
• 🔬 Analyses en cours
• 💰 Factures en attente
• 💵 Revenu mensuel
• 📋 Tâches du jour
• 📈 Taux d'occupation

**Graphiques disponibles :**
• 📈 Évolution du CA
• 👥 Croissance patients
• 🔬 Analyses par type
• 💰 Revenus mensuels

**Widgets :**
• Patients récents
• Factures urgentes
• Tâches prioritaires
• Activités récentes

Données mises à jour en temps réel ! ⚡`;
  }

  // Sécurité / Mot de passe
  if (
    message.includes("mot de passe") ||
    message.includes("password") ||
    message.includes("sécurité")
  ) {
    return `🔒 **Changer votre mot de passe**

**Étapes :**
1. 👤 Cliquez sur votre profil (en haut à droite)
2. ⚙️ "Paramètres"
3. 🔐 Onglet "Sécurité"
4. 🔑 Entrez :
   • Mot de passe actuel
   • Nouveau mot de passe
   • Confirmation
5. ✅ "Enregistrer"

**Conseils de sécurité :**
• 🔢 Minimum 8 caractères
• 🔤 Majuscules + minuscules
• 🔢 Chiffres + caractères spéciaux
• 🚫 Ne jamais partager
• 🔄 Changer régulièrement

**2FA disponible** pour plus de sécurité ! 🛡️`;
  }

  // Réponse par défaut - Menu interactif
  return `Je suis votre assistant SmartLabo ! 🤖

**Choisissez un sujet :**

**📋 Gestion**
• "Comment ajouter un patient ?"
• "Comment créer une facture ?"
• "Comment gérer les tâches ?"

**🔬 Analyses**
• "Comment créer une analyse ?"
• "Quels types d'analyses sont disponibles ?"

**👥 Administration**
• "Comment ajouter un utilisateur ?"
• "Comment gérer les médecins ?"

**⚙️ Paramètres**
• "Comment changer mon mot de passe ?"
• "Comment voir les statistiques ?"

Posez-moi votre question ! 💬`;
}

module.exports = router;
