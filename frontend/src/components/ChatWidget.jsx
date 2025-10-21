import styles from "./ChatWidget.module.css";
import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Trash2, RefreshCw, Copy, Check } from "lucide-react";

const ChatWidget = ({ conversationId, onNewConversation }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem("token");

  // Auto-scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Charger l'historique de la conversation
  useEffect(() => {
    if (!conversationId) {
      // Message de bienvenue si nouvelle conversation
      setMessages([
        {
          sender: "bot",
          text: "👋 Bonjour ! Je suis votre assistant SmartLabo. Comment puis-je vous aider aujourd'hui ?",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:5000/api/chatbot/conversations/${conversationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();

        if (data.success) {
          const formattedMessages = data.data.map((msg) => ({
            sender: msg.sender === "bot" ? "bot" : "user",
            text: msg.content,
            timestamp: new Date(msg.createdAt || Date.now()),
          }));
          setMessages(formattedMessages);
        } else {
          setError("Impossible de charger l'historique");
        }
      } catch (error) {
        console.error("Failed to fetch conversation history:", error);
        setError("Erreur de connexion au serveur");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [conversationId, token]);

  // Simuler la frappe du bot
  const simulateTyping = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1500);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      sender: "user",
      text: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    simulateTyping();

    try {
      const response = await fetch("http://localhost:5000/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: conversationId || undefined,
          content: input.trim(),
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.message) {
        const botMessage = {
          sender: "bot",
          text: data.data.message.content,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);

        // Si nouvelle conversation créée, mettre à jour l'ID
        if (data.data.conversationId && !conversationId && onNewConversation) {
          onNewConversation(data.data.conversationId);
        }
      } else {
        throw new Error(data.message || "Erreur inconnue");
      }
    } catch (error) {
      console.error("Send message error:", error);
      setError("Impossible d'envoyer le message");

      const errorMessage = {
        sender: "bot",
        text: "⚠️ Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    if (
      window.confirm("Êtes-vous sûr de vouloir effacer cette conversation ?")
    ) {
      setMessages([
        {
          sender: "bot",
          text: "👋 Conversation effacée. Comment puis-je vous aider ?",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleCopyMessage = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Suggestions de questions
  const suggestions = [
    "Comment ajouter un nouveau patient ?",
    "Comment créer une facture ?",
    "Où voir les analyses en cours ?",
    "Comment gérer les tâches ?",
  ];

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  return (
    <div className={styles["chat-widget"]}>
      {/* Header */}
      <div className={styles["chat-header"]}>
        <div className={styles["header-info"]}>
          <div className={styles["bot-avatar"]}>
            <Bot size={24} />
          </div>
          <div className={styles["header-text"]}>
            <h3>Assistant SmartLabo</h3>
            <span className={styles["status-indicator"]}>
              <span className={styles["status-dot"]}></span>
              En ligne
            </span>
          </div>
        </div>
        <div className={styles["header-actions"]}>
          <button
            className={styles["icon-btn"]}
            onClick={() => window.location.reload()}
            title="Rafraîchir"
          >
            <RefreshCw size={18} />
          </button>
          <button
            className={styles["icon-btn"]}
            onClick={handleClearChat}
            title="Effacer la conversation"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={styles["chat-messages"]}>
        {messages.length === 0 && !loading && (
          <div className={styles["empty-state"]}>
            <Bot size={64} className={styles["empty-icon"]} />
            <h3>Commencez une conversation</h3>
            <p>Posez-moi des questions sur SmartLabo</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message-wrapper ${
              msg.sender === "user" ? "user-message" : "bot-message"
            }`}
          >
            <div className={styles["message-avatar"]}>
              {msg.sender === "user" ? <User size={20} /> : <Bot size={20} />}
            </div>

            <div className={`message-bubble ${msg.isError ? "error" : ""}`}>
              <div className={styles["message-content"]}>{msg.text}</div>
              <div className={styles["message-footer"]}>
                <span className={styles["message-time"]}>
                  {formatTime(msg.timestamp)}
                </span>
                {msg.sender === "bot" && !msg.isError && (
                  <button
                    className={styles["copy-btn"]}
                    onClick={() => handleCopyMessage(msg.text, index)}
                    title="Copier"
                  >
                    {copiedIndex === index ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div
            className={styles["message-wrapper"] + " " + styles["bot-message"]}
          >
            <div className={styles["message-avatar"]}>
              <Bot size={20} />
            </div>
            <div className={styles["message-bubble"] + " " + styles["typing"]}>
              <div className={styles["typing-indicator"]}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {error && <div className={styles["error-banner"]}>⚠️ {error}</div>}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && messages[0].sender === "bot" && (
        <div className={styles["suggestions"]}>
          <p className={styles["suggestions-label"]}>Suggestions :</p>
          <div className={styles["suggestions-grid"]}>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className={styles["suggestion-chip"]}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className={styles["chat-input-container"]}>
        <div className={styles["input-wrapper"]}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tapez votre message... (Shift+Entrée pour nouvelle ligne)"
            className={styles["chat-input"]}
            rows={1}
            disabled={loading || isTyping}
          />
          <button
            onClick={handleSend}
            className={styles["send-btn"]}
            disabled={!input.trim() || loading || isTyping}
            title="Envoyer (Entrée)"
          >
            <Send size={20} />
          </button>
        </div>
        <p className={styles["input-hint"]}>
          💡 Astuce : Posez des questions sur les fonctionnalités de SmartLabo
        </p>
      </div>
    </div>
  );
};

export default ChatWidget;
