import React, { useMemo } from "react";
import styles from "./PatientProfileTabs.module.css";

const PatientProfileTabs = ({ activeTab, onTabChange }) => {
  // Memoize tabs to avoid recreating on every render
  const tabs = useMemo(
    () => [
      { id: "dossier", label: "Dossier Médical", icon: "📋" },
      { id: "ordonnances", label: "Ordonnances", icon: "💊" },
      { id: "analyses", label: "Analyses", icon: "🧪" },
      { id: "facturation", label: "Facturation", icon: "💰" },
    ],
    []
  );

  const handleTabClick = (tabId) => {
    if (tabId !== activeTab) {
      onTabChange(tabId);
    }
  };

  return (
    <div className={styles.tabs} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tabButton} ${
            activeTab === tab.id ? styles.active : ""
          }`}
          onClick={() => handleTabClick(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          id={`tab-${tab.id}`}
        >
          <span className={styles.tabIcon} aria-hidden="true">
            {tab.icon}
          </span>
          <span className={styles.tabLabel}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default PatientProfileTabs;
