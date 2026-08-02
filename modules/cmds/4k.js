const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "upscale",
    aliases: ["4k"],
    version: "1.3",
    author: "Eren",//api azadx69x
    countDown: 15,
    role: 0,
    shortDescription: { en: "Upscale image to 4K quality" },
    longDescription: { en: "Reply to an image or provide image URL to upscale" },
    category: "image",
    guide: { en: "Reply to image or type !4k <image_url>" }
  },

  onStart: async function ({ api, event, args, message }) {
    try {
      let imageUrl;

      if (event.type === "message_reply" && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
        imageUrl = event.messageReply.attachments[0].url;
      } else if (args[0] && args[0].startsWith("http")) {
        imageUrl = args[0];
      } else {
        return message.reply("❌ Please reply to an image or provide image URL.\nExample: !4k https://example.com/image.jpg");
      }

      const apiUrl = `https://azadx69x-4k-apis.vercel.app/api/4k?imgUrl=${encodeURIComponent(imageUrl)}`;

      const loadingMsg = await message.reply("⏳ Amélioration de l'image en 4K...\nVeuillez patienter...");

      const response = await axios.get(apiUrl);
      
      if (response.data.status !== "success" || !response.data.upscaledImage) {
        throw new Error("Upscale failed");
      }

      const upscaledImageUrl = response.data.upscaledImage;
      
      const imageResponse = await axios({
        method: 'GET',
        url: upscaledImageUrl,
        responseType: 'stream',
        timeout: 30000
      });

      const filePath = path.join(__dirname, `/cache/upscaled_${Date.now()}.jpg`);
      const writer = fs.createWriteStream(filePath);

      imageResponse.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          api.unsendMessage(loadingMsg.messageID);
          message.reply({
            body: `✅ Image successfully upscaled to 4K!`,
            attachment: fs.createReadStream(filePath)
          }, () => {
            fs.unlinkSync(filePath);
            resolve();
          });
        });

        writer.on('error', (err) => {
          api.unsendMessage(loadingMsg.messageID);
          message.reply("❌ Failed to save image.");
          reject(err);
        });
      });

    } catch (error) {
      console.error("Upscale error:", error);
      if (loadingMsg) {
        api.unsendMessage(loadingMsg.messageID);
      }
      message.reply("❌ Upscale failed. Please try again.");
    }
  }
};
