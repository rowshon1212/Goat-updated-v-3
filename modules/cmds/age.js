/**
 * @GOAT_CONVERTED
 * Author: RS.RIFAT
 */

const fs = require("fs-extra");
const moment = require("moment-timezone");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "age",
    version: "2.1",
    author: "RS.RIFAT",
    countDown: 5,
    role: 0,
    category: "utility",
    shortDescription: "Calculate age from birth date",
    guide: {
      en: "[DD/MM/YYYY]"
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, senderID } = event;

    try {
      if (!args[0]) {
        return api.sendMessage("⚠️ Please provide your birth date in DD/MM/YYYY format\nExample: age 16/12/2006", threadID);
      }

      const input = args[0];
      const dateParts = input.split('/');
      
      if (dateParts.length !== 3) {
        return api.sendMessage("❌ Invalid date format. Please use DD/MM/YYYY", threadID);
      }

      const day = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]);
      const year = parseInt(dateParts[2]);

      if (isNaN(day) || day < 1 || day > 31 || isNaN(month) || month < 1 || month > 12 || isNaN(year)) {
        return api.sendMessage("❌ Invalid date. Please check your input.", threadID);
      }

      const birthDate = moment.tz(`${year}-${month}-${day}`, "YYYY-MM-DD", "Asia/Dhaka");
      const now = moment.tz("Asia/Dhaka");
      
      if (!birthDate.isValid() || birthDate.isAfter(now)) {
        return api.sendMessage("❌ Invalid date or future date!", threadID);
      }

      const duration = moment.duration(now.diff(birthDate));
      const years = duration.years();
      const months = duration.months();
      const totalMonths = Math.floor(duration.asMonths());
      const totalDays = Math.floor(duration.asDays());
      const totalHours = Math.floor(duration.asHours());

      // Cache folder setup to prevent path errors
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      
      const avatarPath = path.join(cacheDir, `${senderID}.jpg`);
      const avatarUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      
      try {
        const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(avatarPath, Buffer.from(response.data, 'utf-8'));
      } catch (e) {
        console.log("Avatar download failed, sending without image.");
      }

      const msgBody = `┏━━━━━━━━━━━━━━━━❂
┃  💖 𝐀𝐆𝐄 𝐂𝐀𝐋𝐂𝐔𝐋𝐀𝐓𝐎𝐑 💖
┣━━━━━━━━━━━━━━━━❂
┃✦ 𝗗𝗔𝗧𝗘 𝗢𝗙 𝗕𝗜𝗥𝗧𝗛: ${day}/${month}/${year}
┃✦ 𝗖𝗨𝗥𝗥𝗘𝗡𝗧 𝗔𝗚𝗘: ${years} 𝐘𝐄𝐀𝐑𝐒 ${months} 𝐌𝐎𝐍𝐓𝐇𝐒
┣━━━━[ 𝗗𝗘𝗧𝗔𝗜𝗟𝗦 ]━━━━❂
┃❖ ${totalMonths} 𝐌𝐎𝐍𝐓𝐇𝐒
┃❖ ${totalDays} 𝐃𝐀𝐘𝐒
┃❖ ${totalHours} 𝐇𝐎𝐔𝐑𝐒
┣━━━━━━━━━━━━━━━━❂
┃   🌜 𝐑𝐒. 𝐂𝐇𝐀𝐓 𝐁𝐎𝐓 🌛
┗━━━━━━━━━━━━━━━━❂`;

      const msg = { body: msgBody };
      if (fs.existsSync(avatarPath)) {
        msg.attachment = fs.createReadStream(avatarPath);
      }

      await api.sendMessage(msg, threadID, () => {
        if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
      });

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ Error: " + error.message, threadID);
    }
  }
};
