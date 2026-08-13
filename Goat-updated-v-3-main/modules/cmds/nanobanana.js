const axios = require('axios');
const fs = require('fs-extra'); 
const path = require('path');

// Pollinations AI এর ইমেজ জেনারেশন অ্যান্ডপয়েন্ট
const API_ENDPOINT = "https://image.pollinations.ai/prompt"; 

module.exports = {
  config: {
    name: "nanobanana",
    aliases: ["nb", "nano"],
    version: "1.1", 
    author: "NeoKEX",
    countDown: 15,
    role: 0,
    longDescription: "Generate an image using Pollinations AI with an optional seed.",
    category: "ai-image",
    guide: {
      en: "{pn} <prompt> [--seed <number>]"
    }
  },

  onStart: async function({ message, args, event }) {
    let prompt = args.join(" ");
    let seed = '';

    const seedMatch = prompt.match(/--seed (\d+)/);
    if (seedMatch) {
      seed = seedMatch[1];
      prompt = prompt.replace(/--seed \d+/, "").trim();
    }

    if (!prompt) {
        return message.reply("❌ Please provide a prompt to generate an image.");
    }

    message.reaction("⏳", event.messageID);
    let tempFilePath = null; 

    try {
      // URL তৈরি করা (Pollinations AI এর ফরম্যাট অনুযায়ী)
      let fullApiUrl = `${API_ENDPOINT}/${encodeURIComponent(prompt.trim())}`;
      
      const params = [];
      if (seed) params.push(`seed=${seed}`);
      params.push("nologo=true"); // ছবির কোণায় লোগো বন্ধ রাখার জন্য

      if (params.length > 0) {
        fullApiUrl += `?${params.join("&")}`;
      }
      
      const imageDownloadResponse = await axios.get(fullApiUrl, {
          responseType: 'stream',
          timeout: 60000 
      });

      const cacheDir = path.join(__dirname, 'cache');
      await fs.ensureDir(cacheDir); 
      
      tempFilePath = path.join(cacheDir, `nano_${Date.now()}.png`);
      const writer = fs.createWriteStream(tempFilePath);
      
      imageDownloadResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", (err) => {
          writer.close();
          reject(err);
        });
      });

      message.reaction("✅", event.messageID);
      
      // মেসেজ সেন্ড করা
      await message.reply({
        body: `Image generated successfully ✨` + (seed ? ` (Seed: ${seed})` : ''),
        attachment: fs.createReadStream(tempFilePath)
      });

    } catch (error) {
      message.reaction("❌", event.messageID);
      
      let errorMessage = "An error occurred during image generation.";
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
         errorMessage = `Generation timed out. Try again in a moment.`;
      } else if (error.message) {
         errorMessage = error.message;
      }

      console.error("Image Gen Error:", error);
      message.reply(`❌ ${errorMessage}`);
    } finally {
      // মেসেজ পাঠানো হলে ফাইলটি নিরাপদে ডিলিট করা
      if (tempFilePath && fs.existsSync(tempFilePath)) {
          setTimeout(() => {
            fs.unlink(tempFilePath).catch(() => {});
          }, 5000);
      }
    }
  }
};
