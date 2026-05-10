import nodemailer from "nodemailer";

function createEmailTransporter() {
  const port = Number(process.env.EMAIL_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp-relay.brevo.com",
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

export async function sendMatchEmail(toEmail, lostItem, foundItem, score) {
  try {
    const transporter = createEmailTransporter();
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: "Possible Match Found For Your Lost Item",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color: #667eea;">
            Possible Match Found
          </h2>

          <p>
            A found item similar to your lost item has been reported.
          </p>

          ${
            Number.isFinite(score)
              ? `<p><b>AI Match Score:</b> ${Math.round(score * 100)}%</p>`
              : ""
          }

          <hr />

          <h3>Your Lost Item</h3>
          <p><b>Title:</b> ${lostItem.title}</p>
          <p><b>Description:</b> ${lostItem.description}</p>

          <h3>Found Item</h3>
          <p><b>Title:</b> ${foundItem.title}</p>
          <p><b>Description:</b> ${foundItem.description}</p>
          <p><b>Location:</b> ${foundItem.location}</p>

          <br />

          <a 
            href="http://localhost:3000/browse"
            style="
              background: #667eea;
              color: white;
              padding: 12px 20px;
              text-decoration: none;
              border-radius: 8px;
            "
          >
            Check Item
          </a>

          <br /><br />

          <p>
            Campus Lost & Found Portal
          </p>
        </div>
      `,
    });

    console.log("Match email sent to:", toEmail);

  } catch (error) {
    console.error("Email sending error:", error);
  }
}
