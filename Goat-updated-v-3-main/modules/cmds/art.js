const axios = require('axios');
const fs = require('fs-extra');
const FormData = require('form-data');
const path = __dirname + `/cache/artify_${Date.now()}.jpg`;

module.exports = {
  config: {
    name: "art",
    version: "1.0.0",
    author: "RS.RIFAT",
    countDown: 5,
    role: 0,
    category: "editing",
    guide: {
      en: "{p}art (reply to an image)"
    }
  },

  onStart: async function ({ api, event, message }) {
    const { messageReply } = event;

    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
      return message.reply("❌ অনুগ্রহ করে কোনো একটি ছবির রিপ্লাই দিন।");
    }

    const url = messageReply.attachments[0].url;

    try {
      if (!fs.existsSync(__dirname + '/cache')) fs.mkdirSync(__dirname + '/cache');

      const response = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(path, Buffer.from(response.data, "utf-8"));

      const form = new FormData();
      form.append("image", fs.createReadStream(path));

      const apiRes = await axios.post(
        "https://art-api-97wn.onrender.com/artify?style=anime",
        form,
        { 
          headers: form.getHeaders(), 
          responseType: "arraybuffer" 
        }
      );

      fs.writeFileSync(path, apiRes.data);

      return message.reply({
        body: "✅ AI artify করা হয়েছে!",
        attachment: fs.createReadStream(path)
      }, () => {
        if (fs.existsSync(path)) fs.unlinkSync(path);
      });

    } catch (err) {
      console.error(err);
      if (fs.existsSync(path)) fs.unlinkSync(path);
      return message.reply("❌ কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।");
    }
  }
};
