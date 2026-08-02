const axios = require("axios");

module.exports = {
  config: {
    name: "animevideo",
    aliases: ["anivid", "animeedit", "animevdo"],
    version: "1.1",
    author: "Kshitiz / Gemini",
    countDown: 20,
    role: 0,
    shortDescription: "get anime video",
    longDescription: "get random anime video",
    category: "anime",
    guide: "{pn}",
  },

  onStart: async function ({ api, event, message }) {
    const links = [
      "https://drive.google.com/uc?export=download&id=1cyB6E3z4-_Dr4mlYFB87DlWkUlC_KvrR",
      "https://drive.google.com/uc?export=download&id=1Q5L8SGKYpNrXtJ6mffcwMA9bcUtegtga"
      // ... keep your other links here
    ];

    const loadingMessage = await message.reply("Loading random anime video... Please wait! 🕐");

    try {
      const randomVideo = links[Math.floor(Math.random() * links.length)];
      
      // Ensure the stream is fetched before replying
      const videoStream = await global.utils.getStreamFromURL(randomVideo);

      await message.reply({
        body: 'ENJOY..🤍',
        attachment: videoStream,
      });

      // Delete loading message after success
      return api.unsendMessage(loadingMessage.messageID);

    } catch (error) {
      console.error(error);
      api.unsendMessage(loadingMessage.messageID);
      return message.reply("❌ Error: Could not fetch the video. The link might be expired or too large.");
    }
  },
};
