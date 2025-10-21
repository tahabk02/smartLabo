import styles from "./AIAgent.module.css";
import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
  FileCheck,
  Brain,
} from "lucide-react";

const AIAgent = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Validation du fichier
  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      return "Format de fichier non supporté. Formats acceptés : PDF, TXT, DOC, DOCX, JPG, PNG";
    }

    if (file.size > maxSize) {
      return "Le fichier est trop volumineux. Taille maximale : 10MB";
    }

    return null;
  };

  // Gestion de l'upload
  const handleFileUpload = async (selectedFile) => {
    if (!selectedFile) return;

    // Validation
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setError("");
    setResult("");
    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Simulation de progression (remplacer par vraie progression si l'API le supporte)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const res = await fetch("http://localhost:5000/api/ai-agent/analyse", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data.analysis);
      setError("");
    } catch (err) {
      console.error("Erreur lors de l'analyse:", err);
      setError(
        err.message ||
          "Erreur lors de l'analyse du fichier. Veuillez réessayer."
      );
      setFile(null);
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Gestion du changement de fichier
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileUpload(selectedFile);
    }
  };

  // Gestion du drag & drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Réinitialiser
  const handleReset = () => {
    setFile(null);
    setResult("");
    setError("");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Obtenir l'icône du fichier
  const getFileIcon = (fileName) => {
    const ext = fileName.split(".").pop().toLowerCase();
    if (ext === "pdf") return "📄";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["jpg", "jpeg", "png"].includes(ext)) return "🖼️";
    return "📄";
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className={styles["ai-agent-container"]}>
      <div className={styles["ai-agent-header"]}>
        <div className={styles["header-icon"]}>
          <Brain size={32} />
        </div>
        <div className={styles["header-content"]}>
          <h2>🧠 Analyse Médicale par IA</h2>
          <p>
            Téléchargez un document médical pour une analyse automatique par
            intelligence artificielle
          </p>
        </div>
      </div>

      <div className={styles["ai-agent-body"]}>
        {/* Zone de téléchargement */}
        <div
          className={`upload-zone ${dragActive ? "drag-active" : ""} ${
            file ? "has-file" : ""
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !loading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png"
            style={{ display: "none" }}
            disabled={loading}
          />

          {!file && !loading && (
            <div className={styles["upload-content"]}>
              <div className={styles["upload-icon"]}>
                <Upload size={48} />
              </div>
              <h3>Glissez-déposez votre fichier ici</h3>
              <p>ou cliquez pour parcourir</p>
              <div className={styles["upload-formats"]}>
                <span className={styles["format-badge"]}>PDF</span>
                <span className={styles["format-badge"]}>TXT</span>
                <span className={styles["format-badge"]}>DOC</span>
                <span className={styles["format-badge"]}>DOCX</span>
                <span className={styles["format-badge"]}>JPG</span>
                <span className={styles["format-badge"]}>PNG</span>
              </div>
              <p className={styles["upload-limit"]}>Taille maximale : 10MB</p>
            </div>
          )}

          {loading && (
            <div className={styles["upload-loading"]}>
              <Loader className={styles["spinner"]} size={48} />
              <h3>Analyse en cours...</h3>
              <div className={styles["progress-bar"]}>
                <div
                  className={styles["progress-fill"]}
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p>{uploadProgress}% terminé</p>
            </div>
          )}

          {file && !loading && (
            <div className={styles["file-preview"]}>
              <div className={styles["file-icon-large"]}>
                {getFileIcon(file.name)}
              </div>
              <div className={styles["file-details"]}>
                <div className={styles["file-name"]}>{file.name}</div>
                <div className={styles["file-size"]}>
                  {formatFileSize(file.size)}
                </div>
              </div>
              <button
                className={styles["remove-file-btn"]}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                title="Supprimer le fichier"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className={styles["alert"] + " " + styles["alert-error"]}>
            <AlertCircle size={20} />
            <div className={styles["alert-content"]}>
              <strong>Erreur</strong>
              <p>{error}</p>
            </div>
            <button
              className={styles["alert-close"]}
              onClick={() => setError("")}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Résultat de l'analyse */}
        {result && !loading && (
          <div className={styles["result-container"]}>
            <div className={styles["result-header"]}>
              <div className={styles["result-icon"]}>
                <FileCheck size={24} />
              </div>
              <h3>Résultat de l'analyse</h3>
              <div className={styles["result-badge"]}>
                <CheckCircle size={16} />
                <span>Analyse terminée</span>
              </div>
            </div>

            <div className={styles["result-body"]}>
              <div className={styles["result-content"]}>{result}</div>
            </div>

            <div className={styles["result-actions"]}>
              <button className={styles["btn-secondary"]} onClick={handleReset}>
                <Upload size={18} />
                Nouvelle analyse
              </button>
              <button
                className={styles["btn-primary"]}
                onClick={() => {
                  navigator.clipboard.writeText(result);
                  alert("Résultat copié dans le presse-papiers !");
                }}
              >
                📋 Copier le résultat
              </button>
            </div>
          </div>
        )}

        {/* Informations
        {!file && !loading && !result && (
          <div className={styles["info-cards"]}>
            <div className={styles["info-card"]}>
              <div className={styles["info-icon"]}>🔒</div>
              <h4>Sécurisé</h4>
              <p>
                Vos données sont chiffrées et traitées de manière confidentielle
              </p>
            </div>
            <div className={styles["info-card"]}>
              <div className={styles["info-icon"]}>⚡</div>
              <h4>Rapide</h4>
              <p>Analyse en quelques secondes grâce à notre IA avancée</p>
            </div>
            <div className={styles["info-card"]}>
              <div className={styles["info-icon"]}>🎯</div>
              <h4>Précis</h4>
              <p>
                Résultats fiables basés sur des milliers d'analyses médicales
              </p>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default AIAgent;
