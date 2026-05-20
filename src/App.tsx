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
  const [activeTab, setActiveTab] = useState<"home" | "menu">("home");
  const [showAdmin, setShowAdmin] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
              <img src="logo.png" alt="Papone Dal 1956" className="nav-logo" />
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
                  <h3>ANTIPASTI & GRILL</h3>
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
                  <div className="hour-row"><span>Lunedì</span><span>00:00 – 24:00</span></div>
                  <div className="hour-row"><span>Martedì</span><span>00:00 – 24:00</span></div>
                  <div className="hour-row"><span>Mercoledì</span><span>00:00 – 24:00</span></div>
                  <div className="hour-row"><span>Giovedì</span><span>00:00 – 24:00</span></div>
                  <div className="hour-row"><span>Venerdì</span><span>00:00 – 24:00</span></div>
                  <div className="hour-row"><span>Sabato</span><span>00:00 – 24:00</span></div>
                  <div className="hour-row"><span>Domenica</span><span>00:00 – 24:00</span></div>
                  <p style={{ marginTop: "20px", fontWeight: "bold", color: "var(--color-accent)", fontSize: "1.2rem" }} className="bebas">
                    APERTO SEMPRE
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
              
              {/* CATEGORIA 1: ANTIPASTI */}
              <div className="menu-category" id="menu-antipasti">
                <h2 className="category-title border-b-2">Gli Antipasti</h2>
                <div className="menu-grid">
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Tagliere Papone</span>
                        <span className="item-price">€ 18.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Salumi locali, formaggi artigianali, sott'oli fatti in casa e bruschette.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Gran Fritto Misto</span>
                        <span className="item-price">€ 12.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Arancini, crocchette, mozzarelle in carrozza e verdure in pastella.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CATEGORIA 2: STEAKHOUSE */}
              <div className="menu-category" id="menu-steakhouse">
                <h2 className="category-title border-b-2">Steakhouse</h2>
                <div className="menu-grid">
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Fiorentina di Scottona</span>
                        <span className="item-price">€ 4.50/hg</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Frollatura minima 30 giorni, cotta su griglia a legna.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Tagliata al Rosmarino</span>
                        <span className="item-price">€ 22.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Controfiletto di manzo con sale grigio e rosmarino fresco.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Ribs BBQ</span>
                        <span className="item-price">€ 16.50</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Costine di maiale marinate e glassate con salsa barbeque artigianale.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CATEGORIA 3: I NOSTRI BURGER */}
              <div className="menu-category" id="menu-burger">
                <h2 className="category-title border-b-2">I Nostri Burger</h2>
                <div className="menu-grid">
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Il Classico 1956</span>
                        <span className="item-price">€ 11.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Manzo 200g, cheddar, lattuga, pomodoro e salsa segreta Papone.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Wild West</span>
                        <span className="item-price">€ 13.50</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Manzo, bacon croccante, anelli di cipolla e salsa smoky BBQ.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Veggie Soul</span>
                        <span className="item-price">€ 10.50</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Burger di ceci e barbabietola, zucchine grigliate e crema di avocado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CATEGORIA 4: BIRRE ARTIGIANALI */}
              <div className="menu-category" id="menu-birre">
                <h2 className="category-title border-b-2">Birre Artigianali</h2>
                <div className="menu-grid">
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Papone IPA (Alla spina)</span>
                        <span className="item-price">€ 6.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        La nostra bionda di punta, fresca e luppolata.
                      </p>
                    </div>
                  </div>
                  <div className="menu-item">
                    <div className="item-info">
                      <div className="item-header">
                        <span className="item-name text-white">Ammiraglia Double Malt</span>
                        <span className="item-price">€ 7.00</span>
                      </div>
                      <p className="item-desc text-neutral-400">
                        Rossa ambrata, corpo pieno e note di caramello.
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


      {/* ======================= REUSABLE FOOTER ======================= */}
      <footer>
        <div className="container">
          <div className="footer-grid">
            
            {/* COLUMN 1 */}
            <div className="footer-col">
              <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ display: "inline-block", cursor: "pointer" }}>
                  <img src="/logo.png" alt="Logo Papone" className="footer-logo" style={{ marginBottom: 0 }} />
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
              <ul className="footer-links">
                <li className="text-neutral-200">Tutti i giorni</li>
                {activeTab === "home" ? (
                  <>
                    <li style={{ fontSize: "1.2rem", color: "var(--color-text)" }}>00:00 – 24:00</li>
                    <li style={{ marginTop: "15px", color: "var(--color-accent)", fontWeight: "bold" }}>
                      Sempre aperti per te.
                    </li>
                  </>
                ) : (
                  <>
                    <li className="text-neutral-100 flex items-center justify-center md:justify-start gap-2">
                      <i className="far fa-clock" style={{ color: "var(--color-accent)" }}></i> 19:30 – 01:00
                    </li>
                    <li style={{ marginTop: "15px", color: "var(--color-accent)", fontWeight: "bold" }} className="bebas text-lg">
                      APERTO SEMPRE
                    </li>
                  </>
                )}
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
              <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Cookie Policy</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Gestisci preferenze cookie</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
