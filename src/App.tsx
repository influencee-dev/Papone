import React, { useState, useEffect, useRef } from "react";

interface Booking {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  tel: string;
  data: string;
  persone: string;
  note: string;
  status: string;
  createdAt: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "privacy" | "cookie">("home");
  const [showAdmin, setShowAdmin] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Cookie Consent States
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [cookieConsent, setCookieConsent] = useState<{
    necessari: boolean;
    statistici: boolean;
    marketing: boolean;
    sceltaCompletata: boolean;
  }>({
    necessari: true,
    statistici: false,
    marketing: false,
    sceltaCompletata: false
  });

  const [tempStatistici, setTempStatistici] = useState(false);
  const [tempMarketing, setTempMarketing] = useState(false);

  useEffect(() => {
    // Caricamento preferenze cookie salvate
    const savedConsent = localStorage.getItem("papone_cookie_consent");
    if (savedConsent) {
      const parsed = JSON.parse(savedConsent);
      setCookieConsent(parsed);
      setTempStatistici(parsed.statistici);
      setTempMarketing(parsed.marketing);
    } else {
      setShowCookieBanner(true);
    }
  }, []);

  const saveCookiePreferences = (necessari: boolean, statistici: boolean, marketing: boolean) => {
    const newConsent = {
      necessari,
      statistici,
      marketing,
      sceltaCompletata: true
    };
    localStorage.setItem("papone_cookie_consent", JSON.stringify(newConsent));
    setCookieConsent(newConsent);
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
    persone: "2",
    note: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState("");

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
    setFormLoading(true);
    setFormSuccessMessage("");

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
      persone: "2",
      note: "",
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
                        <span className="font-bold text-white">{b.data}</span>
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
                      <div className="form-grid">
                        <div className="form-group">
                          <label htmlFor="nome">Nome</label>
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
                          <label htmlFor="cognome">Cognome</label>
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
                          <label htmlFor="email">Email</label>
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
                          <label htmlFor="tel">Telefono</label>
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
                          <label htmlFor="data">Data preferita</label>
                          <input 
                            type="date" 
                            id="data" 
                            required
                            value={formData.data}
                            onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="persone">N° persone</label>
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
                  <div className="hour-row"><span>Martedì</span><span>20:00 – 02:00</span></div>
                  <div className="hour-row"><span>Mercoledì</span><span>20:00 – 02:00</span></div>
                  <div className="hour-row"><span>Giovedì</span><span>20:00 – 02:00</span></div>
                  <div className="hour-row"><span>Venerdì</span><span>20:00 – 02:00</span></div>
                  <div className="hour-row"><span>Sabato</span><span>20:00 – 01:00</span></div>
                  <div className="hour-row"><span>Domenica</span><span style={{ color: "var(--color-accent)", fontWeight: "bold" }}>CHIUSO</span></div>
                  <p style={{ marginTop: "20px", fontWeight: "bold", color: "var(--color-accent)", fontSize: "1.2rem" }} className="bebas">
                    MARTEDÌ – SABATO
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
                  <iframe 
                    src="https://maps.google.com/maps?q=Via%20Trinitapoli%2024,%2071121%20Foggia%20FG,%20Italy&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                    allowFullScreen={true} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
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
                        <span className="item-name text-white">Fiori di zucca (5 pezzi)</span>
                        <span className="item-price">€ 5.00</span>
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
                        <span className="item-name text-white">Triangolo speck e patate (5 pezzi)</span>
                        <span className="item-price">€ 5.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Nuggets di pulled pork (5 pezzi)</span>
                        <span className="item-price">€ 6.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Nuggets di pollo (6 pezzi)</span>
                        <span className="item-price">€ 4.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Stick di mozzarella (5 pezzi)</span>
                        <span className="item-price">€ 5.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Olive ascolane (6 pezzi)</span>
                        <span className="item-price">€ 3.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Patatine fritte</span>
                        <span className="item-price">€ 3.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Patate dolci americane</span>
                        <span className="item-price">€ 4.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Patate cheddar e bacon</span>
                        <span className="item-price">€ 4.90</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        * € 5.90 con doppio cheddar e bacon croccante
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Parmigiana</span>
                        <span className="item-price">€ 5.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Mix di affettati</span>
                        <span className="item-price">€ 6.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Formaggi mix</span>
                        <span className="item-price">€ 6.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Contorni (piatto small)</span>
                        <span className="item-price">€ 4.00</span>
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
                        <span className="item-price">€ 5.00</span>
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
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Gateau di patate</span>
                        <span className="item-price">€ 5.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Nodini di latte vaccino</span>
                        <span className="item-price">€ 0.80 / pezzo</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Frittata</span>
                        <span className="item-price">€ 4.00</span>
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
                        <span className="item-price">€ 6.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Hamburger di pollo</span>
                        <span className="item-price">€ 6.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Hamburger Scottona</span>
                        <span className="item-price">€ 8.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Mortadella alla brace</span>
                        <span className="item-price">€ 4.00</span>
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
                        <span className="item-price">€ 18.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Rucola, pomodorini e grana
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
                        <span className="item-price">€ 4.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Torcinelli (5 pezzi)</span>
                        <span className="item-price">€ 6.50</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Paccanelli (5 pezzi)</span>
                        <span className="item-price">€ 6.50</span>
                      </div>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Arrosto mix per 2 persone + 2 birre 0.4L</span>
                        <span className="item-price">€ 30.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        4 salsicce, 2 hamburger, 1 paccanello, 4 torcinelli + patatine fritte
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Arrosto mix per 4 persone + 1.5L birra</span>
                        <span className="item-price">€ 60.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        8 salsicce, 4 hamburger, 2 paccanelli, 6 torcinelli + patatine fritte
                      </p>
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
              </div>

              {/* CATEGORIA 3: I NOSTRI BURGER */}
              <div className="menu-category" id="menu-burger">
                <h2 className="category-title border-b-2">I Nostri Burger & Panini</h2>
                <div className="menu-grid">
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Cowboy</span>
                        <span className="item-price">€ 9.00</span>
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
                        <span className="item-price">€ 9.00</span>
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
                        <span className="item-price">€ 9.00</span>
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
                        <span className="item-price">€ 9.00</span>
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
                        <span className="item-price">€ 9.00</span>
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

              {/* LE NOSTRE COMBO */}
              <div className="menu-category" id="menu-combo">
                <h2 className="category-title border-b-2">Le Nostre Combo</h2>
                <div className="menu-grid">
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Menù Il Buono & Il Cattivo (Adulti)</span>
                        <span className="item-price">€ 12.99</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Panino + patatine fritte + bibita / birra 0.20 / calice di vino.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Menù Pony (Bambini)</span>
                        <span className="item-price">€ 9.99</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Panino (con hamburger o cotoletta) + patatine fritte + bibita.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Combo Texano</span>
                        <span className="item-price">€ 32.99</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        2 Menù Adulti + 1 Menù bambini.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CATEGORIA 4: LE BIRRE (SPINA & ARTIGIANALI) */}
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
                        <span className="item-price">€ 6.00</span>
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
                        <span className="item-price">€ 5.00</span>
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
                        <span className="item-price">€ 8.00</span>
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
                        <span className="item-price">€ 4.00</span>
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
                        <span className="item-price">€ 3.00</span>
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
                        <span className="item-price">€ 16.00</span>
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
              <span className="section-label bebas text-amber-400 tracking-wider">INFORMATIVA SULLA PRIVACY</span>
              <h1 className="text-4xl font-extrabold mt-2 text-white font-sans tracking-tight">Privacy Policy</h1>
              <p className="text-sm text-neutral-400 font-mono mt-2">Ultimo aggiornamento: 20 maggio 2026</p>
            </div>
            
            <div className="prose prose-invert max-w-none text-neutral-300 space-y-8 font-sans leading-relaxed">
              <div>
                <h3 className="text-xl font-bold font-mono text-amber-400 mb-3 uppercase tracking-wider">1. Titolare del Trattamento</h3>
                <p>
                  Il titolare del trattamento dei dati personali raccolti attraverso questo sito internet è la ditta titolare del marchio 
                  <strong> "Papone Dal 1956"</strong> situato in <em>Via Trinitapoli 24, 71121 Foggia FG, Italia</em>. Per qualsiasi richiesta o informazione in merito alla gestione dei tuoi dati, è possibile scrivere all'indirizzo email: <a href="mailto:alessandro_doc@live.it" className="text-amber-400 underline hover:text-amber-500 transition">alessandro_doc@live.it</a>.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold font-mono text-amber-400 mb-3 uppercase tracking-wider">2. Tipologia di Dati Raccolti</h3>
                <p>
                  Quando compili il nostro modulo di prenotazione o richiedi informazioni sul sito, raccogliamo le seguenti informazioni essenziali fornite volontariamente:
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 text-neutral-300 pl-4">
                  <li><strong>Nome e Cognome:</strong> Necessari per identificare la prenotazione del tavolo.</li>
                  <li><strong>Numero di Telefono:</strong> Utilizzato per confermare o comunicare variazioni sulla prenotazione tramite contatto telefonico o WhatsApp.</li>
                  <li><strong>Indirizzo Email:</strong> Usato facoltativamente per l'invio della notifica di riepilogo e ai fini della gestione dei contatti.</li>
                  <li><strong>Numero di Coperti e Note speciali:</strong> Necessari per organizzare la sala in base alle preferenze o alle intolleranze alimentari segnalate.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold font-mono text-amber-400 mb-3 uppercase tracking-wider">3. Finalità e Base Giuridica del Trattamento</h3>
                <p>
                  I dati raccolti vengono trattati per le seguenti finalità:
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 text-neutral-300 pl-4">
                  <li>Adempiere alle richieste di prenotazione inoltrate dall'utente (gestione del tavolo, conferma e recapito).</li>
                  <li>Inviare comunicazioni di conferma tramite email e integrare il contatto con i nostri servizi interni ed SMS/notifiche automatiche di conferma della prenotazione tramite Brevo.</li>
                  <li>Fornire il link rapido per l'inoltro diretto guidato via WhatsApp al numero dell'attività.</li>
                </ul>
                <p className="mt-4">
                  La base giuridica di questo trattamento è l'esecuzione di misure precontrattuali e contrattuali (la richiesta di prenotazione del tavolo effettuata dall'utente) e il legittimo interesse del titolare a rispondere alle richieste di contatto.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold font-mono text-amber-400 mb-3 uppercase tracking-wider">4. Destinatari dei Dati e Terze Parti</h3>
                <p>
                  I tuoi dati personali non vengono venduti o scambiati a scopo di marketing o profilazione da parte di terzi. Tuttavia, per il funzionamento sicuro del servizio, ci avvaliamo delle seguenti piattaforme:
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 text-neutral-300 pl-4">
                  <li><strong>Server hosting e infrastrutture Cloud:</strong> Per ospitare l'applicazione in modo sicuro.</li>
                  <li><strong>WhatsApp (Meta Platforms, Inc.):</strong> Il servizio consente di reindirizzare i dettagli della prenotazione sul vostro account per completare l'invio del messaggio di prenotazione guidato.</li>
                  <li><strong>Brevo (Sendinblue):</strong> Se configurato, per la spedizione di notifiche automatiche via email relative alle richieste ricevute.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold font-mono text-amber-400 mb-3 uppercase tracking-wider">5. Durata della Conservazione dei Dati</h3>
                <p>
                  I dati relativi alle prenotazioni vengono conservati in un database locale cifrato sul server al fine di consentire ai gestori dell'attività di approvare o rifiutare la richiesta e tenere un registro della disponibilità. I dati vengono conservati per il tempo strettamente necessario all'esecuzione del servizio richiesto (solitamente non oltre 12 mesi dalla data della consumazione, salvo obblighi di legge o richieste esplicite di cancellazione da parte dell'utente).
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold font-mono text-amber-400 mb-3 uppercase tracking-wider">6. Diritti degli Interessati</h3>
                <p>
                  In conformità con il Regolamento Generale sulla Protezione dei Dati (GDPR - Regolamento UE 2016/679), l'utente ha il diritto in qualunque momento di:
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 text-neutral-300 pl-4">
                  <li>Ottenere la conferma dell'esistenza di dati personali che lo riguardano e accedervi.</li>
                  <li>Richiedere la rettifica, la cancellazione o la limitazione del trattamento dei dati.</li>
                  <li>Opporsi al trattamento in qualsiasi momento per motivi legittimi.</li>
                  <li>Ottenere la portabilità dei dati o revocare il consenso prestato in qualsiasi momento.</li>
                </ul>
                <p className="mt-4">
                  Per esercitare tali diritti, puoi contattare comodamente il titolare all'indirizzo email <a href="mailto:alessandro_doc@live.it" className="text-amber-400 underline hover:text-amber-500 transition">alessandro_doc@live.it</a>. Risponderemo tempestivamente a ogni tua richiesta.
                </p>
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
              <span className="section-label bebas text-amber-400 tracking-wider">GESTIONE DEI COOKIE</span>
              <h1 className="text-4xl font-extrabold mt-2 text-white font-sans tracking-tight">Cookie Policy</h1>
              <p className="text-sm text-neutral-400 font-mono mt-2">Ultimo aggiornamento: 20 maggio 2026</p>
            </div>
            
            <div className="prose prose-invert max-w-none text-neutral-300 space-y-8 font-sans leading-relaxed">
              <div>
                <h3 className="text-xl font-bold font-mono text-amber-400 mb-3 uppercase tracking-wider">1. Cosa sono i Cookie</h3>
                <p>
                  I cookie sono piccoli file di testo che i siti visitati inviano e registrano sul computer o dispositivo mobile dell'utente, per essere poi ritrasmessi agli stessi siti alla visita successiva. Grazie ai cookie, il sito ricorda le tue azioni e preferenze (come dettagli di visualizzazione, impostazioni, consensi) in modo che tu non debba reinserirle quando ritorni sul sito o navighi da una pagina all'altra.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold font-mono text-amber-400 mb-3 uppercase tracking-wider">2. Come utilizziamo i Cookie</h3>
                <p>
                  Il sito di Papone Dal 1956 utilizza i cookie per migliorare l'esperienza utente, permettere il funzionamento del carrello o dei moduli di prenotazione, ricordare lo stato del consenso relativo ai cookie stessi e proteggere l'infrastruttura di rete.
                </p>
                <p className="mt-3">
                  I cookie si dividono comunemente in cookie di prima parte (installati direttamente dal gestore del sito) e cookie di terza parte (installati da servizi esterni integrati nel sito).
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold font-mono text-amber-400 mb-3 uppercase tracking-wider">3. Tipologie di Cookie usati su questo Sito</h3>
                <p className="mb-4">
                  Puoi decidere in qualsiasi momento quali categorie abilitare attraverso lo strumento di gestione disponibile in questa pagina o tramite il link nel footer.
                </p>
                
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white text-lg">A. Cookie Tecnici / Necessari (Sempre Attivi)</span>
                      <span className="text-xs bg-green-950 text-green-400 border border-green-800 px-3 py-1 rounded-full font-bold uppercase">Obbligatori</span>
                    </div>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      Questi cookie sono essenziali per il corretto funzionamento del sito. Includono, ad esempio, i file di sessione che tengono traccia della compilazione dei moduli di prenotazione, dello stato del consenso relativo ai cookie (per non mostrare nuovamente il banner ad ogni pagina). Senza questi cookie, parti del sito non funzionerebbero correttamente.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-white text-lg">B. Cookie Statistici / Analitici (Opzionali)</span>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${cookieConsent.statistici ? "bg-green-950 text-green-400 border border-green-800" : "bg-neutral-800 text-neutral-400 border border-neutral-700"}`}>
                        {cookieConsent.statistici ? "Attivi (Abilitati)" : "Disattivi"}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      Questi cookie raccolgono informazioni in forma anonima e aggregata sull'utilizzo del sito da parte degli utenti (ad esempio: quali pagine vengono visitate più spesso, tempo di permanenza sul sito, origini di provenienza del traffico). Utilizziamo questi dati solo per scopi statistici e per ottimizzare la stesura dei contenuti e la velocità di caricamento delle pagine.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-white text-lg">C. Cookie di Profilazione o Marketing (Opzionali)</span>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${cookieConsent.marketing ? "bg-green-950 text-green-400 border border-green-800" : "bg-neutral-800 text-neutral-400 border border-neutral-700"}`}>
                        {cookieConsent.marketing ? "Attivi (Abilitati)" : "Disattivi"}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      Questi cookie permettono di integrare servizi forniti da terze parti che potrebbero raccogliere informazioni sulla navigazione allo scopo di mostrare annunci pubblicitari pertinenti o tracciare interazioni con elementi social inseriti nelle pagine (come la visualizzazione di mappe incorporate Google Maps o video).
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold font-mono text-amber-400 mb-3 uppercase tracking-wider">4. Come modificare le preferenze cookie dal Browser</h3>
                <p>
                  La maggior parte dei browser moderni consente di configurare la modalità di accettazione o blocco generale dei cookie. Ecco i collegamenti alle guide ufficiali dei browser principali:
                </p>
                <ul className="list-disc list-inside mt-3 space-y-1 text-neutral-300 text-sm pl-4">
                  <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-500">Google Chrome</a></li>
                  <li><a href="https://support.mozilla.org/it/kb/Attivare%20e%20disattivare%20i%20cookie" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-500">Mozilla Firefox</a></li>
                  <li><a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-500">Apple Safari</a></li>
                  <li><a href="https://support.microsoft.com/it-it/microsoft-edge/eliminare-e-gestire-i-cookie-in-microsoft-edge-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-500">Microsoft Edge</a></li>
                </ul>
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
                <li className="text-neutral-200">Martedì – Venerdì</li>
                <li style={{ fontSize: "1.1rem", color: "var(--color-text)", marginBottom: "8px" }}>20:00 – 02:00</li>
                <li className="text-neutral-200">Sabato</li>
                <li style={{ fontSize: "1.1rem", color: "var(--color-text)", marginBottom: "8px" }}>20:00 – 01:00</li>
                <li className="text-neutral-200">Domenica e Lunedì</li>
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
            <p>&copy; {new Date().getFullYear()} Papone Dal 1956. Tutti i diritti riservati.</p>
            <div className="footer-legal">
              <a 
                href="#privacy" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setActiveTab("privacy"); 
                  window.scrollTo({ top: 0, behavior: "smooth" }); 
                }}
                className={activeTab === "privacy" ? "text-amber-400 font-bold" : ""}
              >
                Privacy Policy
              </a>
              <a 
                href="#cookie" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setActiveTab("cookie"); 
                  window.scrollTo({ top: 0, behavior: "smooth" }); 
                }}
                className={activeTab === "cookie" ? "text-amber-400 font-bold" : ""}
              >
                Cookie Policy
              </a>
              <a 
                href="#gestisci-cookie" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setShowCookieModal(true); 
                }}
                className="hover:text-amber-400 cursor-pointer"
              >
                Gestisci preferenze cookie
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ======================= COOKIE CONSENT BANNER ======================= */}
      {showCookieBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-neutral-950/95 backdrop-blur-md border border-neutral-800 text-white p-6 rounded-2xl shadow-2xl z-40 animate-fade-in font-sans">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <i className="fas fa-cookie-bite"></i>
            </div>
            <h5 className="font-bold font-mono text-lg text-white">Informativa sui Cookie</h5>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed mb-4">
            Utilizziamo cookie tecnici essenziali per il corretto funzionamento del sito. Con il tuo consenso, vorremmo utilizzare anche cookie analitici anonimi e di profilazione marketing terzi per migliorare la tua esperienza.
          </p>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => saveCookiePreferences(true, true, true)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-2.5 rounded-xl transition cursor-pointer bebas text-sm tracking-wider"
            >
              ACCETTA TUTTI I COOKIE
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => saveCookiePreferences(true, false, false)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 rounded-xl transition cursor-pointer bebas text-sm tracking-wider"
              >
                SOLO NECESSARI
              </button>
              <button 
                onClick={() => {
                  setShowCookieBanner(false);
                  setShowCookieModal(true);
                }}
                className="border border-neutral-700 hover:bg-neutral-900 text-white font-bold py-2 rounded-xl transition cursor-pointer bebas text-sm tracking-wider"
              >
                PERSONALIZZA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= COOKIE PREFERENCES MODAL ======================= */}
      {showCookieModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-neutral-950 border border-neutral-800 text-white p-6 md:p-8 rounded-2xl shadow-2xl font-sans relative animate-fade-in">
            <button 
              onClick={() => setShowCookieModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white bg-neutral-900/50 hover:bg-neutral-900 w-8 h-8 rounded-full flex items-center justify-center transition border border-neutral-800"
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
              {/* Category 1 */}
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Cookie Tecnici / Essenziali</span>
                    <span className="text-[10px] bg-green-950 text-green-400 border border-green-800 px-2 py-0.5 rounded-full font-bold uppercase">Sempre Attivi</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Indispensabili per navigare sul sito, registrare i vostri consensi e consentire l'utilizzo sicuro dei moduli di prenotazione. Non possono essere disattivati.
                  </p>
                </div>
                <div className="shrink-0 pt-1">
                  <input type="checkbox" checked disabled className="w-4 h-4 accent-amber-500 opacity-60" />
                </div>
              </div>

              {/* Category 2 */}
              <div 
                className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start justify-between gap-4 cursor-pointer hover:border-neutral-700 transition"
                onClick={() => setTempStatistici(!tempStatistici)}
              >
                <div className="space-y-1">
                  <span className="font-bold text-white text-sm">Cookie Statistici / Analitici</span>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Ci consentono di misurare il numero di visite e analizzare le fonti del traffico in modo del tutto aggregato e anonimo. Se disattivati non potremo ottimizzare l'esperienza di navigazione.
                  </p>
                </div>
                <div className="shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    id="consent-statistici"
                    checked={tempStatistici} 
                    onChange={(e) => setTempStatistici(e.target.checked)} 
                    className="w-4 h-4 accent-amber-500 cursor-pointer" 
                  />
                </div>
              </div>

              {/* Category 3 */}
              <div 
                className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start justify-between gap-4 cursor-pointer hover:border-neutral-700 transition"
                onClick={() => setTempMarketing(!tempMarketing)}
              >
                <div className="space-y-1">
                  <span className="font-bold text-white text-sm">Cookie di Profilazione e Marketing</span>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Utilizzati da partner terzi (come Google Maps incorporata) per fornirti contenuti pertinenti ed elementi social integrati adatti alle tue preferenze di navigazione.
                  </p>
                </div>
                <div className="shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    id="consent-marketing"
                    checked={tempMarketing} 
                    onChange={(e) => setTempMarketing(e.target.checked)} 
                    className="w-4 h-4 accent-amber-500 cursor-pointer" 
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-800 flex flex-col sm:flex-row gap-3 justify-end text-sm">
              <button 
                onClick={() => saveCookiePreferences(true, true, true)}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-6 py-2.5 rounded-xl transition cursor-pointer text-center bebas text-base tracking-wider"
              >
                ACCETTA TUTTI
              </button>
              <button 
                onClick={() => saveCookiePreferences(true, tempStatistici, tempMarketing)}
                className="w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 font-bold px-6 py-2.5 rounded-xl transition cursor-pointer text-center bebas text-base tracking-wider"
              >
                SALVA PREFERENZE
              </button>
              <button 
                onClick={() => setShowCookieModal(false)}
                className="w-full sm:w-auto bg-transparent hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white font-medium px-6 py-2.5 rounded-xl transition cursor-pointer text-center bebas text-base tracking-wider"
              >
                ANNULLA
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
