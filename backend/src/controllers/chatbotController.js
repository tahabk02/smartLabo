const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const openaiService = require("../services/openaiService");
const { v4: uuidv4 } = require("uuid");

exports.startConversation = async (req, res) => {
  try {
    const { patientId, metadata } = req.body;

    const conversation = new Conversation({
      patientId: patientId || null,
      sessionId: uuidv4(),
      metadata: {
        ...metadata,
        startedAt: new Date(),
      },
    });

    await conversation.save();

    res.status(201).json({
      success: true,
      data: {
        conversationId: conversation._id,
        sessionId: conversation.sessionId,
      },
    });
  } catch (error) {
    console.error("Start Conversation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start conversation",
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Sauvegarder le message utilisateur
    const userMessage = new Message({
      conversationId,
      sender: "user",
      content: content.trim(),
    });
    await userMessage.save();

    // Récupérer l'historique
    const history = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(10)
      .select("sender content");

    const conversationHistory = history.map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.content,
    }));

    // Obtenir la réponse du chatbot
    const startTime = Date.now();
    const aiResponse = await openaiService.getChatbotResponse(
      content,
      conversationHistory.slice(0, -1) // Exclure le dernier message
    );
    const processingTime = Date.now() - startTime;

    // Sauvegarder la réponse du bot
    const botMessage = new Message({
      conversationId,
      sender: "bot",
      content: aiResponse.content,
      metadata: {
        processingTime,
        timestamp: new Date(),
      },
    });
    await botMessage.save();

    res.status(200).json({
      success: true,
      data: {
        message: botMessage,
        tokens: aiResponse.tokens,
      },
    });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process message",
    });
  }
};

exports.getConversationHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversationId }).sort({
      createdAt: 1,
    });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Get History Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversation history",
    });
  }
};

exports.getAllConversations = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = status ? { status } : {};

    const conversations = await Conversation.find(query)
      .populate("patientId", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Conversation.countDocuments(query);

    res.status(200).json({
      success: true,
      data: conversations,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get Conversations Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
    });
  }
};

exports.closeConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { rating } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Générer un résumé
    const messages = await Message.find({ conversationId });
    const summary = await openaiService.generateConversationSummary(messages);

    conversation.status = "closed";
    conversation.metadata.endedAt = new Date();
    conversation.summary = summary;
    if (rating) conversation.rating = rating;

    await conversation.save();

    res.status(200).json({
      success: true,
      message: "Conversation closed successfully",
      data: conversation,
    });
  } catch (error) {
    console.error("Close Conversation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to close conversation",
    });
  }
};
