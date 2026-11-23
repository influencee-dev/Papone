import React, { useState, useEffect } from "react";
import {
  CookieConsentState,
  DEFAULT_CONSENT,
  loadStoredConsent,
  persistConsentChoice,
  syncThirdPartyScripts,
  updateGoogleConsentMode,
} from "./utils/consent";

interface Booking {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  tel: string;
  data: string;
  ora?: string;
  persone: string;
  note: string;
  consensoAllergie?: boolean;
  consensoPromozioni?: boolean;
  status: string;
  createdAt: string;
}

function getInitialTab(): "home" | "menu" | "privacy" | "cookie" {
  if (typeof window === "undefined") return "home";
  const hash = window.location.hash.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get("tab")?.toLowerCase();

  if (
    hash === "#menu" ||
    hash.startsWith("#menu-") ||
    path === "/menu" ||
    path === "/menu/" ||
    tabParam === "menu" ||
    params.has("menu")
  ) {
    return "menu";
  }
  if (hash === "#privacy" || path === "/privacy") return "privacy";
  if (hash === "#cookie" || path === "/cookie") return "cookie";
  return "home";
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "privacy" | "cookie">(getInitialTab);
  const [showAdmin, setShowAdmin] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const syncTabFromUrl = () => {
      const nextTab = getInitialTab();
      setActiveTab(nextTab);
    };
    window.addEventListener("hashchange", syncTabFromUrl);
    window.addEventListener("popstate", syncTabFromUrl);
    return () => {
      window.removeEventListener("hashchange", syncTabFromUrl);
      window.removeEventListener("popstate", syncTabFromUrl);
    };
  }, []);
  
  // Cookie Consent States
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [mapConsented, setMapConsented] = useState(false);
  const [cookieConsent, setCookieConsent] = useState<CookieConsentState>(DEFAULT_CONSENT);

  const [tempStatistici, setTempStatistici] = useState(false);
  const [tempMarketing, setTempMarketing] = useState(false);

  useEffect(() => {
    // Caricamento preferenze cookie salvate (valide 6 mesi)
    const stored = loadStoredConsent();
    if (stored) {
      setCookieConsent(stored);
      setTempStatistici(stored.statistici);
      setTempMarketing(stored.marketing);
      updateGoogleConsentMode(stored);
      syncThirdPartyScripts(stored);
    } else {
      setShowCookieBanner(true);
    }
  }, []);

  const saveCookiePreferences = (_necessari: boolean, statistici: boolean, marketing: boolean) => {
    const newConsent = persistConsentChoice(statistici, marketing);
    setCookieConsent(newConsent);
    setTempStatistici(statistici);
    setTempMarketing(marketing);
    if (!marketing) {
      setMapConsented(false);
    }
    updateGoogleConsentMode(newConsent);
    syncThirdPartyScripts(newConsent);
    setShowCookieBanner(false);
    setShowCookieModal(false);
  };

  useEffect(() => {
    if (showCookieModal) {
      setTempStatistici(cookieConsent.statistici);
      setTempMarketing(cookieConsent.marketing);
    }
  }, [showCookieModal, cookieConsent]);
  
  // Booking Form State
  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
    email: "",
    tel: "",
    data: "",
    ora: "19:30",
    persone: "2",
    note: "",
    consensoAllergie: false,
    consensoPromozioni: false,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");

  // Load Bookings for Admin Console
  const fetchBookings = async () => {
    try {
      const resp = await fetch("/api/booking");
      if (resp.ok) {
        const data = await resp.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Errore nel caricamento delle prenotazioni:", err);
    }
  };

  useEffect(() => {
    if (showAdmin) {
      fetchBookings();
    }
  }, [showAdmin]);

  const updateBookingStatus = async (id: string, newStatus: string) => {
    try {
      const resp = await fetch(`/api/booking/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (resp.ok) {
        fetchBookings();
      }
    } catch (err) {
      console.error("Errore aggiornamento stato:", err);
    }
  };

  // Header background color blur on scroll
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle Form Submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccessMessage("");

    const { nome, cognome, email, tel, data, ora, persone } = formData;

    if (!nome.trim()) {
      setFormError("Il campo Nome è obbligatorio.");
      return;
    }
    if (!cognome.trim()) {
      setFormError("Il campo Cognome è obbligatorio.");
      return;
    }
    if (!email.trim()) {
      setFormError("Il campo Email è obbligatorio.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError("Inserisci un indirizzo email valido.");
      return;
    }
    if (!tel.trim()) {
      setFormError("Il campo Telefono è obbligatorio.");
      return;
    }
    const phoneDigits = tel.replace(/\D/g, "");
    if (phoneDigits.length < 6) {
      setFormError("Inserisci un numero di telefono valido.");
      return;
    }
    if (!data.trim()) {
      setFormError("Il campo Data è obbligatorio.");
      return;
    }
    if (!ora.trim()) {
      setFormError("Il campo Orario è obbligatorio.");
      return;
    }
    if (!persone.trim()) {
      setFormError("Il campo Numero Persone è obbligatorio.");
      return;
    }

    setFormLoading(true);

    // 1. Save to backend database
    try {
      const resp = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!resp.ok) {
        throw new Error("Errore durante il salvataggio");
      }
    } catch (err) {
      console.error("Errore di rete o server:", err);
    }

    // 2. Format & Redirect to WhatsApp
    const whatsAppNumber = "393452311789";
    let message = `Ciao Papone! Vorrei richiedere una prenotazione:\n\n`;
    message += `👤 *Nome*: ${formData.nome} ${formData.cognome}\n`;
    message += `📅 *Data*: ${formData.data}\n`;
    message += `⏰ *Orario*: ${formData.ora}\n`;
    message += `👥 *Persone*: ${formData.persone}\n`;
    message += `📞 *Telefono*: ${formData.tel}\n`;
    message += `📧 *Email*: ${formData.email || "Non inserita"}\n`;
    if (formData.note) {
      message += `📝 *Note*: ${formData.note}`;
    }

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${whatsAppNumber}?text=${encodedMessage}`;
    
    // Open in separate frame & set success
    window.open(waUrl, "_blank");

    setFormSuccessMessage("La tua richiesta di prenotazione è stata inviata su WhatsApp! Ti aspettiamo.");
    setFormLoading(false);
    
    // Reset form
    setFormData({
      nome: "",
      cognome: "",
      email: "",
      tel: "",
      data: "",
      ora: "19:30",
      persone: "2",
      note: "",
      consensoAllergie: false,
      consensoPromozioni: false,
    });
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (activeTab !== "home") {
      setActiveTab("home");
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          window.scrollTo({
            top: el.offsetTop - 80,
            behavior: "smooth"
          });
        }
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) {
        window.scrollTo({
          top: el.offsetTop - 80,
          behavior: "smooth"
        });
      }
    }
  };

  const scrollToMenuSection = (id: string) => {
    setMobileMenuOpen(false);
    if (activeTab !== "menu") {
      setActiveTab("menu");
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          window.scrollTo({
            top: el.offsetTop - 90,
            behavior: "smooth"
          });
        }
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) {
        window.scrollTo({
          top: el.offsetTop - 90,
          behavior: "smooth"
        });
      }
    }
  };

  return (
    <div className={activeTab === "home" ? "home-page-theme" : "menu-page-theme"}>
      
      {/* 0. ADMIN MANAGER FLOATING BUTTON & SIDECAR PANEL IS NOW REMOVED FOR A CLEAN PUBLIC PREVIEW */}


      {showAdmin && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-md flex justify-end">
          <div className="w-full max-w-2xl bg-neutral-950 p-6 md:p-8 overflow-y-auto border-l border-neutral-800 flex flex-col h-full text-white font-sans">
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-neutral-800">
              <div>
                <h3 className="text-xl font-bold font-mono text-amber-500">Pannello Gestore Papone</h3>
                <p className="text-xs text-neutral-400 font-mono">Archivio delle richieste salvate nel server</p>
              </div>
              <button 
                onClick={() => setShowAdmin(false)}
                className="text-neutral-400 hover:text-white hover:bg-neutral-900 p-2 rounded-lg font-mono text-sm border border-neutral-800"
              >
                CHIUDI [X]
              </button>
            </div>

            <div className="flex-1 space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-neutral-800 rounded-2xl text-neutral-500">
                  <i className="far fa-folder-open text-4xl mb-3 block"></i>
                  Nessuna prenotazione registrata attualmente.
                </div>
              ) : (
                bookings.map((b) => (
                  <div key={b.id} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3 shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-lg tracking-tight text-white mb-1">
                          {b.nome} {b.cognome}
                        </h4>
                        <p className="text-xs text-amber-500 font-mono flex items-center gap-2">
                          <i className="far fa-clock"></i> 
                          Fatto il: {new Date(b.createdAt).toLocaleString("it-IT")}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full font-bold select-none ${
                        b.status === "Confermato" ? "bg-green-950 text-green-400 border border-green-800" :
                        b.status === "Cancellato" ? "bg-red-950 text-red-400 border border-red-800" :
                        "bg-amber-950 text-amber-400 border border-amber-800"
                      }`}>
                        {b.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-neutral-300 font-mono py-2 border-y border-neutral-800/50">
                      <div>
                        <span className="text-xs text-neutral-500 block">DATA RICHIESTA</span>
                        <span className="font-bold text-white">{b.data} {b.ora ? `alle ${b.ora}` : ""}</span>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500 block">N° COPERTI</span>
                        <span className="font-bold text-white">{b.persone} persone</span>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500 block">TELEFONO</span>
                        <a href={`tel:${b.tel}`} className="text-amber-400 underline">{b.tel}</a>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500 block">EMAIL</span>
                        <span className="truncate block font-bold text-neutral-100">{b.email || "Nessuna"}</span>
                      </div>
                    </div>

                    {b.note && (
                      <div className="text-xs bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 text-neutral-400 italic">
                        <strong>Note speciali:</strong> {b.note}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-neutral-500">Modifica Stato:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateBookingStatus(b.id, "Confermato")}
                          className="px-3 py-1 text-xs bg-green-700 hover:bg-green-600 rounded text-white font-bold"
                        >
                          Approva
                        </button>
                        <button
                          onClick={() => updateBookingStatus(b.id, "Cancellato")}
                          className="px-3 py-1 text-xs bg-red-700 hover:bg-red-600 rounded text-white font-bold"
                        >
                          Cancella
                        </button>
                        <button
                          onClick={() => updateBookingStatus(b.id, "In attesa")}
                          className="px-3 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300"
                        >
                          Attesa
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. HEADER */}
      <header 
        style={{
          backgroundColor: scrolled ? "rgba(181, 55, 42, 0.95)" : "#B5372A",
          boxShadow: scrolled ? "0 5px 20px rgba(0,0,0,0.2)" : "none"
        }}
        id="main-header"
      >
        <div className="container">
          <div className="nav-container">
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab("home"); window.scrollTo({ top: 0, behavior: "smooth" }); setMobileMenuOpen(false); }} style={{ display: "flex", alignItems: "center" }}>
              <img src="/logo.png" alt="Papone Dal 1956" className="nav-logo" referrerPolicy="no-referrer" />
            </a>
            
            <nav className="nav-menu hidden md:flex">
              <a 
                href="#home" 
                onClick={(e) => { e.preventDefault(); setActiveTab("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={`nav-link ${activeTab === "home" ? "active" : ""}`}
              >
                Home
              </a>
              <a 
                href="#menu" 
                onClick={(e) => { e.preventDefault(); setActiveTab("menu"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={`nav-link ${activeTab === "menu" ? "active" : ""}`}
              >
                Il Menu
              </a>
            </nav>

            <div className="nav-cta hidden md:block">
              <a href="#prenota" onClick={(e) => { e.preventDefault(); scrollToSection("prenota"); }} className="btn btn-primary">
                Prenota ora
              </a>
            </div>

            <div className="hamburger block md:hidden" id="hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <i className={mobileMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE MENU OVERLAY */}
      <div className={`mobile-menu-overlay ${mobileMenuOpen ? "active" : ""}`} id="mobile-menu">
        <a 
          href="#home" 
          onClick={(e) => { e.preventDefault(); setActiveTab("home"); window.scrollTo({ top: 0, behavior: "smooth" }); setMobileMenuOpen(false); }} 
          className="mobile-link"
        >
          Home
        </a>
        <a 
          href="#menu" 
          onClick={(e) => { e.preventDefault(); setActiveTab("menu"); window.scrollTo({ top: 0, behavior: "smooth" }); setMobileMenuOpen(false); }} 
          className="mobile-link"
        >
          Il Menu
        </a>
        <a 
          href="#prenota" 
          onClick={(e) => { e.preventDefault(); scrollToSection("prenota"); }} 
          className="btn btn-primary" 
          style={{ marginTop: "20px" }}
        >
          Prenota ora
        </a>
      </div>


      {/* ======================= HOME PAGE VIEW ======================= */}
      {activeTab === "home" && (
        <>
          {/* HERO SECTION */}
          <section className="hero">
            <div className="hero-background-image" />
            <div className="hero-overlay"></div>
            <div className="hero-content">
              <span className="hero-label bebas">FOGGIA · DAL 1956</span>
              <h1 className="font-bold tracking-tight">Magnatill' n'emozion!</h1>
              <p className="hero-sub">
                Pub, grill e steakhouse nel cuore di Foggia. Carne selezionata, birre artigianali e atmosfera unica dal 1956.
              </p>
              <div className="hero-btns">
                <a href="#menu" onClick={(e) => { e.preventDefault(); setActiveTab("menu"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="btn btn-primary">
                  Scopri il Menu
                </a>
                <a href="#prenota" onClick={(e) => { e.preventDefault(); scrollToSection("prenota"); }} className="btn btn-primary">
                  Prenota un Tavolo
                </a>
              </div>
            </div>
            <div className="scroll-down" onClick={() => scrollToSection("storia")} style={{ cursor: "pointer" }} title="Scorri giù">
              <i className="fas fa-chevron-down"></i>
            </div>
          </section>

          {/* LA NOSTRA STORIA */}
          <section className="storia" id="storia">
            <div className="storia-text-box">
              <h2>Dal 1956, una storia di fuoco e sapore</h2>
              <p>
                Papone è molto più di un ristorante. Dal 1956 portiamo a Foggia la cultura del vero grill americano, con carni selezionate cotte sulla brace, birre artigianali in spillatura e un'atmosfera che sa di autentico. Una tradizione tramandata con passione, un posto dove tornare sempre.
              </p>
              <div className="storia-badge">Oltre 60 anni di storia</div>
            </div>
          </section>

          {/* IL MENU SHOWCASE */}
          <section className="section-padding" id="il-menu">
            <div className="container">
              <div className="section-title-wrap">
                <span className="section-label bebas">GRILL · BURGER · BIRRA · ANTIPASTI</span>
                <h2 className="section-title font-bold">Lasciati conquistare dal nostro menu</h2>
              </div>

              <div className="menu-cards">
                {/* Card 1 */}
                <div className="menu-card" onClick={() => scrollToMenuSection("menu-steakhouse")} style={{ backgroundImage: "url('/steakhouse.png')" }}>
                  <div className="menu-card-overlay"></div>
                  <h3>STEAKHOUSE</h3>
                  <p style={{ color: "var(--color-text)" }}>
                    Carni pregiate cotte al punto giusto. Fiorentine, ribeye, tagliata, costine BBQ. Solo tagli selezionati.
                  </p>
                </div>
                {/* Card 2 */}
                <div className="menu-card" onClick={() => scrollToMenuSection("menu-burger")} style={{ backgroundImage: "url('/burger&panini.png')" }}>
                  <div className="menu-card-overlay"></div>
                  <h3>BURGER & PANINI</h3>
                  <p style={{ color: "var(--color-text)" }}>
                    Hamburger artigianali con pane brioche fatto in casa, ingredienti freschi e salse originali. Il vero burger foggiano.
                  </p>
                </div>
                {/* Card 3 */}
                <div className="menu-card" onClick={() => scrollToMenuSection("menu-antipasti")} style={{ backgroundImage: "url('/antipasti&grill.png')" }}>
                  <div className="menu-card-overlay"></div>
                  <h3>ANTIPASTI & FRITTI</h3>
                  <p style={{ color: "var(--color-text)" }}>
                    Taglieri di salumi e formaggi locali, bruschette, fritti e assaggi per iniziare al meglio.
                  </p>
                </div>
                {/* Card 4 */}
                <div className="menu-card" onClick={() => scrollToMenuSection("menu-birre")} style={{ backgroundImage: "url('/birreartigianali.png')" }}>
                  <div className="menu-card-overlay"></div>
                  <h3>BIRRE ARTIGIANALI</h3>
                  <p style={{ color: "var(--color-text)" }}>
                    Selezione di birre alla spina e in bottiglia, nazionali e internazionali. Il connubio perfetto con il grill.
                  </p>
                </div>
              </div>

              <div className="menu-cta-wrap" style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                <a href="#menu" onClick={(e) => { e.preventDefault(); setActiveTab("menu"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="btn btn-primary" style={{ padding: "15px 45px", fontSize: "1.3rem" }}>
                  Visualizza il menu completo
                </a>
              </div>
            </div>
          </section>

          {/* L'ATMOSFERA (Infinite Carousel) */}
          <section className="atmosfera" id="atmosfera">
            <div className="container">
              <div className="section-title-wrap">
                <h2 className="section-title font-bold">Da Papone trovi l'atmosfera perfetta</h2>
              </div>
            </div>
            
            <div className="atmosfera-carousel-container">
              <div className="animate-marquee">
                {/* Image Set 1 */}
                <div className="gallery-item">
                  <img src="/atmosfera1.png" alt="Atmosfera 1" />
                </div>
                <div className="gallery-item">
                  <img src="/atmosfera2.png" alt="Atmosfera 2" />
                </div>
                <div className="gallery-item">
                  <img src="/atmosfera3.png" alt="Atmosfera 3" />
                </div>
                <div className="gallery-item">
                  <img src="/atmosfera4.png" alt="Atmosfera 4" />
                </div>
                <div className="gallery-item">
                  <img src="/atmosfera5.png" alt="Atmosfera 5" />
                </div>
                <div className="gallery-item">
                  <img src="/atmosfera6.png" alt="Atmosfera 6" />
                </div>
                {/* Repeat Image Set to make the transition loop perfectly */}
                <div className="gallery-item">
                  <img src="/atmosfera1.png" alt="Atmosfera 1 - Bis" />
                </div>
                <div className="gallery-item">
                  <img src="/atmosfera2.png" alt="Atmosfera 2 - Bis" />
                </div>
                <div className="gallery-item">
                  <img src="/atmosfera3.png" alt="Atmosfera 3 - Bis" />
                </div>
                <div className="gallery-item">
                  <img src="/atmosfera4.png" alt="Atmosfera 4 - Bis" />
                </div>
                <div className="gallery-item">
                  <img src="/atmosfera5.png" alt="Atmosfera 5 - Bis" />
                </div>
                <div className="gallery-item">
                  <img src="/atmosfera6.png" alt="Atmosfera 6 - Bis" />
                </div>
              </div>
            </div>
          </section>

          {/* REPRENOTA */}
          <section className="section-padding prenota animate-fade-in" id="prenota">
            <div className="container">
              <div className="section-title-wrap">
                <h2 className="section-title" style={{ color: "white" }}>Prenota il tuo tavolo</h2>
                <p style={{ color: "rgba(255,255,255,0.8)", maxWidth: "600px", margin: "0 auto" }}>
                  Compila il form qui sotto per inviare la tua richiesta di prenotazione direttamente via WhatsApp.
                </p>
              </div>
              
              <div className="prenota-flex">
                <div className="prenota-form-container" id="brevo-form-placeholder">
                  {formSuccessMessage ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-16 h-16 bg-green-900 border border-green-500 rounded-full flex items-center justify-center mx-auto">
                        <i className="fas fa-check text-green-400 text-2xl"></i>
                      </div>
                      <h3 className="text-2xl font-bold font-mono text-green-400">Richiesta Ricevuta!</h3>
                      <p className="text-sm text-neutral-300 max-w-md mx-auto">{formSuccessMessage}</p>
                      <button 
                        onClick={() => setFormSuccessMessage("")} 
                        className="btn btn-primary"
                        style={{ marginTop: "20px" }}
                      >
                        Invia un'altra richiesta
                      </button>
                    </div>
                  ) : (
                    <form id="booking-form" onSubmit={handleBookingSubmit}>
                      {formError && (
                        <div className="bg-rose-950/50 border border-rose-800 text-rose-200 text-sm p-4 rounded mb-6 flex items-start gap-2 animate-fade-in">
                          <i className="fas fa-exclamation-circle text-rose-400 mt-0.5 flex-shrink-0"></i>
                          <span>{formError}</span>
                        </div>
                      )}
                      <div className="form-grid">
                        <div className="form-group">
                          <label htmlFor="nome">Nome <span className="text-rose-500 font-bold">*</span></label>
                          <input 
                            type="text" 
                            id="nome" 
                            placeholder="Il tuo nome" 
                            required 
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="cognome">Cognome <span className="text-rose-500 font-bold">*</span></label>
                          <input 
                            type="text" 
                            id="cognome" 
                            placeholder="Il tuo cognome" 
                            required
                            value={formData.cognome}
                            onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="email">Email <span className="text-rose-500 font-bold">*</span></label>
                          <input 
                            type="email" 
                            id="email" 
                            placeholder="esempio@mail.com" 
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="tel">Telefono <span className="text-rose-500 font-bold">*</span></label>
                          <input 
                            type="tel" 
                            id="tel" 
                            placeholder="Inserisci numero" 
                            required
                            value={formData.tel}
                            onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="data">Data preferita <span className="text-rose-500 font-bold">*</span></label>
                          <input 
                            type="date" 
                            id="data" 
                            required
                            value={formData.data}
                            onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="ora">Orario preferito <span className="text-rose-500 font-bold">*</span></label>
                          <select 
                            id="ora" 
                            required
                            value={formData.ora}
                            onChange={(e) => setFormData({ ...formData, ora: e.target.value })}
                          >
                            <option value="19:30">19:30</option>
                            <option value="19:45">19:45</option>
                            <option value="20:00">20:00</option>
                            <option value="20:15">20:15</option>
                            <option value="20:30">20:30</option>
                            <option value="20:45">20:45</option>
                            <option value="21:00">21:00</option>
                            <option value="21:15">21:15</option>
                            <option value="21:30">21:30</option>
                            <option value="21:45">21:45</option>
                            <option value="22:00">22:00</option>
                            <option value="22:15">22:15</option>
                            <option value="22:30">22:30</option>
                            <option value="22:45">22:45</option>
                            <option value="23:00">23:00</option>
                            <option value="23:15">23:15</option>
                            <option value="23:30">23:30</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label htmlFor="persone">N° persone <span className="text-rose-500 font-bold">*</span></label>
                          <select 
                            id="persone" 
                            required
                            value={formData.persone}
                            onChange={(e) => setFormData({ ...formData, persone: e.target.value })}
                          >
                            <option value="1">1 Persona</option>
                            <option value="2">2 Persone</option>
                            <option value="3">3 Persone</option>
                            <option value="4">4 Persone</option>
                            <option value="5">5 Persone</option>
                            <option value="6">6 Persone</option>
                            <option value="7">7 Persone</option>
                            <option value="8">8 Persone</option>
                            <option value="8+">Oltre 8 persone</option>
                          </select>
                        </div>
                        <div className="form-group full">
                          <label htmlFor="note">Note / Richieste speciali</label>
                          <textarea 
                            id="note" 
                            rows={4} 
                            placeholder="Eventuali allergie, bambini, o preferenze tavolo..."
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                          ></textarea>
                        </div>

                        {/* Caselle facoltative (mai preselezionate e mai obbligatorie) */}
                        <div className="form-group full space-y-3 pt-1">
                          <label
                            htmlFor="consenso-allergie"
                            className="flex items-start gap-3 cursor-pointer"
                            style={{ fontFamily: "var(--font-body)", textTransform: "none", letterSpacing: "normal", color: "#e5e5e5", fontSize: "0.875rem", lineHeight: "1.4" }}
                          >
                            <input
                              type="checkbox"
                              id="consenso-allergie"
                              checked={formData.consensoAllergie}
                              onChange={(e) => setFormData({ ...formData, consensoAllergie: e.target.checked })}
                              className="mt-1 h-4 w-4 shrink-0 accent-amber-500 cursor-pointer"
                              style={{ padding: 0 }}
                            />
                            <span>
                              Acconsento all&apos;uso delle informazioni su allergie o intolleranze che ho indicato nelle note, solo per preparare in sicurezza la mia serata.
                            </span>
                          </label>

                          <label
                            htmlFor="consenso-promozioni"
                            className="flex items-start gap-3 cursor-pointer"
                            style={{ fontFamily: "var(--font-body)", textTransform: "none", letterSpacing: "normal", color: "#e5e5e5", fontSize: "0.875rem", lineHeight: "1.4" }}
                          >
                            <input
                              type="checkbox"
                              id="consenso-promozioni"
                              checked={formData.consensoPromozioni}
                              onChange={(e) => setFormData({ ...formData, consensoPromozioni: e.target.checked })}
                              className="mt-1 h-4 w-4 shrink-0 accent-amber-500 cursor-pointer"
                              style={{ padding: 0 }}
                            />
                            <span>
                              Voglio ricevere via WhatsApp, SMS o email novità, serate a tema ed eventi di Papone Dal 1956. Posso disiscrivermi quando voglio.
                            </span>
                          </label>
                        </div>

                        <div className="form-group full">
                          <button 
                            type="submit" 
                            className="btn btn-primary flex items-center justify-center gap-2" 
                            style={{ backgroundColor: "#25D366", color: "white" }}
                            disabled={formLoading}
                          >
                            {formLoading ? (
                              <>
                                <i className="fas fa-spinner fa-spin"></i>
                                <span>Elaborazione...</span>
                              </>
                            ) : (
                              <>
                                <i className="fab fa-whatsapp"></i>
                                <span>Prenota tramite WhatsApp</span>
                              </>
                            )}
                          </button>
                          <p className="text-xs text-neutral-400 leading-relaxed mt-3 text-center">
                            Inviando la prenotazione dichiari di aver letto la{" "}
                            <a
                              href="#privacy"
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveTab("privacy");
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="text-amber-400 underline hover:text-amber-300 transition"
                            >
                              Privacy Policy
                            </a>
                            . Useremo i tuoi dati per gestire la prenotazione e li registreremo nel nostro gestionale.
                          </p>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* DOVE SIAMO */}
          <section className="section-padding" id="dove-siamo">
            <div className="container">
              <div className="section-title-wrap" style={{ textAlign: "left", marginBottom: "40px" }}>
                <span className="section-label bebas">DOVE SIAMO</span>
                <h2 className="section-title font-bold">Vienici a trovare</h2>
                <p className="address-text" style={{ fontSize: "1.4rem", color: "var(--color-accent)" }}>
                  <a href="https://www.google.com/maps/dir/?api=1&destination=Papone+Via+Trinitapoli+24+Foggia" target="_blank" className="address-link" rel="referrer">
                    Via Trinitapoli 24, 71121 Foggia FG, Italy
                  </a>
                </p>
              </div>

              <div className="dove-siamo-wrap">
                <div className="hours-list-wrap">
                  <h4 className="bebas" style={{ color: "var(--color-accent)", marginBottom: "20px", fontSize: "1.5rem" }}>
                    Orari di Apertura
                  </h4>
                  <div className="hour-row"><span>Lunedì</span><span style={{ color: "var(--color-accent)", fontWeight: "bold" }}>CHIUSO</span></div>
                  <div className="hour-row"><span>Martedì</span><span>19:30 – 02:00</span></div>
                  <div className="hour-row"><span>Mercoledì</span><span style={{ color: "var(--color-accent)", fontWeight: "bold" }}>CHIUSO</span></div>
                  <div className="hour-row"><span>Giovedì</span><span style={{ color: "var(--color-accent)", fontWeight: "bold" }}>CHIUSO</span></div>
                  <div className="hour-row"><span>Venerdì</span><span>19:30 – 02:00</span></div>
                  <div className="hour-row"><span>Sabato</span><span>19:30 – 02:00</span></div>
                  <div className="hour-row"><span>Domenica</span><span>19:30 – 02:00</span></div>
                  <p style={{ marginTop: "20px", fontWeight: "bold", color: "var(--color-accent)", fontSize: "1.2rem" }} className="bebas">
                    APERTI MARTEDÌ · VENERDÌ · SABATO · DOMENICA
                  </p>
                  
                  <div style={{ marginTop: "30px", display: "flex", flexWrap: "wrap", gap: "20px", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                    <p>
                      <a href="tel:+393452311789" className="address-link">
                        <i className="fas fa-phone mr-2" style={{ color: "var(--color-accent)" }}></i> +39 345 231 1789
                      </a>
                    </p>
                    <p>
                      <a href="mailto:papone2018@gmail.com" className="address-link">
                        <i className="fas fa-envelope mr-2" style={{ color: "var(--color-accent)" }}></i> papone2018@gmail.com
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="maps-rectangle">
                  {cookieConsent.marketing || mapConsented ? (
                    <iframe 
                      src="https://maps.google.com/maps?q=Via%20Trinitapoli%2024,%2071121%20Foggia%20FG,%20Italy&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                      allowFullScreen={true} 
                      loading="lazy" 
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMapConsented(true)}
                      className="w-full h-full bg-neutral-950/90 hover:bg-neutral-900 text-white flex flex-col items-center justify-center p-6 text-center cursor-pointer transition gap-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 text-2xl">
                        <i className="fas fa-map-marked-alt"></i>
                      </div>
                      <span className="font-bold text-lg text-amber-400 tracking-wide">
                        Clicca per caricare la mappa di Google
                      </span>
                      <span className="text-xs text-neutral-400 max-w-xs leading-relaxed">
                        La mappa di Google Maps viene caricata solo dopo il tuo consenso perché può impostare cookie di Google.
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      )}


      {/* ======================= MENU PAGE VIEW ======================= */}
      {activeTab === "menu" && (
        <>
          {/* MENU HERO BACKGROUND */}
          <section className="page-hero">
            <div className="page-hero-content">
              <span className="bebas block mb-1 text-amber-400 font-bold" style={{ fontSize: "1.5rem" }}>CUCINA DAL 1956</span>
              <h1 className="font-extrabold text-white">Il Nostro Menu</h1>
            </div>
          </section>

          {/* INDIVIDUAL MENU CATEGORIES CONTAINER */}
          <section className="menu-section">
            <div className="container">
              
              {/* CATEGORIA 1: ANTIPASTI & FRITTI */}
              <div className="menu-category" id="menu-antipasti">
                <h2 className="category-title border-b-2">Antipasti & Fritti</h2>
                <div className="menu-grid">
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Mix salumi e formaggi (consigliato per 2p)</span>
                        <span className="item-price">€ 18.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Contorni (piatto 4 prodotti)</span>
                        <span className="item-price">€ 6.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        4 scelte dal banco (i prodotti variano in base alla stagionalità)
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Bruschetta</span>
                        <span className="item-price">€ 6.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Fiori di zucca (4 pezzi)</span>
                        <span className="item-price">€ 6.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Hot dog fritto (3 pezzi)</span>
                        <span className="item-price">€ 4.50</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Triangolo speck e patate</span>
                        <span className="item-price">€ 6.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Nuggets di pollo (6 pezzi)</span>
                        <span className="item-price">€ 6.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Stick di mozzarella (5 pezzi)</span>
                        <span className="item-price">€ 6.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Olive ascolane (6 pezzi)</span>
                        <span className="item-price">€ 6.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Patatine fritte</span>
                        <span className="item-price">€ 5.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Patata americana</span>
                        <span className="item-price">€ 6.50</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Patata cheddar e bacon</span>
                        <span className="item-price">€ 7.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Caprese</span>
                        <span className="item-price">€ 7.00</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-neutral-400 mt-4 italic">
                  * Aggiunte da €0.50 a €1.50
                </div>
              </div>

              {/* CATEGORIA 2: STEAKHOUSE */}
              <div className="menu-category" id="menu-steakhouse">
                <h2 className="category-title border-b-2">Steakhouse</h2>
                <div className="menu-grid">
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Hamburger di vitello</span>
                        <span className="item-price">€ 7.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Hamburger di pollo</span>
                        <span className="item-price">€ 7.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Hamburger di Scottona</span>
                        <span className="item-price">€ 9.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Mortadella alla brace</span>
                        <span className="item-price">€ 6.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Arrosticini</span>
                        <span className="item-price">€ 1.50 / pezzo</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Tagliata di Scottona (250g)</span>
                        <span className="item-price">€ 20.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Con grana, pomodori e rucola
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Salsiccia (3 capi)</span>
                        <span className="item-price">€ 6.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Wurstel di pollo</span>
                        <span className="item-price">€ 5.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Torcinelli (5 pezzi)</span>
                        <span className="item-price">€ 8.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Paccanelli (5 pezzi)</span>
                        <span className="item-price">€ 8.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Terrina di caciocavallo</span>
                        <span className="item-price">€ 8.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Arrosto misto per 2</span>
                        <span className="item-price">€ 40.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        4 salsicce, 2 hamburger, 4 paccanelli, 4 torcinelli, patatine fritte e 2 contorni
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CATEGORIA 3: I NOSTRI BURGER */}
              <div className="menu-category" id="menu-burger">
                <h2 className="category-title border-b-2">I Nostri Burger & Panini</h2>
                <div className="menu-grid">
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Cowboy</span>
                        <span className="item-price">€ 9.80</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Paccanelli, mozzarella, insalata, carciofi, tabasco e salsa rosa.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Bandito</span>
                        <span className="item-price">€ 9.80</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Hamburger di vitello, funghi, insalata, bacon, patatine fritte, salsa cheddar e salsa remoulade.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Sceriffo</span>
                        <span className="item-price">€ 9.80</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Salsiccia, patate al forno, mozzarella, melanzane sott'olio, maionese e salsa BBQ.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Fuorilegge</span>
                        <span className="item-price">€ 9.80</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Parmigiana, ventricina e caciocavallo fuso.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Pistolero</span>
                        <span className="item-price">€ 9.80</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Cotoletta, insalata e maionese.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Stallone</span>
                        <span className="item-price">€ 13.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Doppio hamburger di vitello, cheddar, bacon, rucola, salsa onion e salsa yogurt.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Cavallo Pazzo</span>
                        <span className="item-price">€ 13.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Pulled pork, scaglie di grana, insalata/misticanza, salsa BBQ e salsa onion.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Gringo</span>
                        <span className="item-price">€ 13.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Big hamburger scottona 250g, uovo, melanzane grigliate, pomodori secchi, salsa cheddar e BBQ.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-[var(--color-accent)] font-bold">Fattill' Tu (Componi il tuo panino)</span>
                        <span className="item-price">€ 10.00</span>
                      </div>
                      <p className="item-desc text-neutral-400 font-medium">
                        Carne: salsiccia o hamburger vitello/pollo, 2 salse, 3 contorni a scelta.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CATEGORIA 4: LE NOSTRE PIZZE */}
              <div className="menu-category" id="menu-pizze">
                <h2 className="category-title border-b-2">Le Nostre Pizze</h2>

                {/* BLOCCO 1: LISTA PIZZE A SINISTRA + PIZZA 1 GRANDE A DESTRA */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center mb-14">
                  <div className="md:col-span-7 order-2 md:order-1 space-y-4">
                    <div className="menu-item">
                      <div className="item-info" style={{ paddingRight: 0 }}>
                        <div className="flex justify-between items-baseline gap-4 mb-1">
                          <span className="item-name text-white">Marinara</span>
                          <span className="item-price">€ 6.00</span>
                        </div>
                        <p className="item-desc text-neutral-400">
                          Pomodoro Rosso Gargano, origano e aglio.
                        </p>
                      </div>
                    </div>
                    <div className="menu-item">
                      <div className="item-info" style={{ paddingRight: 0 }}>
                        <div className="flex justify-between items-baseline gap-4 mb-1">
                          <span className="item-name text-white">Margherita</span>
                          <span className="item-price">€ 7.00</span>
                        </div>
                        <p className="item-desc text-neutral-400">
                          Pomodoro Rosso Gargano e fiordilatte.
                        </p>
                      </div>
                    </div>
                    <div className="menu-item">
                      <div className="item-info" style={{ paddingRight: 0 }}>
                        <div className="flex justify-between items-baseline gap-4 mb-1">
                          <span className="item-name text-white">Bufala</span>
                          <span className="item-price">€ 9.50</span>
                        </div>
                        <p className="item-desc text-neutral-400">
                          Pomodoro Rosso Gargano e bufala campana DOC.
                        </p>
                      </div>
                    </div>
                    <div className="menu-item">
                      <div className="item-info" style={{ paddingRight: 0 }}>
                        <div className="flex justify-between items-baseline gap-4 mb-1">
                          <span className="item-name text-white">Diavola</span>
                          <span className="item-price">€ 8.50</span>
                        </div>
                        <p className="item-desc text-neutral-400">
                          Pomodoro Rosso Gargano, fiordilatte e piccante.
                        </p>
                      </div>
                    </div>
                    <div className="menu-item">
                      <div className="item-info" style={{ paddingRight: 0 }}>
                        <div className="flex justify-between items-baseline gap-4 mb-1">
                          <span className="item-name text-white">Provola e pepe</span>
                          <span className="item-price">€ 8.00</span>
                        </div>
                        <p className="item-desc text-neutral-400">
                          Pomodoro Rosso Gargano, provola affumicata d&apos;Agerola e pepe.
                        </p>
                      </div>
                    </div>
                    <div className="menu-item">
                      <div className="item-info" style={{ paddingRight: 0 }}>
                        <div className="flex justify-between items-baseline gap-4 mb-1">
                          <span className="item-name text-white">Capricciosa</span>
                          <span className="item-price">€ 9.00</span>
                        </div>
                        <p className="item-desc text-neutral-400">
                          Pomodoro Rosso Gargano, fiordilatte, cotto, funghi, olive nere e carciofi.
                        </p>
                      </div>
                    </div>
                    <div className="menu-item">
                      <div className="item-info" style={{ paddingRight: 0 }}>
                        <div className="flex justify-between items-baseline gap-4 mb-1">
                          <span className="item-name text-white">Parma D.O.C</span>
                          <span className="item-price">€ 12.00</span>
                        </div>
                        <p className="item-desc text-neutral-400">
                          Pomodoro Rosso Gargano, bufala campana DOC, prosciutto crudo di Parma e grana.
                        </p>
                      </div>
                    </div>
                    <div className="menu-item">
                      <div className="item-info" style={{ paddingRight: 0 }}>
                        <div className="flex justify-between items-baseline gap-4 mb-1">
                          <span className="item-name text-white">Cotto e funghi</span>
                          <span className="item-price">€ 9.00</span>
                        </div>
                        <p className="item-desc text-neutral-400">
                          Pomodoro Rosso Gargano, fiordilatte, cotto e funghi.
                        </p>
                      </div>
                    </div>
                    <div className="menu-item">
                      <div className="item-info" style={{ paddingRight: 0 }}>
                        <div className="flex justify-between items-baseline gap-4 mb-1">
                          <span className="item-name text-white">Viennese</span>
                          <span className="item-price">€ 8.50</span>
                        </div>
                        <p className="item-desc text-neutral-400">
                          Fiordilatte, würstel e patatine.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-5 order-1 md:order-2 flex justify-center md:justify-end">
                    <div className="w-64 h-64 sm:w-72 sm:h-72 lg:w-96 lg:h-96 rounded-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-neutral-800">
                      <img
                        src="/pizza1.png"
                        alt="Pizza artigianale Papone"
                        className="w-full h-full object-cover scale-105"
                      />
                    </div>
                  </div>
                </div>

                {/* BLOCCO 2: PIZZA 2 A SINISTRA + LISTA PIZZE A DESTRA */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
                  <div className="md:col-span-5 order-2 md:order-1 flex justify-center md:justify-start">
                    <div className="w-64 h-64 sm:w-72 sm:h-72 lg:w-96 lg:h-96 rounded-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-neutral-800">
                      <img
                        src="/pizza2.png"
                        alt="Pizza speciale Papone"
                        className="w-full h-full object-cover scale-105"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-7 order-1 md:order-2 space-y-4">
                    <div className="menu-item">
                      <div className="item-info" style={{ paddingRight: 0 }}>
                        <div className="flex justify-between items-baseline gap-4 mb-1">
                          <span className="item-name text-white">Ortolana</span>
                          <span className="item-price">€ 10.00</span>
                        </div>
                        <p className="item-desc text-neutral-400">
                          Fiordilatte, melanzane, zucchine e peperoni.
                        </p>
                      </div>
                    </div>
                    <div className="menu-item">
                      <div className="item-info" style={{ paddingRight: 0 }}>
                        <div className="flex justify-between items-baseline gap-4 mb-1">
                          <span className="item-name text-white">5 Formaggi</span>
                          <span className="item-price">€ 10.00</span>
                        </div>
                        <p className="item-desc text-neutral-400">
                          Fiordilatte, cacio, gorgonzola al cucchiaio, provola e fonduta di parmigiano.
                        </p>
                      </div>
                    </div>
                    <div className="menu-item">
                      <div className="item-info" style={{ paddingRight: 0 }}>
                        <div className="flex justify-between items-baseline gap-4 mb-1">
                          <span className="item-name text-white">Zuccona</span>
                          <span className="item-price">€ 13.00</span>
                        </div>
                        <p className="item-desc text-neutral-400">
                          Crema di zucca, gorgonzola al cucchiaio, fiordilatte e capocollo.
                        </p>
                      </div>
                    </div>
                    <div className="menu-item">
                      <div className="item-info" style={{ paddingRight: 0 }}>
                        <div className="flex justify-between items-baseline gap-4 mb-1">
                          <span className="item-name text-white">Napulè</span>
                          <span className="item-price">€ 12.00</span>
                        </div>
                        <p className="item-desc text-neutral-400">
                          Provola affumicata, crema di friarielli e salsiccia di Norcia.
                        </p>
                      </div>
                    </div>
                    <div className="menu-item">
                      <div className="item-info" style={{ paddingRight: 0 }}>
                        <div className="flex justify-between items-baseline gap-4 mb-1">
                          <span className="item-name text-white">Datterina</span>
                          <span className="item-price">€ 14.00</span>
                        </div>
                        <p className="item-desc text-neutral-400">
                          Datterino giallo, provola affumicata, pancetta al pepe e mandorle tostate.
                        </p>
                      </div>
                    </div>
                    <div className="menu-item">
                      <div className="item-info" style={{ paddingRight: 0 }}>
                        <div className="flex justify-between items-baseline gap-4 mb-1">
                          <span className="item-name text-white">Norcina</span>
                          <span className="item-price">€ 12.00</span>
                        </div>
                        <p className="item-desc text-neutral-400">
                          Provola affumicata, patate al forno, salsiccia e grana.
                        </p>
                      </div>
                    </div>
                    <div className="menu-item">
                      <div className="item-info" style={{ paddingRight: 0 }}>
                        <div className="flex justify-between items-baseline gap-4 mb-1">
                          <span className="item-name text-white">Za fò</span>
                          <span className="item-price">€ 10.00</span>
                        </div>
                        <p className="item-desc text-neutral-400">
                          Pomodoro Rosso Gargano, fiordilatte, spianata piccante e gorgonzola al cucchiaio.
                        </p>
                      </div>
                    </div>
                    <div className="menu-item">
                      <div className="item-info" style={{ paddingRight: 0 }}>
                        <div className="flex justify-between items-baseline gap-4 mb-1">
                          <span className="item-name text-white">Zozza</span>
                          <span className="item-price">€ 12.00</span>
                        </div>
                        <p className="item-desc text-neutral-400">
                          Fiordilatte, mortadella, stracciatella e pistacchio.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-right text-sm text-[var(--color-accent)] font-bold italic">
                  * Basilico e Olio EVO su tutte alla fine
                </div>
              </div>

              {/* CATEGORIA 5: LE BIRRE (SPINA & ARTIGIANALI) */}
               <div className="menu-category" id="menu-birre">
                 <h2 className="category-title border-b-2">Le Birre (Spina & Artigianali)</h2>
                 <div className="menu-grid">
                   <div className="menu-item">
                     <div className="item-info">
                       <div className="item-header">
                         <span className="item-name text-white">Ammiraglia Double Malt (Artigianale)</span>
                         <span className="item-price">€ 7.00</span>
                       </div>
                       <p className="item-desc text-neutral-400">
                         Rossa artigianale ambrata, corpo pieno, aroma persistente e note dolci di caramello.
                       </p>
                     </div>
                   </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Heineken (Spina)</span>
                        <span className="item-price">Piccola € 3.00 · Grande € 5.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Classica lager bionda, gusto fresco con un tocco luppolato. Piccola (3€) / Grande (5€).
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Moretti (Spina)</span>
                        <span className="item-price">Piccola € 4.00 · Grande € 6.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Lager italiana a bassa fermentazione, gusto rotondo e aroma fragrante. Piccola (4€) / Grande (6€).
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Bulldog (Spina)</span>
                        <span className="item-price">Piccola € 4.00 · Grande € 6.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Strong ale intensa, aromatica e dal carattere deciso. Piccola (4€) / Grande (6€).
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Caraffa Birra 1.5 L</span>
                        <span className="item-price">€ 14.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        La bionda alla spina servita in caraffa fredda da 1.5 Litri, ideale da condividere.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Caraffa Birra 3 L (Bionda)</span>
                        <span className="item-price">€ 24.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        La nostra caraffa extra-large da 3 Litri con spillatore incorporato per massimizzare il brindisi con gli amici.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Caraffa Birra 3 L Moretti Rossa</span>
                        <span className="item-price">€ 28.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Moretti Rossa in caraffa da 3 Litri con spillatore incorporato per i tavoli.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Caraffa Birra 3 L Bulldog</span>
                        <span className="item-price">€ 28.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Bulldog Strong Ale in caraffa da 3 Litri con spillatore incorporato per i tavoli.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CATEGORIA 5: I COCKTAIL */}
              <div className="menu-category" id="menu-cocktails">
                <h2 className="category-title border-b-2">I Cocktail</h2>
                <div className="menu-grid">
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Cocktail Classico</span>
                        <span className="item-price">€ 7.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        I grandi classici della miscelazione: Negroni, Gin Tonic, Gin Lemon, Mojito, Caipirinha e Cuba Libre.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Aperol Spritz / Campari Spritz</span>
                        <span className="item-price">€ 6.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        L'aperitivo per eccellenza: Prosecco DOC, Aperol o Campari, soda ed una fetta d'arancia fresca.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Cocktail Premium</span>
                        <span className="item-price">€ 9.00 / € 10.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Preparazioni ricercate realizzate con gin, vodka o rum di fascia premium e botaniche selezionate.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CATEGORIA 6: I VINI & PROSECCO */}
              <div className="menu-category" id="menu-vini">
                <h2 className="category-title border-b-2">I Vini & Prosecco</h2>
                <div className="menu-grid">
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Calice di Vino</span>
                        <span className="item-price">€ 5.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Una selezione di vini rossi, bianchi o rosati pugliesi serviti al calice.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Vino Rosso Jalissia</span>
                        <span className="item-price">€ 18.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Pregiato vino rosso pugliese dal corpo intenso, persistenza decisa e note speziate di frutti rossi.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Vino Rosso Sanella</span>
                        <span className="item-price">€ 18.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Sanella rosso dal sapore rotondo, avvolgente ed equilibrato.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Vino Rosato Sanella</span>
                        <span className="item-price">€ 18.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Sanella rosato fresco, leggermente fruttato ed elegante.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Vino Rosato Dinò</span>
                        <span className="item-price">€ 20.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Elegante vino rosato dal bouquet floreale, note fruttate avvolgenti e freschezza vibrante.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Vino Rosato Mantajo</span>
                        <span className="item-price">€ 18.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Rosato della nostra terra equilibrato, con spiccati sentori mediterranei e finale asciutto e pulito.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Vino Rosato Bisciù</span>
                        <span className="item-price">€ 20.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Freschissimo vino rosato artigianale dal sapore sapido, vivace e con persistenti fragranze agrumate.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Bicchiere di Prosecco</span>
                        <span className="item-price">€ 5.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Un calice fresco di bollicine spumeggianti per brindare.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Bottiglia di Prosecco</span>
                        <span className="item-price">€ 20.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Prosecco DOC spumante extra dry, ideale per aperitivi, festeggiamenti o piatti leggeri.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CATEGORIA 7: LE BEVANDE */}
              <div className="menu-category" id="menu-bevande">
                <h2 className="category-title border-b-2">Le Bevande & Analcolici</h2>
                <div className="menu-grid">
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Acqua Naturale (0.5 L)</span>
                        <span className="item-price">€ 1.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Fresca acqua oligominerale naturale in bottiglia.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Acqua Frizzante (0.5 L)</span>
                        <span className="item-price">€ 1.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Acqua frizzante e dissetante in bottiglia.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Coca Cola (0.3 L)</span>
                        <span className="item-price">€ 3.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        La bibita analcolica più famosa al mondo in lattina da 33cl.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Coca Cola Zero (0.3 L)</span>
                        <span className="item-price">€ 3.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Tutto il gusto classico di Coca-Cola senza calorie e senza zuccheri in lattina da 33cl.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Estathè alla Pesca (0.3 L)</span>
                        <span className="item-price">€ 3.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Il vero infuso di foglie di tè al sapore estivo della pesca.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Estathè al Limone (0.3 L)</span>
                        <span className="item-price">€ 3.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Fresco tè freddo infuso dal gusto agrumato del limone.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Fanta (0.3 L)</span>
                        <span className="item-price">€ 3.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Bibita analcolica frizzante con vero succo d'arancia italiana.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* INFO COPERTO */}
              <div className="menu-category" style={{ marginBottom: "20px" }}>
                <div className="menu-item" style={{ maxWidth: "480px", margin: "0 auto" }}>
                  <div className="item-info">
                    <div className="item-header">
                      <span className="item-name text-white">Coperto (a persona)</span>
                      <span className="item-price">€ 2.00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTONE PRENOTA */}
              <div className="menu-cta-wrap" style={{ textAlign: "center", marginTop: "60px" }}>
                <a 
                  href="#prenota" 
                  onClick={(e) => { e.preventDefault(); scrollToSection("prenota"); }} 
                  className="btn btn-primary" 
                  style={{ padding: "15px 45px", fontSize: "1.3rem" }}
                >
                  Prenota un Tavolo
                </a>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ======================= PRIVACY POLICY VIEW ======================= */}
      {activeTab === "privacy" && (
        <section className="section-padding bg-neutral-900 text-white min-h-screen pt-32 pb-24">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="mb-12 text-center md:text-left">
              <h1 className="text-4xl font-extrabold text-white font-sans tracking-tight">PRIVACY POLICY</h1>
              <p className="text-sm text-neutral-400 font-mono mt-2">
                Informativa sul trattamento dei dati personali – Ultimo aggiornamento: 23 novembre 2026
              </p>
            </div>
            
            <div className="prose prose-invert max-w-none text-neutral-300 space-y-8 font-sans leading-relaxed">
              <p>
                Questa pagina spiega in modo semplice come Papone Dal 1956 raccoglie e usa i dati personali di chi visita questo sito e di chi prenota un tavolo o ci contatta tramite il sito, WhatsApp, telefono o i nostri social. È resa ai sensi degli articoli 13 e 14 del Regolamento (UE) 2016/679 (&quot;GDPR&quot;) e del D.Lgs. 196/2003 (&quot;Codice Privacy&quot;).
              </p>

              <div>
                <h2 className="text-xl font-bold font-mono text-amber-400 mb-3">1. Chi tratta i tuoi dati</h2>
                <p>
                  Titolare del trattamento è Radici S.r.l., titolare del marchio &quot;Papone Dal 1956&quot;, P.IVA 04585110713, con locale in Via Trinitapoli 24, 71121 Foggia (FG). Email papone2018@gmail.com – PEC radicisrl26@pec.it – Telefono +39 345 231 1789.
                </p>
                <p className="mt-3">
                  Per la gestione tecnica del sito, del gestionale clienti Gestiamo, dell&apos;invio di email e messaggi e delle campagne pubblicitarie online ci avvaliamo di Partidea S.r.l. (brand Socialee e Gestiamo), P.IVA 04405500408, Via Augusto Righi 15 – 47924 Rimini (RN), PEC amministrazione@pec.partidea.it, email info@socialee.it. Partidea S.r.l. è nominata Responsabile del trattamento ai sensi dell&apos;art. 28 GDPR con un accordo scritto: tratta i dati solo per nostro conto e secondo le nostre istruzioni, e si avvale a sua volta dei fornitori indicati in questa informativa.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold font-mono text-amber-400 mb-3">2. Quali dati raccogliamo</h2>
                <ul className="list-disc list-inside space-y-2 text-neutral-300 pl-2">
                  <li>Dati di navigazione: indirizzo IP, browser, dispositivo, pagine visitate, data e ora, raccolti automaticamente dai sistemi che fanno funzionare il sito.</li>
                  <li>Prenotazione dei tavoli: nome e cognome, numero di telefono, email (facoltativa), data, orario e numero di persone, ed eventuali note che decidi di aggiungere (ad esempio una ricorrenza o una preferenza sul tavolo).</li>
                  <li>Messaggi: quanto ci scrivi via WhatsApp, telefono, email o messaggi sui social.</li>
                  <li>Dati raccolti con cookie e strumenti di tracciamento: identificativi online e interazioni con il sito, con le nostre email e con i nostri annunci, solo se lo consenti tramite il banner (tranne i cookie tecnici).</li>
                  <li>Le tue scelte sul consenso: quando e a cosa hai detto sì o no.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold font-mono text-amber-400 mb-3">3. Perché usiamo i dati e su quale base</h2>
                <div className="overflow-x-auto rounded-xl border border-neutral-800">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-neutral-950 text-amber-400 border-b border-neutral-800">
                        <th className="p-3 font-bold">Finalità</th>
                        <th className="p-3 font-bold">Base giuridica</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 bg-neutral-950/40">
                      <tr>
                        <td className="p-3">Gestire la prenotazione del tavolo, confermarla o comunicarti eventuali variazioni</td>
                        <td className="p-3">Esecuzione di un contratto o di misure precontrattuali (art. 6.1.b GDPR)</td>
                      </tr>
                      <tr>
                        <td className="p-3">Registrare i dati nel gestionale Gestiamo per organizzare il servizio e ricordare lo storico del cliente</td>
                        <td className="p-3">Contratto (art. 6.1.b) e nostro legittimo interesse a gestire la clientela in modo ordinato (art. 6.1.f)</td>
                      </tr>
                      <tr>
                        <td className="p-3">Inviare il riepilogo della prenotazione e i promemoria via email, SMS o WhatsApp</td>
                        <td className="p-3">Contratto (art. 6.1.b)</td>
                      </tr>
                      <tr>
                        <td className="p-3">Gestire allergie e intolleranze che ci comunichi</td>
                        <td className="p-3">Consenso esplicito (art. 9.2.a GDPR)</td>
                      </tr>
                      <tr>
                        <td className="p-3">Inviare newsletter, offerte, serate a tema e inviti a eventi</td>
                        <td className="p-3">Consenso (art. 6.1.a), revocabile in ogni momento</td>
                      </tr>
                      <tr>
                        <td className="p-3">Misurare l&apos;uso del sito con statistiche (Google Analytics)</td>
                        <td className="p-3">Consenso (art. 6.1.a GDPR e art. 122 Codice Privacy)</td>
                      </tr>
                      <tr>
                        <td className="p-3">Misurare le campagne e mostrare annunci personalizzati su Google, Facebook e Instagram</td>
                        <td className="p-3">Consenso (art. 6.1.a GDPR e art. 122 Codice Privacy)</td>
                      </tr>
                      <tr>
                        <td className="p-3">Rispettare obblighi di legge (fiscali, contabili)</td>
                        <td className="p-3">Obbligo legale (art. 6.1.c)</td>
                      </tr>
                      <tr>
                        <td className="p-3">Proteggere il sito da abusi e spam e difendere i nostri diritti</td>
                        <td className="p-3">Legittimo interesse (art. 6.1.f)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold font-mono text-amber-400 mb-3">4. Il gestionale Gestiamo</h2>
                <p>
                  I dati di clienti e prenotazioni sono registrati in Gestiamo, il gestionale privato (CRM) che Partidea S.r.l. fornisce e gestisce per nostro conto. Lo usiamo per:
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 text-neutral-300 pl-2">
                  <li>conservare nome e recapiti dei clienti;</li>
                  <li>organizzare le prenotazioni dei tavoli, anche quelle arrivate via WhatsApp o telefono, e ricordarne lo storico;</li>
                  <li>registrare consensi e preferenze di contatto, così da scrivere solo a chi lo ha accettato;</li>
                  <li>inviare a Brevo i contatti necessari per il riepilogo delle prenotazioni e, solo con il consenso, per le promozioni;</li>
                  <li>preparare statistiche interne in forma aggregata.</li>
                </ul>
                <p className="mt-3">
                  Al gestionale accedono solo le persone autorizzate di Papone Dal 1956 e di Partidea S.r.l., con credenziali personali. I dati non vengono venduti né diffusi e non sono usati per decisioni automatizzate che producano effetti giuridici su di te. Gestiamo è ospitato su infrastrutture di hosting scelte da Partidea S.r.l. con misure di sicurezza adeguate; eventuali trasferimenti fuori dall&apos;Unione Europea avvengono con le garanzie indicate al punto 9.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold font-mono text-amber-400 mb-3">5. Email, SMS e comunicazioni: Brevo</h2>
                <p>
                  I dati del modulo di prenotazione vengono sincronizzati con Brevo, piattaforma di Sendinblue SAS, 106 boulevard Haussmann, 75008 Parigi (Francia), che tratta i dati come sub-responsabile su server situati nell&apos;Unione Europea. Usiamo Brevo per inviarti il riepilogo della prenotazione e, solo se hai dato il consenso, newsletter, offerte e inviti a eventi.
                </p>
                <p className="mt-3">
                  Brevo registra se un&apos;email è stata aperta e quali link sono stati cliccati, per capire quali messaggi sono utili e non inviarne di superflui. In ogni email promozionale trovi il link per disiscriverti; puoi anche scriverci a papone2018@gmail.com.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold font-mono text-amber-400 mb-3">6. Tracciamenti Google</h2>
                <p>
                  Il sito utilizza o può utilizzare, solo dopo il tuo consenso, i seguenti servizi di Google Ireland Limited, Gordon House, Barrow Street, Dublino 4 (Irlanda):
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 text-neutral-300 pl-2">
                  <li>Google Analytics 4: statistiche aggregate su pagine visitate, durata delle visite, provenienza e dispositivo. Google Analytics 4 non registra gli indirizzi IP; i dati sono conservati per 14 mesi.</li>
                  <li>Google Ads: misura se un annuncio ha portato a una prenotazione e mostra annunci a chi ha già visitato il sito (remarketing).</li>
                  <li>Google Tag Manager: strumento tecnico che carica gli altri servizi nel rispetto delle tue scelte.</li>
                  <li>Google Maps: la mappa che indica dove ci troviamo viene caricata solo dopo il tuo consenso, perché può impostare cookie di Google.</li>
                </ul>
                <p className="mt-3">
                  Usiamo Google Consent Mode v2: finché non dai il consenso, i servizi Google non salvano né leggono identificativi sul tuo dispositivo. Puoi gestire le preferenze sugli annunci su{" "}
                  <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300">
                    https://adssettings.google.com
                  </a>.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold font-mono text-amber-400">7. Tracciamenti Meta (Facebook, Instagram, WhatsApp)</h2>

                <div>
                  <h3 className="text-lg font-bold text-white mb-2">7.1 Pixel di Meta e Conversions API</h3>
                  <p>
                    Il sito utilizza o può utilizzare, solo dopo il tuo consenso, il Pixel di Meta e la Conversions API di Meta Platforms Ireland Limited, Merrion Road, Dublino 4 (Irlanda). Servono a misurare i risultati delle campagne su Facebook e Instagram e a mostrare annunci a chi ha visitato il sito o ha prenotato. Con la Conversions API gli stessi eventi vengono inviati a Meta dal server invece che dal browser, in forma cifrata, e solo se hai dato il consenso. Per la raccolta e la trasmissione di questi dati il Titolare e Meta sono contitolari (art. 26 GDPR) sulla base dell&apos;accordo messo a disposizione da Meta; i trattamenti successivi sono responsabilità esclusiva di Meta.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-2">7.2 Moduli di contatto su Facebook e Instagram</h3>
                  <p>
                    Se compili un modulo di contatto all&apos;interno di un nostro annuncio su Facebook o Instagram, i dati inseriti vengono raccolti da Meta, trasmessi a noi e registrati in Gestiamo per ricontattarti, con le stesse regole descritte in questa informativa.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-2">7.3 Pubblico personalizzato</h3>
                  <p>
                    Solo se hai dato il consenso al marketing, email e telefono possono essere caricati su Meta e Google in forma cifrata (hash), per mostrarti annunci pertinenti o per escluderti da annunci che non ti riguardano. Le piattaforme usano questi dati solo per l&apos;abbinamento e poi li cancellano.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-2">7.4 WhatsApp e le nostre pagine social</h3>
                  <p>
                    Dal modulo di prenotazione puoi scegliere di inviarci i dettagli direttamente su WhatsApp: in quel caso il messaggio parte dal tuo account e i dati sono trattati anche da WhatsApp Ireland Limited secondo la sua informativa. Per le statistiche delle nostre pagine Facebook e Instagram, il Titolare e Meta sono contitolari secondo l&apos;accordo &quot;Page Insights&quot; di Meta. I pulsanti del sito verso i nostri profili Instagram, Facebook e TikTok sono semplici link e non installano cookie finché non li clicchi.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold font-mono text-amber-400 mb-3">8. Allergie e intolleranze</h2>
                <p>
                  Se ci comunichi allergie, intolleranze o esigenze alimentari, le usiamo solo per preparare in sicurezza la tua serata. Trattandosi di dati sulla salute, li trattiamo solo con il tuo consenso esplicito (art. 9.2.a GDPR), li annotiamo nella prenotazione e li cancelliamo dopo il servizio, salvo che tu ci chieda di ricordarli per le volte successive. Non vengono mai inviati a Brevo, Google o Meta.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold font-mono text-amber-400 mb-3">9. A chi comunichiamo i dati e trasferimenti fuori dall&apos;Unione Europea</h2>
                <ul className="list-disc list-inside space-y-2 text-neutral-300 pl-2">
                  <li>Persone autorizzate di Papone Dal 1956, vincolate alla riservatezza;</li>
                  <li>Partidea S.r.l., Responsabile del trattamento (sito, Gestiamo, comunicazioni, campagne);</li>
                  <li>Sendinblue SAS (Brevo), Google Ireland Limited, Meta Platforms Ireland Limited e WhatsApp Ireland Limited, per i servizi descritti;</li>
                  <li>Vercel Inc. (Stati Uniti), fornitore di hosting del sito, e Cloudflare Inc. (Stati Uniti), che distribuisce alcuni file tecnici del sito;</li>
                  <li>commercialista e consulenti, per gli adempimenti di legge;</li>
                  <li>autorità pubbliche, quando la legge lo richiede.</li>
                </ul>
                <p className="mt-3">
                  I dati non vengono venduti né diffusi. Alcuni fornitori (Google, Meta, Vercel, Cloudflare) possono trasferire dati negli Stati Uniti: questi trasferimenti si basano sulla decisione di adeguatezza della Commissione Europea del 10 luglio 2023 sull&apos;EU-U.S. Data Privacy Framework, per le società certificate, e, dove serve, sulle Clausole Contrattuali Standard approvate dalla Commissione (art. 46 GDPR).
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold font-mono text-amber-400 mb-3">10. Per quanto tempo conserviamo i dati</h2>
                <ul className="list-disc list-inside space-y-2 text-neutral-300 pl-2">
                  <li>Prenotazioni e storico cliente in Gestiamo: 24 mesi dall&apos;ultima prenotazione;</li>
                  <li>Allergie e intolleranze: fino alla fine del servizio, salvo tua richiesta di ricordarle;</li>
                  <li>Richieste di contatto non seguite da prenotazione: 12 mesi;</li>
                  <li>Newsletter e promozioni: fino alla revoca del consenso, con verifica almeno ogni 24 mesi;</li>
                  <li>Documenti fiscali e contabili: 10 anni (art. 2220 Codice civile);</li>
                  <li>Statistiche di Google Analytics: 14 mesi;</li>
                  <li>Cookie: per le durate indicate nella Cookie Policy;</li>
                  <li>Log tecnici di sicurezza: fino a 12 mesi.</li>
                </ul>
                <p className="mt-3">
                  Scaduti questi tempi, i dati vengono cancellati o resi anonimi.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold font-mono text-amber-400 mb-3">11. I tuoi diritti</h2>
                <p>
                  Puoi chiederci in ogni momento di accedere ai tuoi dati, correggerli, cancellarli, limitarne l&apos;uso, riceverli in un formato leggibile (portabilità) e opporti al loro uso per marketing o basato sul legittimo interesse (artt. 15-22 GDPR). Puoi revocare un consenso quando vuoi, senza conseguenze su quanto fatto prima (art. 7.3 GDPR). Basta scrivere a papone2018@gmail.com o alla PEC radicisrl26@pec.it: ti rispondiamo entro 30 giorni. Puoi anche presentare reclamo al Garante per la protezione dei dati personali, Piazza Venezia 11, 00187 Roma – www.garanteprivacy.it.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold font-mono text-amber-400 mb-3">12. Altre informazioni</h2>
                <ul className="list-disc list-inside space-y-2 text-neutral-300 pl-2">
                  <li>Obbligatorietà: nome, telefono e dettagli della prenotazione servono a gestirla. Il consenso a marketing e cookie non tecnici è facoltativo: se lo neghi puoi comunque usare il sito e prenotare.</li>
                  <li>Decisioni automatizzate: non prendiamo decisioni basate solo su trattamenti automatizzati. La personalizzazione degli annunci avviene solo con il tuo consenso.</li>
                  <li>Sicurezza: usiamo connessione cifrata (HTTPS), accessi personali al gestionale e alle piattaforme, backup e aggiornamenti periodici.</li>
                  <li>Minori: i servizi del sito non sono rivolti a minori di 14 anni.</li>
                  <li>Modifiche: la data in alto indica l&apos;ultima versione; segnaleremo sul sito le modifiche importanti.</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-16 text-center">
              <button 
                onClick={() => { setActiveTab("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="btn btn-primary bebas px-8 py-3.5"
                style={{ fontSize: "1.2rem", letterSpacing: "1px" }}
              >
                TORNA ALLA HOME PAGE
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ======================= COOKIE POLICY VIEW ======================= */}
      {activeTab === "cookie" && (
        <section className="section-padding bg-neutral-900 text-white min-h-screen pt-32 pb-24">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="mb-12 text-center md:text-left">
              <h1 className="text-4xl font-extrabold text-white font-sans tracking-tight">COOKIE POLICY</h1>
              <p className="text-sm text-neutral-400 font-mono mt-2">Ultimo aggiornamento: 23 novembre 2026</p>
            </div>
            
            <div className="prose prose-invert max-w-none text-neutral-300 space-y-8 font-sans leading-relaxed">
              <p>
                Questa pagina spiega quali cookie e strumenti simili usa questo sito, gestito da Radici S.r.l. per il marchio Papone Dal 1956 (dati di contatto nella Privacy Policy), secondo l&apos;art. 122 del Codice Privacy e le Linee guida del Garante del 10 giugno 2021.
              </p>

              <div>
                <h2 className="text-xl font-bold font-mono text-amber-400 mb-3">Cosa sono i cookie</h2>
                <p>
                  Sono piccoli file che il sito salva sul tuo dispositivo. Strumenti simili (pixel, tag, local storage) funzionano allo stesso modo e seguono le stesse regole.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold font-mono text-amber-400 mb-3">Quali usiamo</h2>
                <ul className="list-disc list-inside space-y-2 text-neutral-300 pl-2">
                  <li>Cookie tecnici: fanno funzionare il sito e il modulo di prenotazione e ricordano le tue scelte sul banner. Non richiedono consenso.</li>
                  <li>Cookie statistici: Google Analytics 4, solo se attivo e solo con il tuo consenso.</li>
                  <li>Cookie di marketing: Google Ads e Pixel di Meta, solo se attivi e solo con il tuo consenso.</li>
                  <li>Contenuti di terze parti: la mappa di Google Maps, caricata solo dopo il tuo consenso.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold font-mono text-amber-400 mb-3">Elenco dei cookie</h2>
                <div className="overflow-x-auto rounded-xl border border-neutral-800">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-neutral-950 text-amber-400 border-b border-neutral-800">
                        <th className="p-3 font-bold">Nome</th>
                        <th className="p-3 font-bold">Fornitore</th>
                        <th className="p-3 font-bold">A cosa serve</th>
                        <th className="p-3 font-bold">Durata</th>
                        <th className="p-3 font-bold">Tipo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 bg-neutral-950/40">
                      <tr>
                        <td className="p-3 font-mono text-xs">cookie del banner</td>
                        <td className="p-3">Papone Dal 1956</td>
                        <td className="p-3">Ricorda le tue scelte sul consenso</td>
                        <td className="p-3">6 mesi</td>
                        <td className="p-3">Tecnico</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs">_ga</td>
                        <td className="p-3">Google</td>
                        <td className="p-3">Distingue i visitatori a fini statistici</td>
                        <td className="p-3">2 anni</td>
                        <td className="p-3">Statistico</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs">ga*</td>
                        <td className="p-3">Google</td>
                        <td className="p-3">Mantiene la sessione di Google Analytics</td>
                        <td className="p-3">2 anni</td>
                        <td className="p-3">Statistico</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs">_gcl_au</td>
                        <td className="p-3">Google</td>
                        <td className="p-3">Misura le conversioni di Google Ads</td>
                        <td className="p-3">3 mesi</td>
                        <td className="p-3">Marketing</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs">IDE, test_cookie</td>
                        <td className="p-3">Google (doubleclick.net)</td>
                        <td className="p-3">Remarketing e misurazione degli annunci</td>
                        <td className="p-3">fino a 13 mesi</td>
                        <td className="p-3">Marketing</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs">_fbp</td>
                        <td className="p-3">Meta</td>
                        <td className="p-3">Identifica il browser per il Pixel di Meta</td>
                        <td className="p-3">3 mesi</td>
                        <td className="p-3">Marketing</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs">_fbc</td>
                        <td className="p-3">Meta</td>
                        <td className="p-3">Registra il clic su un annuncio Meta</td>
                        <td className="p-3">3 mesi</td>
                        <td className="p-3">Marketing</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs">fr</td>
                        <td className="p-3">Meta (facebook.com)</td>
                        <td className="p-3">Annunci e misurazione su Facebook e Instagram</td>
                        <td className="p-3">3 mesi</td>
                        <td className="p-3">Marketing</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs">NID e altri</td>
                        <td className="p-3">Google Maps</td>
                        <td className="p-3">Funzionamento della mappa incorporata</td>
                        <td className="p-3">6 mesi</td>
                        <td className="p-3">Terza parte</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm text-neutral-300">
                  Le durate sono indicate dai fornitori e possono cambiare. I cookie statistici e di marketing vengono installati solo se il relativo servizio è attivo sul sito e solo dopo il tuo consenso.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold font-mono text-amber-400 mb-3">Come scegli</h2>
                <p>
                  Al primo accesso il banner ti permette di accettare tutti i cookie, rifiutarli tutti o scegliere per categoria. Chiudendo il banner con la X continui con i soli cookie tecnici. Nessun cookie statistico o di marketing viene installato prima della tua scelta, e scorrere la pagina non vale come consenso. Il banner non ti viene riproposto prima di 6 mesi, salvo cambiamenti nei cookie usati. Puoi cambiare idea quando vuoi dal link &quot;Gestisci preferenze cookie&quot; in fondo a ogni pagina.
                </p>
                <p className="mt-3">
                  Puoi anche cancellare o bloccare i cookie dalle impostazioni del browser (Chrome, Firefox, Safari, Edge): bloccare quelli tecnici può però impedire il corretto funzionamento del sito e della prenotazione. Per le preferenze sugli annunci:{" "}
                  <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300">
                    https://adssettings.google.com
                  </a>{" "}
                  e le impostazioni inserzioni del tuo account Meta.
                </p>
              </div>
            </div>
            
            <div className="mt-16 flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setShowCookieModal(true)}
                className="btn btn-primary bebas px-8 py-3.5"
                style={{ fontSize: "1.2rem", letterSpacing: "1px" }}
              >
                <i className="fas fa-cog mr-2 text-sm"></i> GESTISCI PREFERENZE PERSONALI
              </button>
              <button 
                onClick={() => { setActiveTab("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="px-8 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 rounded-xl transition text-center font-bold bebas"
                style={{ fontSize: "1.2rem", letterSpacing: "1px", cursor: "pointer" }}
              >
                TORNA ALLA HOME PAGE
              </button>
            </div>
          </div>
        </section>
      )}


      {/* ======================= REUSABLE FOOTER ======================= */}
      <footer>
        <div className="container">
          <div className="footer-grid">
            
            {/* COLUMN 1 */}
            <div className="footer-col">
              <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ display: "inline-block", cursor: "pointer" }}>
                  <img src="/logo.png" alt="Logo Papone" className="footer-logo" style={{ marginBottom: 0 }} referrerPolicy="no-referrer" />
                </a>
                <p className="footer-tagline" style={{ marginBottom: 0 }}>Magnatill' n'emozion!</p>
              </div>
              <p style={{ color: "white" }}>
                Pub e steakhouse a Foggia dal 1956. Un'istituzione del gusto e della convivialità.
              </p>
            </div>

            {/* COLUMN 2 */}
            <div className="footer-col">
              <h4>Orari di Apertura</h4>
              <ul className="footer-links" style={{ fontSize: "0.95rem" }}>
                <li className="text-neutral-200">Martedì, Venerdì, Sabato e Domenica</li>
                <li style={{ fontSize: "1.1rem", color: "var(--color-text)", marginBottom: "8px" }}>19:30 – 02:00</li>
                <li className="text-neutral-200">Lunedì, Mercoledì e Giovedì</li>
                <li style={{ fontSize: "1.1rem", color: "var(--color-accent)", fontWeight: "bold" }}>CHIUSO</li>
              </ul>
            </div>

            {/* COLUMN 3 */}
            <div className="footer-col" id="contatti">
              <h4>Contatti</h4>
              <ul className="footer-links text-white" style={{ color: "white" }}>
                <li>
                  <a 
                    href="https://www.google.com/maps/dir/?api=1&destination=Papone+Via+Trinitapoli+24+Foggia" 
                    target="_blank" 
                    className="hover:text-amber-400 transition text-white"
                    rel="referrer"
                    style={{ color: "white" }}
                  >
                    <i className="fas fa-map-marker-alt" style={{ color: "var(--color-accent)", width: "25px" }}></i> 
                    Via Trinitapoli 24, 71121 Foggia FG, Italy
                  </a>
                </li>
                <li>
                  <a href="tel:+393452311789" className="hover:text-amber-400 transition text-white" style={{ color: "white" }}>
                    <i className="fas fa-phone" style={{ color: "var(--color-accent)", width: "25px" }}></i> 
                    +39 345 231 1789
                  </a>
                </li>
                <li>
                  <a href="mailto:papone2018@gmail.com" className="hover:text-amber-400 transition text-white" style={{ color: "white" }}>
                    <i className="fas fa-envelope" style={{ color: "var(--color-accent)", width: "25px" }}></i> 
                    papone2018@gmail.com
                  </a>
                </li>
              </ul>
              <div className="social-row flex" style={{ marginTop: "20px", gap: "15px" }}>
                <a 
                  href="https://www.instagram.com/papone_1956/" 
                  className="w-10 h-10 bg-black/40 border border-white/20 hover:border-amber-400 hover:bg-amber-400 hover:text-neutral-900 rounded-full flex items-center justify-center transition"
                  target="_blank"
                  rel="referrer"
                >
                  <i className="fab fa-instagram"></i>
                </a>
                <a 
                  href="https://www.facebook.com/search/top/?q=papone%202.0" 
                  className="w-10 h-10 bg-black/40 border border-white/20 hover:border-amber-400 hover:bg-amber-400 hover:text-neutral-900 rounded-full flex items-center justify-center transition"
                  target="_blank"
                  rel="referrer"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a 
                  href="https://www.tiktok.com/@papone2.0" 
                  className="w-10 h-10 bg-black/40 border border-white/20 hover:border-amber-400 hover:bg-amber-400 hover:text-neutral-900 rounded-full flex items-center justify-center transition"
                  target="_blank"
                  rel="referrer"
                >
                  <i className="fab fa-tiktok"></i>
                </a>
              </div>
            </div>

          </div>

          {/* BOTTOM COPYRIGHT ROW */}
          <div className="footer-bottom">
            <p className="w-full text-center leading-relaxed">
              &copy; 2026 Papone Dal 1956 – Radici S.r.l. – P.IVA 04585110713 – Via Trinitapoli 24, 71121 Foggia &middot;{" "}
              <a 
                href="#privacy" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setActiveTab("privacy"); 
                  window.scrollTo({ top: 0, behavior: "smooth" }); 
                }}
                className={activeTab === "privacy" ? "text-amber-400 font-bold underline" : "hover:text-white underline"}
              >
                Privacy Policy
              </a>
              {" "}&middot;{" "}
              <a 
                href="#cookie" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setActiveTab("cookie"); 
                  window.scrollTo({ top: 0, behavior: "smooth" }); 
                }}
                className={activeTab === "cookie" ? "text-amber-400 font-bold underline" : "hover:text-white underline"}
              >
                Cookie Policy
              </a>
              {" "}&middot;{" "}
              <a 
                href="#gestisci-cookie" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setShowCookieModal(false);
                  setShowCookieBanner(true); 
                }}
                className="hover:text-white cursor-pointer underline"
              >
                Gestisci preferenze cookie
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* ======================= COOKIE CONSENT BANNER ======================= */}
      {showCookieBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-neutral-950/95 backdrop-blur-md border border-neutral-800 text-white p-6 rounded-2xl shadow-2xl z-40 animate-fade-in font-sans relative">
          <button
            type="button"
            onClick={() => saveCookiePreferences(true, false, false)}
            aria-label="Chiudi e continua senza cookie non tecnici"
            title="Chiudi"
            className="absolute top-3.5 right-3.5 text-neutral-400 hover:text-white bg-neutral-900/70 hover:bg-neutral-800 w-8 h-8 rounded-full flex items-center justify-center transition border border-neutral-800 cursor-pointer"
          >
            <i className="fas fa-times"></i>
          </button>

          <div className="flex items-center gap-3 mb-3 pr-8">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <i className="fas fa-cookie-bite"></i>
            </div>
            <h5 className="font-bold font-mono text-lg text-white">Informativa sui Cookie</h5>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed mb-4">
            Usiamo cookie tecnici per far funzionare il sito e, solo con il tuo consenso, cookie statistici e di marketing di Google e Meta per capire come viene usato il sito e mostrarti annunci pertinenti. Puoi accettarli, rifiutarli o scegliere quali attivare; chiudendo con la X continui senza cookie non tecnici. Maggiori dettagli nella{" "}
            <a
              href="#cookie"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("cookie");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-amber-400 underline hover:text-amber-300"
            >
              Cookie Policy
            </a>.
          </p>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => saveCookiePreferences(true, true, true)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-2.5 px-3 rounded-xl transition cursor-pointer bebas text-sm tracking-wider"
              >
                Accetta tutti
              </button>
              <button 
                type="button"
                onClick={() => saveCookiePreferences(true, false, false)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-2.5 px-3 rounded-xl transition cursor-pointer bebas text-sm tracking-wider"
              >
                Rifiuta tutti
              </button>
            </div>
            <button 
              type="button"
              onClick={() => {
                setShowCookieBanner(false);
                setShowCookieModal(true);
              }}
              className="w-full border border-neutral-700 hover:bg-neutral-900 text-white font-bold py-2 rounded-xl transition cursor-pointer bebas text-sm tracking-wider"
            >
              Personalizza
            </button>
          </div>
        </div>
      )}

      {/* ======================= COOKIE PREFERENCES MODAL ======================= */}
      {showCookieModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-neutral-950 border border-neutral-800 text-white p-6 md:p-8 rounded-2xl shadow-2xl font-sans relative animate-fade-in">
            <button 
              type="button"
              onClick={() => setShowCookieModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white bg-neutral-900/50 hover:bg-neutral-900 w-8 h-8 rounded-full flex items-center justify-center transition border border-neutral-800 cursor-pointer"
              title="Chiudi"
            >
              <i className="fas fa-times"></i>
            </button>

            <div className="mb-6">
              <span className="text-xs font-bold font-mono text-amber-400 tracking-wider">PREFERENZE COOKIE</span>
              <h3 className="text-2xl font-black mt-1 font-sans text-white">Gestisci i Cookie</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Personalizza le impostazioni relative alla tua privacy di navigazione per il sito di Papone.
              </p>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Category 1: Tecnici */}
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Tecnici</span>
                    <span className="text-[11px] text-green-400 font-bold">Sempre attivi</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Fanno funzionare il sito e il modulo di prenotazione e ricordano le tue scelte sul banner. Non richiedono consenso e non possono essere disattivati.
                  </p>
                </div>
                <div className="shrink-0 pt-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={true}
                    aria-label="Cookie Tecnici (sempre attivi)"
                    disabled
                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-amber-500/60 opacity-75 cursor-not-allowed"
                  >
                    <span className="inline-block h-4 w-4 transform translate-x-6 rounded-full bg-neutral-950 transition" />
                  </button>
                </div>
              </div>

              {/* Category 2: Statistici */}
              <div 
                className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start justify-between gap-4 cursor-pointer hover:border-neutral-700 transition"
                onClick={() => setTempStatistici(!tempStatistici)}
              >
                <div className="space-y-1">
                  <span className="font-bold text-white text-sm">Statistici</span>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Google Analytics 4: statistiche aggregate su pagine visitate, durata delle visite, provenienza e dispositivo. Attivati solo con il tuo consenso.
                  </p>
                </div>
                <div className="shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    id="consent-statistici"
                    role="switch"
                    aria-checked={tempStatistici}
                    aria-label="Cookie Statistici"
                    onClick={() => setTempStatistici(!tempStatistici)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${
                      tempStatistici ? "bg-amber-500" : "bg-neutral-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        tempStatistici ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Category 3: Marketing */}
              <div 
                className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start justify-between gap-4 cursor-pointer hover:border-neutral-700 transition"
                onClick={() => setTempMarketing(!tempMarketing)}
              >
                <div className="space-y-1">
                  <span className="font-bold text-white text-sm">Marketing</span>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Google Ads, Pixel di Meta e contenuti di terze parti (mappa Google Maps). Attivati solo con il tuo consenso.
                  </p>
                </div>
                <div className="shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    id="consent-marketing"
                    role="switch"
                    aria-checked={tempMarketing}
                    aria-label="Cookie Marketing"
                    onClick={() => setTempMarketing(!tempMarketing)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${
                      tempMarketing ? "bg-amber-500" : "bg-neutral-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        tempMarketing ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-800 flex flex-col sm:flex-row gap-3 justify-end text-sm">
              <button 
                type="button"
                onClick={() => saveCookiePreferences(true, true, true)}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-6 py-2.5 rounded-xl transition cursor-pointer text-center bebas text-base tracking-wider"
              >
                Accetta tutti
              </button>
              <button 
                type="button"
                onClick={() => saveCookiePreferences(true, false, false)}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-6 py-2.5 rounded-xl transition cursor-pointer text-center bebas text-base tracking-wider"
              >
                Rifiuta tutti
              </button>
              <button 
                type="button"
                onClick={() => saveCookiePreferences(true, tempStatistici, tempMarketing)}
                className="w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 font-bold px-6 py-2.5 rounded-xl transition cursor-pointer text-center bebas text-base tracking-wider"
              >
                Salva preferenze
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
