const express = require("express");
const axios = require("axios");
const cors = require("cors");
require('dotenv').config(); 

const app = express();
app.use(express.json());
app.use(cors());

const apiKey = process.env.SENDGRID_API_KEY; 

app.post("/api/send-deal-email", async (req, res) => {
  const { email, deal } = req.body;

  if (!email || !deal) {
    return res.status(400).json({ error: "Email and deal information are required." });
  }

  try {
    const msg = {
      personalizations: [{ to: [{ email: email }] }],
      from: { email: 'daddy@daddydeals.co.za' },
      subject: `Check out this deal: ${deal.name}`,
      content: [
        {
          type: 'text/plain',
          value: `Deal: ${deal.name}\nPrice: R${deal.sale_price || deal.regular_price}\nDescription: ${deal.description}\nView the deal at: https://daddysdeals.co.za/product/?p=${deal.id}/`
        },
        {
          type: 'text/html',
          value: `
            <h1>${deal.name}</h1>
            <img src="${deal.images[0].src}" alt="${deal.name}" style="width:100%;height:auto;">
            <p>${deal.description}</p>
            <p>Price: R${deal.sale_price || deal.regular_price}</p>
            <p><a href="https://daddysdeals.co.za/product/?p=${deal.id}/">View Deal</a></p>
          `
        }
      ]
    };

    const response = await axios.post('https://api.sendgrid.com/v3/mail/send', msg, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ success: true, message: "Deal email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, message: "Failed to send deal email.", error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
