const openai = require("../config/openai");

class OpenAIService {
  // Chatbot - Répondre aux questions générales
  async getChatbotResponse(userMessage, conversationHistory = []) {
    try {
      const systemPrompt = `Tu es un assistant médical virtuel pour un laboratoire d'analyses médicales au Maroc.
Tu dois répondre aux questions concernant:
- Les horaires d'ouverture (Lun-Ven: 8h-18h, Sam: 8h-13h)
- Les types d'analyses disponibles (sang, urine, microbiologie, etc.)
- Les prix moyens (analyses de base: 100-300 DH)
- La préparation pour les analyses (jeûne, etc.)
- Les délais de résultats (24-72h selon le type)

Règles importantes: 
1. Réponds UNIQUEMENT aux questions sur le laboratoire
2. Pour les questions médicales, redirige vers un médecin
3. Sois courtois et professionnel
4. Utilise un français/darija accessible
5. Si tu ne sais pas, dis-le clairement`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: userMessage },
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      return {
        content: response.choices[0].message.content,
        tokens: response.usage.total_tokens,
      };
    } catch (error) {
      console.error("OpenAI Chatbot Error:", error);
      throw new Error("Failed to generate chatbot response");
    }
  }

  // AI Agent - Interpréter les résultats d'analyses
  async interpretAnalysisResults(extractedText, patientInfo = {}) {
    try {
      const systemPrompt = `Tu es un médecin expert en analyses médicales.
Analyse le document d'analyse médicale fourni et génère:
1. Un résumé compréhensible pour le patient
2. Une explication détaillée de chaque paramètre
3. Les valeurs hors normes avec leur signification
4. Des recommandations générales
5. Les points nécessitant une consultation médicale urgente

IMPORTANT:
- Utilise un langage simple et accessible
- Évite le jargon médical complexe
- Indique clairement ce qui est normal vs anormal
- Recommande TOUJOURS de consulter un médecin pour interprétation complète
- Ne fais PAS de diagnostic médical`;

      const userPrompt = `Patient: ${patientInfo.name || "Non spécifié"}
Âge: ${patientInfo.age || "Non spécifié"}
Sexe: ${patientInfo.gender || "Non spécifié"}

Résultats d'analyse:
${extractedText}

Fournis une interprétation complète et structurée.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      return this.parseInterpretation(response.choices[0].message.content);
    } catch (error) {
      console.error("OpenAI Interpretation Error:", error);
      throw new Error("Failed to interpret analysis results");
    }
  }

  // Parser la réponse structurée
  parseInterpretation(content) {
    // Logique pour extraire les sections
    return {
      summary: this.extractSection(content, "résumé", "explication"),
      details: this.extractSection(content, "explication", "valeurs"),
      recommendations: this.extractList(content, "recommandations"),
      concerns: this.extractList(content, "attention", "urgente"),
    };
  }

  extractSection(text, startKeyword, endKeyword) {
    const regex = new RegExp(
      `${startKeyword}[:\\s]+(.*?)(?=${endKeyword}|$)`,
      "is"
    );
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  }

  extractList(text, ...keywords) {
    const lists = [];
    const regex = /[-•]\s*(.+)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      lists.push(match[1].trim());
    }
    return lists;
  }

  // Générer un résumé de conversation
  async generateConversationSummary(messages) {
    try {
      const conversation = messages
        .map((m) => `${m.sender}: ${m.content}`)
        .join("\n");

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Génère un résumé concis de cette conversation entre un patient et un chatbot de laboratoire.",
          },
          { role: "user", content: conversation },
        ],
        temperature: 0.5,
        max_tokens: 200,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("OpenAI Summary Error:", error);
      return "Résumé non disponible";
    }
  }
}

module.exports = new OpenAIService();
