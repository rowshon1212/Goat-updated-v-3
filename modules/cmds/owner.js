const fs = require("fs-extra");
const path = require("path");
const https = require("https");

module.exports = {
  config: {
    name: "owner",
    version: "1.5.0",
    author: "Mᴏʜᴀᴍᴍᴀᴅ Aᴋᴀsʜ",
    role: 0,
    shortDescription: "Owner info",
    category: "Information",
    guide: {
      en: "owner"
    }
  },

  onStart: async function ({ message }) {

    const ownerText = 
`╭─ 👑 Oᴡɴᴇʀ Iɴғᴏ 👑 ─╮
│ 👤 Nᴀᴍᴇ       : 𝐌𝐃. 𝐑𝐨𝐰𝐬𝐡𝐨𝐧
│ 🧸 Nɪᴄᴋ       : 𝐑𝐢𝐟𝐚𝐭
│ 🎂 Aɢᴇ        : 17+
│ 💘 Rᴇʟᴀᴛɪᴏɴ : Sɪɴɢʟᴇ
│ 🎓 Pʀᴏғᴇssɪᴏɴ : Sᴛᴜᴅᴇɴᴛ
│ 🏡 Lᴏᴄᴀᴛɪᴏɴ : 𝐏𝐚𝐛𝐧𝐚 - 𝐁𝐚𝐧𝐠𝐥𝐚𝐝𝐞𝐬𝐡
├─ 🔗 Cᴏɴᴛᴀᴄᴛ ─╮
│ 📘 Facebook  : fb.com/61557500431580
│ 💬 Messenger: m.me/61557500431580
│ 📞 WhatsApp  : wa.me/0130808****
╰────────────────╯`;

    const imgURL = "https://i.imgur.com/EZxOVuN.jpeg";

    const cacheFolder = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheFolder)) {
      fs.mkdirSync(cacheFolder, { recursive: true });
    }

    const fileName = path.basename(imgURL);
    const filePath = path.join(cacheFolder, fileName);

    if (!fs.existsSync(filePath)) {
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        https.get(imgURL, (res) => {
          if (res.statusCode !== 200) {
            fs.unlink(filePath, () => {});
            return reject();
          }
          res.pipe(file);
          file.on("finish", () => file.close(resolve));
        }).on("error", () => {
          fs.unlink(filePath, () => {});
          reject();
        });
      });
    }

    return message.reply({
      body: ownerText,
      attachment: fs.createReadStream(filePath)
    });
  }
};
