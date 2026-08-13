const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");

// URL and Domain helpers
function getDomain(url) {
  const regex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/im;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function isURL(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function extractUrlFromText(text) {
  let match = text.match(/Raw\s*Link.*?https?:\/\/[^\s╰]+/i);
  if (match) {
    return match[0].match(/https?:\/\/[^\s]+/)[0];
  }
  match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

async function fetchCodeFromUrl(url) {
  const domain = getDomain(url);
  let fixedUrl = url;

  if (domain === "pastebin.com" && !url.includes("/raw/")) {
    fixedUrl = url.replace("pastebin.com/", "pastebin.com/raw/");
  }
  if (domain === "github.com" && url.includes("/blob/")) {
    fixedUrl = url.replace("/blob/", "/").replace("github.com", "raw.githubusercontent.com");
  }

  try {
    const res = await axios.get(fixedUrl);
    let code = res.data;
    if (domain === "savetext.net") {
      const $ = cheerio.load(code);
      code = $("#content").text().trim();
    }
    return typeof code === 'object' ? JSON.stringify(code, null, 2) : code;
  } catch {
    return null;
  }
}

function extractCommandName(code) {
  const nameMatch = code.match(/name\s*:\s*["']([^"']+)["']/);
  return nameMatch ? nameMatch[1].trim() + ".js" : null;
}

module.exports = {
  config: {
    name: "install",
    version: "1.9",
    author: "RS.RIFAT",
    countDown: 3,
    role: 2,
    hasPrefix: false,
    description: "Install command from GoatStore / URL / code",
    category: "owner"
  },

  onStart: async function (args) {
    const { message, event, api } = args;
    let rawCode = "";

    if (event.body.trim().toLowerCase() === "install" && !event.body.startsWith(global.GoatBot.config.prefix || "!")) {
      if (!event.messageReply?.body?.trim()) return message.reply("Reply-এ কোড বা URL দাও");
      const replyBody = event.messageReply.body.trim();
      const url = extractUrlFromText(replyBody);
      rawCode = url ? await fetchCodeFromUrl(url) : replyBody;
    } else {
      if (event.messageReply?.body?.trim()) {
        const replyBody = event.messageReply.body.trim();
        const url = extractUrlFromText(replyBody) || (isURL(replyBody) ? replyBody : null);
        rawCode = url ? await fetchCodeFromUrl(url) : replyBody;
      } else if (args.args[0] && isURL(args.args[0])) {
        rawCode = await fetchCodeFromUrl(args.args[0]);
      } else if (args.args.length > 0) {
        rawCode = event.body.slice(event.body.toLowerCase().indexOf("install") + 7).trim();
      }
    }

    if (!rawCode) return message.reply("কোড বা URL পাওয়া যায়নি!");

    const fileName = extractCommandName(rawCode);
    if (!fileName) return message.reply("কোডটি সঠিক নয় অথবা config.name পাওয়া যায়নি!");

    const dirPath = path.join(process.cwd(), "scripts", "cmds");
    const filePath = path.join(dirPath, fileName);

    fs.ensureDirSync(dirPath);

    if (fs.existsSync(filePath)) {
      return message.reply(`${fileName} already exists. React with any emoji to overwrite.`, (err, info) => {
        global.GoatBot.onReaction.set(info.messageID, {
          commandName: "install",
          messageID: info.messageID,
          author: event.senderID,
          data: { rawCode, fileName }
        });
      });
    }

    return await this.saveAndLoad(filePath, fileName, rawCode, message, api, args);
  },

  onReaction: async function (args) {
    const { Reaction, event, message, api } = args;
    if (event.userID !== Reaction.author) return;

    const { rawCode, fileName } = Reaction.data;
    const filePath = path.join(process.cwd(), "scripts", "cmds", fileName);

    await this.saveAndLoad(filePath, fileName, rawCode, message, api, args);
    global.GoatBot.onReaction.delete(Reaction.messageID);
  },

  saveAndLoad: async function (filePath, fileName, rawCode, message, api, args) {
    try {
      fs.writeFileSync(filePath, rawCode, "utf8");
      
      // Clear cache and load the new command
      delete require.cache[require.resolve(filePath)];
      const command = require(filePath);
      
      if (command && command.config && command.config.name) {
        global.GoatBot.commands.set(command.config.name, command);
        return message.reply(`✅ Successfully installed: ${fileName}\nAuthor: RS.RIFAT`);
      } else {
        return message.reply(`❌ Code saved, but could not be loaded as a command.`);
      }
    } catch (err) {
      return message.reply(`❌ Error: ${err.message}`);
    }
  }
};
