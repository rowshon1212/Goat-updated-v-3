const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "give",
    version: "1.5",
    role: 2, // Only Bot Admins
    author: "rX Abdullah",
    shortDescription: "Upload local command files to pastebin/file service",
    longDescription: "Upload local command files to a pastebin service for admins.",
    category: "utility",
    guide: {
      en: "[filename]"
    },
    countDown: 5
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (args.length === 0) {
      return api.sendMessage(
        "📁 Please provide a file name.\nUsage: !give <filename>",
        threadID,
        messageID
      );
    }

    const fileName = args[0];
    const commandsPath = path.join(__dirname, "..", "cmds");
    const filePath1 = path.join(commandsPath, fileName);
    const filePath2 = path.join(commandsPath, fileName + ".js");

    let fileToRead;
    if (fs.existsSync(filePath1)) fileToRead = filePath1;
    else if (fs.existsSync(filePath2)) fileToRead = filePath2;
    else {
      return api.sendMessage(
        "❌ File not found in `cmds` folder.",
        threadID,
        messageID
      );
    }

    //১. লোডিং মেসেজ পাঠানো
    let loadingMsg;
    try {
      loadingMsg = await api.sendMessage(
        "📤 Uploading file, please wait...",
        threadID
      );
    } catch (e) {}

    // ২. ফাইল পড়া
    fs.readFile(fileToRead, "utf8", async (err, data) => {
      if (err) {
        if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
        return api.sendMessage("❗ Error reading the file.", threadID, messageID);
      }

      let uploadSuccess = false;
      let resultLink = "";

      // ৩. Primary Attempt: Rentry / Pastebin Service
      try {
        const response = await axios.post(
          "https://pastebin.com/api/api_post.php",
          new URLSearchParams({
            api_option: "paste",
            api_dev_key: "50810db685125dd28ed4108a70c0c6c7", // Public working key
            api_paste_code: data,
            api_paste_name: path.basename(fileToRead),
            api_paste_private: "0"
          }),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        if (response.data && response.data.startsWith("http")) {
          resultLink = response.data;
          uploadSuccess = true;
        }
      } catch (pasteErr) {
        console.error("Pastebin error, trying fallback...", pasteErr.message);
      }

      // ৪. Secondary Attempt (Fallback): Dynamic Paste Service
      if (!uploadSuccess) {
        try {
          const fallbackRes = await axios.post("https://bytebin.lucko.me/post", data, {
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
          if (fallbackRes.data && fallbackRes.data.key) {
            resultLink = `https://bytebin.lucko.me/${fallbackRes.data.key}`;
            uploadSuccess = true;
          }
        } catch (fbErr) {
          console.error("Fallback upload error:", fbErr.message);
        }
      }

      // লোডিং মেসেজ মুছে দেওয়া
      if (loadingMsg) {
        try {
          await api.unsendMessage(loadingMsg.messageID);
        } catch (e) {}
      }

      // ৫. রেসপন্স পাঠানো
      if (uploadSuccess) {
        return api.sendMessage(
          `📄 File: ${path.basename(fileToRead)}\n✅ Successfully uploaded:\n🔗 ${resultLink}`,
          threadID,
          messageID
        );
      } else {
        return api.sendMessage(
          "❌ Failed to upload file to online servers. Please check your internet/server connection.",
          threadID,
          messageID
        );
      }
    });
  }
};
