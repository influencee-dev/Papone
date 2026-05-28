import type { IncomingMessage, ServerResponse } from "http";

type VercelRequest = IncomingMessage & { body: any };
type VercelResponse = ServerResponse & {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
};

function normalizePhone(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  if (digits.startsWith("39") && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith("0039")) return `+${digits.slice(2)}`;
  return `+39${digits}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { nome, cognome, email, tel, data, persone, note } = req.body;

  if (!nome || !cognome || !tel || !data || !persone) {
    return res.status(400).json({ error: "Campi obbligatori mancanti" });
  }

  const brevoApiKey = process.env.BREVO_API_KEY;
  const receiverEmail = process.env.BREVO_RECEIVER_EMAIL || "alessandro_doc@live.it";
  const telFormatted = normalizePhone(tel);

  if (!brevoApiKey) {
    return res.status(500).json({ error: "BREVO_API_KEY non configurata" });
  }

  // 1. Email notifica al gestore
  try {
    const emailResp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": brevoApiKey
      },
      body: JSON.stringify({
        sender: { name: "Sito Web Papone", email: receiverEmail },
        to: [{ email: receiverEmail, name: "Papone dal 1956" }],
        subject: `Nuova Prenotazione: ${nome} ${cognome} (${persone} persone)`,
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; background-color: #111111; color: #ffffff; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 30px; border-radius: 10px; border: 1px solid #d4a84b;">
                <h2 style="color: #d4a84b; border-bottom: 2px solid #d4a84b; padding-bottom: 15px;">Nuova Richiesta di Prenotazione</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 15px;">
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #333; font-weight: bold; color: #d4a84b; width: 150px;">Cliente:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #333; color: #fff;">${nome} ${cognome}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #333; font-weight: bold; color: #d4a84b;">Data:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #333; color: #fff;">${data}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #333; font-weight: bold; color: #d4a84b;">Coperti:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #333; color: #fff;">${persone} persone</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #333; font-weight: bold; color: #d4a84b;">Telefono:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #333;"><a href="tel:${tel}" style="color: #25d366;">${tel}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #333; font-weight: bold; color: #d4a84b;">Email:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #333; color: #fff;">${email || "Non inserita"}</td>
                  </tr>
                </table>
                ${note ? `<div style="margin-top: 20px; background: #222; padding: 15px; border-left: 4px solid #d4a84b; color: #ccc; font-style: italic;"><strong>Note:</strong> "${note}"</div>` : ""}
                <div style="margin-top: 30px; text-align: center;">
                  <a href="https://wa.me/${tel.replace(/\D/g, "")}" style="background: #25d366; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold;">
                    Contatta su WhatsApp
                  </a>
                </div>
              </div>
            </body>
          </html>
        `
      })
    });
    const emailData = await emailResp.json();
    console.log("[Brevo SMTP] Risposta:", JSON.stringify(emailData));
  } catch (err) {
    console.error("[Brevo SMTP] Errore:", err);
  }

  // 2. Salva contatto in Brevo CRM
  if (email) {
    try {
      const contactResp = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": brevoApiKey
        },
        body: JSON.stringify({
          email: email,
          attributes: {
            FIRSTNAME: nome,
            LASTNAME: cognome,
            SMS: telFormatted
          },
          listIds: [38],
          updateEnabled: true
        })
      });
      const contactData = await contactResp.json();
      console.log("[Brevo CRM] Risposta:", JSON.stringify(contactData));

      if (contactData.code === "duplicate_parameter") {
        const updateResp = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
          method: "PUT",
          headers: {
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": brevoApiKey
          },
          body: JSON.stringify({
            attributes: { FIRSTNAME: nome, LASTNAME: cognome, SMS: telFormatted },
            listIds: [38]
          })
        });
        console.log("[Brevo CRM] Aggiornamento:", await updateResp.text());
      }
    } catch (err) {
      console.error("[Brevo CRM] Errore:", err);
    }
  }

  return res.status(200).json({ success: true });
}
