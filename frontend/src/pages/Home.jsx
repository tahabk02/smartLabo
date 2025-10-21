import styles from "./Home.module.css";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState, useEffect, useCallback } from "react";

const Home = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [activeCard, setActiveCard] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Gestion du scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animation au chargement
  useEffect(() => {
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      document.body.style.overflow = "unset";
    }, 100);
  }, []);

  const features = [
    {
      icon: "👥",
      title: "Gestion des Patients",
      description:
        "Système complet de gestion des dossiers médicaux avec historique détaillé, recherche avancée et archivage automatique",
      color: "#3b82f6",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      stats: "2K+ Patients",
    },
    {
      icon: "🔬",
      title: "Analyses Médicales",
      description:
        "Enregistrement en temps réel des analyses biologiques avec validation automatique et alertes intelligentes",
      color: "#8b5cf6",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      stats: "50K+ Analyses",
    },
    {
      icon: "📄",
      title: "Facturation Intelligente",
      description:
        "Automatisation complète de la facturation avec génération de devis, suivi des paiements et relances automatiques",
      color: "#10b981",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      stats: "99.9% Précision",
    },
    {
      icon: "📊",
      title: "Suivi des Tâches",
      description:
        "Gestion collaborative du workflow avec attribution des tâches, notifications en temps réel et tableau de bord personnalisé",
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      stats: "Temps réel",
    },
    {
      icon: "📈",
      title: "Rapports & Analytics",
      description:
        "Tableaux de bord analytiques avancés avec graphiques interactifs, KPIs en temps réel et exports personnalisables",
      color: "#ef4444",
      gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
      stats: "Analytics IA",
    },
    {
      icon: "🔒",
      title: "Sécurité Maximale",
      description:
        "Chiffrement de bout en bout, authentification multi-facteurs, sauvegarde automatique et conformité RGPD garantie",
      color: "#06b6d4",
      gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      stats: "ISO 27001",
    },
  ];

  const stats = [
    { number: "99.9%", label: "Uptime Garanti", icon: "✓", color: "#10b981" },
    { number: "24/7", label: "Support Premium", icon: "⏰", color: "#3b82f6" },
    {
      number: "500+",
      label: "Laboratoires Actifs",
      icon: "🏥",
      color: "#8b5cf6",
    },
    { number: "50K+", label: "Analyses/Mois", icon: "📊", color: "#f59e0b" },
  ];

  const testimonials = [
    {
      text: "SmartLabo a révolutionné notre gestion quotidienne. Gain de temps considérable et efficacité maximale !",
      author: "Dr. Sarah Martin",
      role: "Directrice - Lab Excellence",
      rating: 5,
      avatar: "SM",
    },
    {
      text: "Interface intuitive et support réactif. Je recommande vivement cette solution à tous les laboratoires.",
      author: "Dr. Ahmed Bennani",
      role: "Biologiste - MedLab Pro",
      rating: 5,
      avatar: "AB",
    },
    {
      text: "La meilleure plateforme du marché. Fonctionnalités complètes, fiables et un ROI impressionnant.",
      author: "Dr. Marie Dubois",
      role: "Responsable - BioAnalyse+",
      rating: 5,
      avatar: "MD",
    },
  ];

  // Smooth scroll
  const scrollToSection = useCallback((sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className={styles["home-page"]}>
      {/* Hero Section */}
      <section className={styles["hero-section"]} id="hero">
        <div className={styles["hero-background"]}>
          <div className={styles["hero-overlay"]}></div>
          <div className={styles["animated-shapes"]}>
            <div className={styles["shape"] + " " + styles["shape-1"]}></div>
            <div className={styles["shape"] + " " + styles["shape-2"]}></div>
            <div className={styles["shape"] + " " + styles["shape-3"]}></div>
            <div className={styles["shape"] + " " + styles["shape-4"]}></div>
          </div>
        </div>

        <div className={styles["hero-content"]}>
          <div className={styles["hero-badge"]}>
            <span className={styles["badge-icon"]}>✨</span>
            <span className={styles["badge-text"]}>
              Plateforme N°1 au Maroc
            </span>
            <span className={styles["badge-pulse"]}></span>
          </div>

          <h1 className={styles["hero-title"]}>
            Transformez votre <br />
            <span className={styles["gradient-text"]}>Laboratoire Médical</span>
          </h1>

          <p className={styles["hero-subtitle"]}>
            Solution tout-en-un propulsée par l'IA pour digitaliser, automatiser
            et optimiser l'intégralité de votre laboratoire médical. Rejoignez
            l'excellence technologique.
          </p>

          {!isAuthenticated ? (
            <div className={styles["cta-buttons"]}>
              <Link
                to="/login"
                className={
                  styles["btn"] +
                  " " +
                  styles["btn-primary"] +
                  " " +
                  styles["btn-glow"]
                }
              >
                <span className={styles["btn-text"]}>Se Connecter</span>
                <span className={styles["btn-icon"]}>→</span>
                <div className={styles["btn-shine"]}></div>
              </Link>
              <Link
                to="/register"
                className={
                  styles["btn"] +
                  " " +
                  styles["btn-secondary"] +
                  " " +
                  styles["btn-glass"]
                }
              >
                <span className={styles["btn-text"]}>
                  Essai Gratuit 30 jours
                </span>
                <span className={styles["btn-badge"]}>🎁</span>
              </Link>
            </div>
          ) : (
            <Link
              to="/dashboard"
              className={
                styles["btn"] +
                " " +
                styles["btn-primary"] +
                " " +
                styles["btn-large"] +
                " " +
                styles["btn-glow"]
              }
            >
              <span className={styles["btn-text"]}>Accéder au Dashboard</span>
              <span className={styles["btn-icon"]}>🚀</span>
              <div className={styles["btn-shine"]}></div>
            </Link>
          )}

          {/* Stats Grid */}
          <div className={styles["stats-grid"]}>
            {stats.map((stat, index) => (
              <div
                key={index}
                className={styles["stat-card"]}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={styles["stat-icon"]}
                  style={{ color: stat.color }}
                >
                  {stat.icon}
                </div>
                <div
                  className={styles["stat-number"]}
                  style={{ color: stat.color }}
                >
                  {stat.number}
                </div>
                <div className={styles["stat-label"]}>{stat.label}</div>
                <div
                  className={styles["stat-bar"]}
                  style={{ backgroundColor: stat.color }}
                ></div>
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className={styles["trust-section"]}>
            <span className={styles["trust-text"]}>Approuvé par</span>
            <div className={styles["trust-badges"]}>
              <span className={styles["trust-badge"]}>🏆 ISO 27001</span>
              <span className={styles["trust-badge"]}>✓ RGPD Certifié</span>
              <span className={styles["trust-badge"]}>🔒 SSL Sécurisé</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          className={styles["scroll-indicator"]}
          onClick={() => scrollToSection("features")}
        >
          <span className={styles["scroll-text"]}>Découvrir</span>
          <div className={styles["scroll-arrow"]}>↓</div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles["features-section"]} id="features">
        <div className={styles["section-header"]}>
          <span className={styles["section-badge"]}>🚀 Fonctionnalités</span>
          <h2 className={styles["section-title"]}>
            Tout ce dont vous avez besoin,
            <br />
            <span className={styles["highlight"]}>et bien plus encore</span>
          </h2>
          <p className={styles["section-subtitle"]}>
            Une suite complète d'outils professionnels pour gérer votre
            laboratoire avec excellence
          </p>
        </div>

        <div className={styles["features-grid"]}>
          {features.map((feature, index) => (
            <div
              key={index}
              className={`feature-card ${activeCard === index ? "active" : ""}`}
              onMouseEnter={() => setActiveCard(index)}
              onMouseLeave={() => setActiveCard(null)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={styles["feature-card-inner"]}>
                <div className={styles["feature-header"]}>
                  <div
                    className={styles["feature-icon-wrapper"]}
                    style={{ background: feature.gradient }}
                  >
                    <span className={styles["feature-emoji"]}>
                      {feature.icon}
                    </span>
                    <div className={styles["icon-glow"]}></div>
                  </div>
                  <div className={styles["feature-badge"]}>Premium</div>
                </div>

                <h3 className={styles["feature-title"]}>{feature.title}</h3>
                <p className={styles["feature-description"]}>
                  {feature.description}
                </p>

                <div className={styles["feature-footer"]}>
                  <button
                    className={styles["feature-link"]}
                    style={{ color: feature.color }}
                  >
                    <span>Découvrir</span>
                    <span className={styles["link-arrow"]}>→</span>
                  </button>
                  <div className={styles["feature-stats"]}>
                    <span className={styles["stat-item"]}>{feature.stats}</span>
                  </div>
                </div>
              </div>
              <div
                className={styles["feature-glow"]}
                style={{ background: feature.gradient }}
              ></div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={styles["testimonials-section"]} id="testimonials">
        <div className={styles["section-header"]}>
          <span className={styles["section-badge"]}>💬 Témoignages</span>
          <h2 className={styles["section-title"]}>Ce que disent nos clients</h2>
          <p className={styles["section-subtitle"]}>
            Rejoignez des centaines de laboratoires satisfaits
          </p>
        </div>

        <div className={styles["testimonials-grid"]}>
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={styles["testimonial-card"]}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className={styles["quote-icon"]}>"</div>
              <div className={styles["testimonial-rating"]}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className={styles["star"]}>
                    ⭐
                  </span>
                ))}
              </div>
              <p className={styles["testimonial-text"]}>{testimonial.text}</p>
              <div className={styles["testimonial-author"]}>
                <div className={styles["author-avatar"]}>
                  {testimonial.avatar}
                </div>
                <div className={styles["author-info"]}>
                  <div className={styles["author-name"]}>
                    {testimonial.author}
                  </div>
                  <div className={styles["author-role"]}>
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles["cta-section"]}>
        <div className={styles["cta-background"]}>
          <div className={styles["cta-shapes"]}>
            <div className={styles["cta-shape"]}></div>
            <div className={styles["cta-shape"]}></div>
            <div className={styles["cta-shape"]}></div>
          </div>
        </div>
        <div className={styles["cta-content"]}>
          <h2 className={styles["cta-title"]}>
            Prêt à révolutionner votre laboratoire ?
          </h2>
          <p className={styles["cta-text"]}>
            Rejoignez plus de 500 laboratoires qui ont déjà fait le choix de
            l'excellence
          </p>
          {!isAuthenticated && (
            <div className={styles["cta-buttons"]}>
              <Link
                to="/register"
                className={
                  styles["btn"] +
                  " " +
                  styles["btn-primary"] +
                  " " +
                  styles["btn-large"] +
                  " " +
                  styles["btn-glow"]
                }
              >
                <span className={styles["btn-text"]}>
                  Démarrer Gratuitement
                </span>
                <span className={styles["btn-icon"]}>🚀</span>
                <div className={styles["btn-shine"]}></div>
              </Link>
              <Link
                to="/login"
                className={
                  styles["btn"] +
                  " " +
                  styles["btn-outline"] +
                  " " +
                  styles["btn-large"]
                }
              >
                <span className={styles["btn-text"]}>Se Connecter</span>
                <span className={styles["btn-icon"]}>→</span>
              </Link>
            </div>
          )}
          <div className={styles["cta-guarantee"]}>
            <span className={styles["guarantee-icon"]}>✓</span>
            <span>
              Sans engagement • Annulation à tout moment • Support inclus
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles["home-footer"]}>
        <div className={styles["footer-content"]}>
          <div className={styles["footer-main"]}>
            <div className={styles["footer-brand"]}>
              <div className={styles["brand-logo"]}>
                <span className={styles["footer-icon"]}>🔬</span>
                <span className={styles["footer-logo"]}>SmartLabo</span>
              </div>
              <p className={styles["footer-tagline"]}>
                L'avenir de la gestion de laboratoire médical
              </p>
              <div className={styles["social-links"]}>
                <a
                  href="#facebook"
                  className={styles["social-link"]}
                  aria-label="Facebook"
                >
                  📘
                </a>
                <a
                  href="#instagram"
                  className={styles["social-link"]}
                  aria-label="Instagram"
                >
                  📷
                </a>
                <a
                  href="#twitter"
                  className={styles["social-link"]}
                  aria-label="Twitter"
                >
                  🐦
                </a>
                <a
                  href="#linkedin"
                  className={styles["social-link"]}
                  aria-label="LinkedIn"
                >
                  💼
                </a>
              </div>
            </div>

            <div className={styles["footer-links"]}>
              <div className={styles["footer-column"]}>
                <h4>Produit</h4>
                <a href="#features">Fonctionnalités</a>
                <a href="#pricing">Tarifs</a>
                <a href="#demo">Démo</a>
                <a href="#roadmap">Roadmap</a>
              </div>

              <div className={styles["footer-column"]}>
                <h4>Entreprise</h4>
                <a href="#about">À propos</a>
                <a href="#blog">Blog</a>
                <a href="#careers">Carrières</a>
                <a href="#contact">Contact</a>
              </div>

              <div className={styles["footer-column"]}>
                <h4>Support</h4>
                <a href="#help">Centre d'aide</a>
                <a href="#docs">Documentation</a>
                <a href="#api">API</a>
                <a href="#status">Statut</a>
              </div>
            </div>
          </div>

          <div className={styles["footer-bottom"]}>
            <p className={styles["footer-copyright"]}>
              © 2025 SmartLabo. Tous droits réservés.
            </p>
            <div className={styles["footer-legal"]}>
              <a href="#privacy">Confidentialité</a>
              <a href="#terms">Conditions</a>
              <a href="#cookies">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {isVisible && (
        <button
          className={styles["scroll-to-top"]}
          onClick={scrollToTop}
          aria-label="Retour en haut"
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default Home;
