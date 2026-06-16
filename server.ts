import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "bookings.json");

app.use(express.json());

// Safely load bookings from local JSON database
function loadBookings() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Errore lettura database prenotazioni:", err);
  }
  return [];
}

// Save bookings to local JSON database
function saveBookings(bookings: any[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(bookings, null, 2), "utf-8");
  } catch (err) {
    console.error("Errore scrittura database prenotazioni:", err);
  }
}

// 1. POST /api/booking - Create a booking
app.post("/api/booking", (req, res) => {
  const { nome, cognome, email, tel, data, ora, persone, note } = req.body;
  
  if (!nome || !cognome || !tel || !data || !persone) {
    return res.status(400).json({ error: "Campi obbligatori mancanti" });
  }

  const bookings = loadBookings();
  const newBooking = {
    id: Date.now().toString(),
    nome,
    cognome,
    email: email || "",
    tel,
    data,
    ora: ora || "19:30",
    persone,
    note: note || "",
    status: "In attesa", // "In attesa", "Confermato", "Cancellato"
    createdAt: new Date().toISOString()
  };

  bookings.push(newBooking);
  saveBookings(bookings);

  console.log("Nuova prenotazione salvata con successo:", newBooking);

  // Brevo API Integration if BREVO_API_KEY is supplied
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    console.log("[Brevo] Key rilevata. Sincronizzazione contatto ed eventuale invio notifica...");
    const receiverEmail = process.env.BREVO_RECEIVER_EMAIL;

    // 1. Send transactional email to owner if configured and not alessandro_doc@live.it
    if (receiverEmail && receiverEmail.trim().toLowerCase() !== "alessandro_doc@live.it") {
      fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": brevoApiKey
        },
        body: JSON.stringify({
          sender: { name: "Sito Web Papone", email: "prenotazioni@papone.it" },
          to: [{ email: receiverEmail, name: "Papone dal 1956" }],
          subject: `Nuova Prenotazione: ${nome} ${cognome} (${persone} persone)`,
          htmlContent: `
            <html>
              <body style="font-family: Arial, sans-serif; background-color: #111111; color: #ffffff; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 30px; border-radius: 10px; border: 1px solid #d4a84b;">
                  <h2 style="color: #d4a84b; border-bottom: 2px solid #d4a84b; padding-bottom: 15px; font-weight: bold;">Nuova Richiesta di Prenotazione</h2>
                  <p style="font-size: 16px; margin-top: 20px;">Hai ricevuto una nuova richiesta dal sito web:</p>
                  <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 15px;">
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #333333; font-weight: bold; color: #d4a84b; width: 150px;">Cliente:</td>
                      <td style="padding: 10px; border-bottom: 1px solid #333333; color: #ffffff;">${nome} ${cognome}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #333333; font-weight: bold; color: #d4a84b;">Data Richiesta:</td>
                      <td style="padding: 10px; border-bottom: 1px solid #333333; color: #ffffff;">${data} alle ${ora || "19:30"}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #333333; font-weight: bold; color: #d4a84b;">N° Coperti:</td>
                      <td style="padding: 10px; border-bottom: 1px solid #333333; color: #ffffff;">${persone} persone</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #333333; font-weight: bold; color: #d4a84b;">Telefono:</td>
                      <td style="padding: 10px; border-bottom: 1px solid #333333;"><a href="tel:${tel}" style="color: #25d366; text-decoration: none; font-weight: bold;">${tel}</a></td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #333333; font-weight: bold; color: #d4a84b;">Email:</td>
                      <td style="padding: 10px; border-bottom: 1px solid #333333; color: #ffffff;">${email || "Non inserita"}</td>
                    </tr>
                  </table>
                  ${note ? `
                  <div style="margin-top: 20px; background-color: #222222; padding: 15px; border-radius: 5px; border-left: 4px solid #d4a84b; font-style: italic; color: #cccccc;">
                    <strong>Note Speciali:</strong><br/>
                    "${note}"
                  </div>` : ""}
                  <div style="margin-top: 35px; text-align: center;">
                    <a href="https://wa.me/${tel.replace(/\D/g, '')}" style="background-color: #25d366; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold; display: inline-block;">
                      Contatta Cliente su WhatsApp
                    </a>
                  </div>
                </div>
              </body>
            </html>
          `
        })
      })
      .then(r => r.json())
      .then(data => console.log("[Brevo SMTP] Email inviata con successo:", data))
      .catch(err => console.error("[Brevo SMTP] Errore invio email:", err));
    } else {
      console.log("[Brevo SMTP] Invio email omesso: nessun destinatario configurato o indirizzo alessandro_doc@live.it escluso.");
    }

    // 2. Add/Update customer as Contact in CRM List
    if (email) {
      // Format phone number for Brevo's SMS attribute (needs international format, e.g. +393331234567)
      let formattedSms: string | undefined = undefined;
      if (tel) {
        const cleaned = tel.replace(/[^\d+]/g, '');
        if (cleaned.startsWith('+')) {
          formattedSms = cleaned;
        } else if (cleaned.startsWith('39') && cleaned.length >= 11 && cleaned.length <= 13) {
          formattedSms = `+${cleaned}`;
        } else if (/^3\d{9}$/.test(cleaned) || /^3\d{8}$/.test(cleaned)) {
          formattedSms = `+39${cleaned}`;
        } else {
          formattedSms = cleaned; // Try as-is
        }
      }

      const listIdStr = process.env.BREVO_LIST_ID || "1";
      const listIds = listIdStr.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));

      const contactPayload: any = {
        email: email,
        attributes: {
          FIRSTNAME: nome,
          LASTNAME: cognome
        },
        listIds: listIds.length > 0 ? listIds : [1],
        updateEnabled: true
      };

      if (formattedSms) {
        contactPayload.attributes.SMS = formattedSms;
      }

      console.log(`[Brevo CRM] Invio richiesta creazione contatto a lista/e [${listIds.join(", ")}] con payload:`, JSON.stringify(contactPayload));

      fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": brevoApiKey
        },
        body: JSON.stringify(contactPayload)
      })
      .then(async r => {
        const status = r.status;
        const resBody = await r.json().catch(() => ({}));
        if (!r.ok) {
          console.error(`[Brevo CRM] Sincronizzazione contatto fallita (Status ${status}):`, resBody);
          // If SMS format error led to the rejection, retry without SMS so the contact is still successfully synchronized
          const isSmsError = JSON.stringify(resBody).toLowerCase().includes("sms") || 
                             JSON.stringify(resBody).toLowerCase().includes("phone") ||
                             JSON.stringify(resBody).toLowerCase().includes("attribute");
          
          if (formattedSms && isSmsError) {
            console.log("[Brevo CRM] Tento nuovamente la sincronizzazione escludendo l'attributo SMS...");
            delete contactPayload.attributes.SMS;
            fetch("https://api.brevo.com/v3/contacts", {
              method: "POST",
              headers: {
                "accept": "application/json",
                "content-type": "application/json",
                "api-key": brevoApiKey
              },
              body: JSON.stringify(contactPayload)
            })
            .then(async r2 => {
              const resBody2 = await r2.json().catch(() => ({}));
              if (r2.ok) {
                console.log("[Brevo CRM] Contatto sincronizzato con successo nell'opportunità di ripiego (senza SMS):", resBody2);
              } else {
                console.error(`[Brevo CRM] Fallito anche il tentativo di ripiego (Status ${r2.status}):`, resBody2);
              }
            })
            .catch(err => console.error("[Brevo CRM Fallback] Errore di connessione:", err));
          }
        } else {
          console.log("[Brevo CRM] Contatto sincronizzato con successo:", resBody);
        }
      })
      .catch(err => console.error("[Brevo CRM] Errore connessione o di rete:", err));
    }
  } else {
    console.warn("[Brevo] Nessuna BREVO_API_KEY trovata nell'ambiente. Autosalvataggio locale nel database json completato.");
  }

  return res.status(200).json({ success: true, booking: newBooking });
});

// 2. GET /api/booking - List all bookings
app.get("/api/booking", (req, res) => {
  const bookings = loadBookings();
  return res.json({ bookings });
});

// 3. PATCH /api/booking/:id - Update booking status
app.patch("/api/booking/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const bookings = loadBookings();
  const index = bookings.findIndex((b: any) => b.id === id);
  if (index !== -1) {
    bookings[index].status = status || bookings[index].status;
    saveBookings(bookings);
    return res.json({ success: true, booking: bookings[index] });
  }
  return res.status(404).json({ error: "Prenotazione non trovata" });
});

async function startServer() {
  // Vite dev server middleware integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Papone Server] running on http://localhost:${PORT}`);
  });
}

startServer();
