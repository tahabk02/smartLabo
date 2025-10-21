import React from "react";
import ChatWidget from "../components/ChatWidget";
import AIAgent from "../components/AIAgent";
import ConversationMonitor from "../components/ConversationMonitor";

const AIPage = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>🤖 SmartLabo AI Dashboard</h1>

      <section style={{ margin: "2rem 0" }}>
        <ChatWidget />
      </section>

      <section style={{ margin: "2rem 0" }}>
        <AIAgent />
      </section>

      <section style={{ margin: "2rem 0" }}>
        <ConversationMonitor />
      </section>
    </div>
  );
};

export default AIPage;
