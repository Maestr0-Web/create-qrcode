import morgan from "morgan";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("tiny"));
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/index.html"));
});

app.post("/made", (req, res) => {
  const type = req.body.type;
  let qrText = req.body.information || "";
  const uniqueId = uuidv4();

  if (!qrText && (type === "text" || type === "url")) {
    return res.send("الرجاء إدخال نص أو رابط.");
  }
  if (type === "url") {
    if (!qrText.startsWith("http://") && !qrText.startsWith("https://")) {
      qrText = "http://" + qrText;
    }
  }

  if (type === "vcard") {
    qrText = `BEGIN:VCARD
VERSION:3.0
FN:${req.body.name}
TEL:${req.body.phone}
EMAIL:${req.body.email}
END:VCARD`;
  } else if (type === "wifi") {
    qrText = `WIFI:T:WPA;
S:${req.body.ssid};
P:${req.body.password};;`;
  }

  const txtFileName = `output_${uniqueId}.txt`;
  fs.writeFileSync(path.join(__dirname, "public", txtFileName), qrText, "utf8");

  const qrFileName = `qr_${uniqueId}.png`;
  const qrFilePath = path.join(__dirname, "public", qrFileName);

  QRCode.toFile(
    qrFilePath,
    qrText,
    {
      color: { dark: "#000000", light: "#ffffff" },
    },
    function (err) {
      if (err) {
        console.error(err);
        return res.send("حدث خطأ أثناء إنشاء QR");
      }

      res.send(`
            <h1>تم إنشاء QR Code</h1>
            <img src="/${qrFileName}" alt="QR Code">
            <br><br>
            <a href="/${qrFileName}" download>تحميل الصورة</a>
            <br><br>
            <a href="/${txtFileName}" download>تحميل النص</a>
            <br><br>
            <a href="/">عودة للفورم</a>
        `);
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
