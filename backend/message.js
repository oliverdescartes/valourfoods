const https = require("https");
require("dotenv").config();
const wb_token = process.env.AUTH_TOKEN;
console.log(wb_token);
const payload = JSON.stringify({
  messaging_product: "whatsapp",
  recipient_type: "individual",
  to: "+91 92330 54806",
  type: "image",

  image: {
    link: "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d",
    caption: "Testing image message",
  },
});

const options = {
  hostname: "graph.facebook.com",
  path: "/v25.0/1121547004371090/messages",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${wb_token}`,
    "Content-Length": Buffer.byteLength(payload),
  },
};

const req = https.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => console.log(JSON.parse(data)));
});

req.on("error", (e) => console.error(e));
req.write(payload);
req.end();
