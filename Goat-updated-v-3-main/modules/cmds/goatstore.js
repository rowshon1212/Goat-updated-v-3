const axios = require("axios");
const fs = require('fs-extra');
const path = require('path');
const GoatStor = "https://goatstore.vercel.app";

// Helper function to get modules/cmds directory path safely
function getCmdsDir() {
  const mainPath = global.GoatBot?.mainPath || process.cwd();
  const possibleDir = path.join(mainPath, "modules", "cmds");
  
  // Ensure directory exists
  fs.ensureDirSync(possibleDir);
  return possibleDir;
}

// Helper function to dynamically register and load new command into GoatBot memory
function autoLoadCommand(filePath, fileName) {
  try {
    // Clear node require cache to load fresh file
    delete require.cache[require.resolve(filePath)];
    const command = require(filePath);

    if (!command || !command.config || !command.config.name) {
      return { success: false, error: "Invalid command file format or missing config.name" };
    }

    const cmdName = command.config.name.toLowerCase();

    // 1. Try standard GoatBot loadCommand method if available
    if (global.GoatBot && typeof global.GoatBot.loadCommand === 'function') {
      try {
        global.GoatBot.loadCommand({
          api: global.GoatBot.api,
          threadModel: global.GoatBot.threadModel,
          userModel: global.GoatBot.userModel,
          dashBoardModel: global.GoatBot.dashBoardModel,
          globalModel: global.GoatBot.globalModel,
          threadsData: global.GoatBot.threadsData,
          usersData: global.GoatBot.usersData,
          dashBoardData: global.GoatBot.dashBoardData,
          globalData: global.GoatBot.globalData,
          fileName: `${fileName}.js`,
          path: filePath
        });
      } catch (e) {
        console.warn("Standard loadCommand failed, switching to manual map insertion:", e.message);
      }
    }

    // 2. Fallback / Direct insertion into GoatBot Global Memory Collections
    if (global.GoatBot) {
      // Register main command name
      if (global.GoatBot.commands) global.GoatBot.commands.set(cmdName, command);
      if (global.GoatBot.cmds) global.GoatBot.cmds.set(cmdName, command);

      // Register command aliases
      if (command.config.aliases && Array.isArray(command.config.aliases)) {
        for (const alias of command.config.aliases) {
          const cleanAlias = alias.toLowerCase();
          if (global.GoatBot.aliases) global.GoatBot.aliases.set(cleanAlias, cmdName);
        }
      }
    }

    return { success: true, name: cmdName };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = {
  config: {
    name: "goatstore",
    aliases: ["gs", "market", "cmdstore"],
    version: "0.0.6",
    role: 2,
    author: "ArYAN",
    shortDescription: {
      en: "📌 Goatstore - Your Command Marketplace"
    },
    longDescription: {
      en: "📌 Browse, search, upload, install and manage your commands in the GoatStore marketplace with easy sharing cmds."
    },
    category: "𝗠𝗮𝗿𝗸𝗲𝘁",
    cooldowns: 0,
  },

  onStart: async ({ api, event, args, message }) => {
    const sendBeautifulMessage = (content) => {
      const header = "╭──『 🐐GoatStore 』──╮\n";
      const footer = "\n╰──────────────╯";
      return message.reply(header + content + footer);
    };

    try {
      if (!args[0]) {
        return sendBeautifulMessage(
          "\n" +
          `╭─❯ ${event.body} show <ID>\n├ 📦 Get command code info\n╰ Example: show 1\n\n` +
          `╭─❯ ${event.body} install <ID> [fileName]\n├ 📥 Install command directly\n╰ Example: install 1 or install 1 music\n\n` +
          `╭─❯ ${event.body} page <number>\n├ 📄 Browse commands\n╰ Example: page 1\n\n` +
          `╭─❯ ${event.body} search <query>\n├ 🔍 Search commands\n╰ Example: search music\n\n` +
          `╭─❯ ${event.body} trending\n├ 🔥 View trending\n╰ Most popular commands\n\n` +
          `╭─❯ ${event.body} status\n├ 📊 View statistics\n╰ Marketplace insights\n\n` +
          `╭─❯ ${event.body} like <ID>\n├ 💝 Like a command\n╰ Example: like 1\n\n` +
          `╭─❯ ${event.body} upload <name>\n├ ⬆️ Upload command\n╰ Example: upload goatstore\n\n` +
          "💫 𝗧𝗶𝗽: Use `goatstore` menu for options"
        );
      }

      const command = args[0].toLowerCase();
      const commandsDir = getCmdsDir();

      switch (command) {
        case "show": {
          const itemID = parseInt(args[1]);
          if (isNaN(itemID)) return sendBeautifulMessage("\n[⚠️]➜ Please provide a valid item ID.");
          const response = await axios.get(`${GoatStor}/api/item/${itemID}`);
          const item = response.data;
          
          const bangladeshTime = new Date(item.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });

          return sendBeautifulMessage(
            "\n" +
            `╭─❯ 👑 𝗡𝗮𝗺𝗲\n╰ ${item.itemName}\n\n` +
            `╭─❯ 🆔 𝗜𝗗\n╰ ${item.itemID}\n\n` +
            `╭─❯ ⚙️ 𝗧𝘆𝗽𝗲\n╰ ${item.type || 'Unknown'}\n\n` +
            `╭─❯ 📝 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻\n╰ ${item.description}\n\n` +
            `╭─❯ 👨‍💻 𝗔𝘂𝘁𝗵𝗼𝗿\n╰ ${item.authorName}\n\n` +
            `╭─❯ 📅 𝗔𝗱𝗱𝗲𝗱\n╰ ${bangladeshTime}\n\n` +
            `╭─❯ 👀 𝗩𝗶𝗲𝘄𝘀\n╰ ${item.views}\n\n` +
            `╭─❯ 💝 𝗟𝗶𝗸𝗲𝘀\n╰ ${item.likes}\n\n` +
            `╭─❯ 🔗 𝗥𝗮𝘄 𝗟𝗶𝗻𝗸\n╰ ${GoatStor}/raw/${item.rawID}`
          );
        }

        case "install": {
          let itemID;
          let customFileName;

          if (!args[1]) {
            return sendBeautifulMessage("\n[⚠️]➜ Please provide an Item ID.\nExample: `goatstore install 1` or `goatstore install 1 mycmd`");
          }

          if (!isNaN(parseInt(args[1]))) {
            itemID = parseInt(args[1]);
            customFileName = args[2] ? args[2].replace(/\.js$/i, "") : null;
          } else if (args[2] && !isNaN(parseInt(args[2]))) {
            customFileName = args[1].replace(/\.js$/i, "");
            itemID = parseInt(args[2]);
          } else {
            return sendBeautifulMessage("\n[⚠️]➜ Please provide a valid numerical Item ID.");
          }

          try {
            message.reply("⏳ Fetching command code from GoatStore...");

            const response = await axios.get(`${GoatStor}/api/item/${itemID}`);
            const item = response.data;

            if (!item || !item.rawID) {
              return sendBeautifulMessage("\n❌ Command not found on GoatStore.");
            }

            // Fetch raw code
            const rawResponse = await axios.get(`${GoatStor}/raw/${item.rawID}`);
            const code = typeof rawResponse.data === 'object' ? JSON.stringify(rawResponse.data, null, 2) : rawResponse.data;

            if (!code) {
              return sendBeautifulMessage("\n❌ Failed to retrieve code from GoatStore.");
            }

            // Determine file name
            const fileName = (customFileName || item.itemName || `cmd_${itemID}`).toLowerCase().replace(/[^a-z0-9_-]/gi, "");
            const filePath = path.join(commandsDir, `${fileName}.js`);

            // Write file into modules/cmds
            fs.ensureDirSync(commandsDir);
            fs.writeFileSync(filePath, code, 'utf8');

            // Load and activate in memory
            const loadResult = autoLoadCommand(filePath, fileName);
            let loadStatusText = `⚡️ Command '${loadResult.name || fileName}' loaded & activated in memory!`;

            if (!loadResult.success) {
              loadStatusText = `⚠️ Saved to modules/cmds, but auto-load failed: ${loadResult.error}`;
            }

            return sendBeautifulMessage(
              "\n" +
              `╭─❯ ✅ 𝗦𝘁𝗮𝘁𝘂𝘀\n╰ Installed & Activated successfully!\n\n` +
              `╭─❯ 📦 𝗙𝗶𝗹𝗲 𝗡𝗮𝗺𝗲\n╰ ${fileName}.js\n\n` +
              `╭─❯ 🆔 𝗜𝗗\n╰ ${item.itemID}\n\n` +
              `╭─❯ 📁 𝗣𝗮𝘁𝗵\n╰ modules/cmds/${fileName}.js\n\n` +
              `🚀 ${loadStatusText}`
            );
          } catch (err) {
            console.error("Install Error:", err);
            return sendBeautifulMessage(`\n❌ Failed to install command: ${err.message}`);
          }
        }

        case "page": {
          const page = parseInt(args[1]) || 1;
          const { data: { items, total } } = await axios.get(`${GoatStor}/api/items?page=${page}&limit=5`);
          const totalPages = Math.ceil(total / 5);
          if (page <= 0 || page > totalPages) {
            return sendBeautifulMessage("\n[⚠️]➜ Invalid page number.");
          }
          const itemsList = items.map((item, index) =>
            `╭─❯ ${index + 1}. 📦 ${item.itemName}\n` +
            `├ 🆔 𝗜𝗗: ${item.itemID}\n` +
            `├ ⚙️ 𝗧𝘆𝗽𝗲: ${item.type}\n` +
            `├ 📝 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻: ${item.description}\n` +
            `├ 👀 𝗩𝗶𝗲𝘄𝘀: ${item.views}\n` +
            `├ 💝 𝗟𝗶𝗸𝗲𝘀: ${item.likes}\n` +
            `╰ 👨‍💻 𝗔𝘂𝘁𝗵𝗼𝗿: ${item.authorName}\n`
          ).join("\n");
          return sendBeautifulMessage(`\n📄 𝗣𝗮𝗴𝗲 ${page}/${totalPages}\n\n${itemsList}`);
        }

        case "search": {
          const query = args.slice(1).join(" ");
          if (!query) return sendBeautifulMessage("\n[⚠️]➜ Please provide a search query.");
          const { data } = await axios.get(`${GoatStor}/api/items?search=${encodeURIComponent(query)}`);
          const results = data.items || data;
          if (!results || !results.length) return sendBeautifulMessage("\n❌ No matching results found.");
          const searchList = results.slice(0, 5).map((item, index) =>
            `╭─❯ ${index + 1}. 📦 ${item.itemName}\n` +
            `├ 🆔 𝗜𝗗: ${item.itemID}\n` +
            `├ ⚙️ 𝗧𝘆𝗽𝗲: ${item.type || 'GoatBot'}\n` +
            `├ 👀 𝗩𝗶𝗲𝘄𝘀: ${item.views || 0}\n` +
            `├ 💝 𝗟𝗶𝗸𝗲𝘀: ${item.likes || 0}\n` +
            `╰ 👨‍💻 𝗔𝘂𝘁𝗵𝗼𝗿: ${item.authorName || 'Unknown'}\n`
          ).join("\n");
          return sendBeautifulMessage(`\n📝 Query: "${query}"\n\n${searchList}`);
        }

        case "trending": {
          const { data } = await axios.get(`${GoatStor}/api/trending`);
          const trendingList = data.slice(0, 5).map((item, index) =>
            `╭─❯ ${index + 1}. 🔥 ${item.itemName}\n` +
            `├ 🆔 𝗜𝗗: ${item.itemID}\n` +
            `├ 💝 𝗟𝗶𝗸𝗲𝘀: ${item.likes}\n` +
            `╰ 👀 𝗩𝗶𝗲𝘄𝘀: ${item.views}\n`
          ).join("\n");
          return sendBeautifulMessage(`\n${trendingList}`);
        }

        case "status": {
          const { data: stats } = await axios.get(`${GoatStor}/api/stats`);
          const { hosting, totalCommands, totalLikes, dailyActiveUsers, topAuthors, topViewed } = stats;
          const uptimeStr = hosting?.uptime ? `${hosting.uptime.years || 0}y ${hosting.uptime.months || 0}m ${hosting.uptime.days || 0}d ${hosting.uptime.hours || 0}h ${hosting.uptime.minutes || 0}m ${hosting.uptime.seconds || 0}s` : "N/A";
          
          const authorList = (topAuthors || []).map((a, i) =>
            `${i + 1}. ${a._id || 'Unknown'} (${a.count})`
          ).join('\n') || 'None';

          const viewedList = (topViewed || []).map((v, i) =>
            `${i + 1}. ${v.itemName} 𝗜𝗗: ${v.itemID}\n 𝗩𝗶𝗲𝘄𝘀: ${v.views}`
          ).join('\n\n') || 'None';

          return sendBeautifulMessage(
            `\n╭─❯ 📦 Total Commands: ${totalCommands || 0}\n` +
            `├─❯ 💝 Total Likes: ${totalLikes || 0}\n` +
            `├─❯ 👥 Daily Users: ${dailyActiveUsers || 0}\n` +
            `╰─❯ ⏰ Uptime: ${uptimeStr}\n\n` +
            `══『 🌟 Top Authors 』══\n╰${authorList}\n\n` +
            `══『 🔥 Most Viewed 』══\n╰${viewedList}\n` +
            (hosting?.system ? (
              `\n      🌐 𝗛𝗼𝘀𝘁𝗶𝗻𝗴 𝗜𝗻𝗳𝗼\n` +
              `╭─❯ 💻 𝗦𝘆𝘀𝘁𝗲𝗺\n` +
              `├ 🔧 ${hosting.system.platform} (${hosting.system.arch})\n` +
              `├ 📌 Node ${hosting.system.nodeVersion}\n` +
              `╰ 🖥️ CPU Cores: ${hosting.system.cpuCores}`
            ) : "")
          );
        }

        case "like": {
          const likeItemId = parseInt(args[1]);
          if (isNaN(likeItemId)) return sendBeautifulMessage("\n[⚠️]➜ Please provide a valid item ID.");
          const { data } = await axios.post(`${GoatStor}/api/items/${likeItemId}/like`);
          if (data.success) {
            return sendBeautifulMessage(
              `\n╭─❯ ✨ 𝗦𝘁𝗮𝘁𝘂𝘀\n╰ Successfully liked!\n\n╭─❯ 💝 𝗧𝗼𝘁𝗮𝗹 𝗟𝗶𝗸𝗲𝘀\n╰ ${data.likes}`
            );
          } else {
            return sendBeautifulMessage("\n[⚠️]➜ Failed to like the command.");
          }
        }

        case "upload": {
          const commandName = args[1];
          if (!commandName) return sendBeautifulMessage("\n[⚠️]➜ Please provide a command name.\nExample: `goatstore upload testCmd`");
          
          const cleanCmdName = commandName.replace(/\.js$/i, "");
          const commandPath = path.join(commandsDir, `${cleanCmdName}.js`);

          if (!fs.existsSync(commandPath)) return sendBeautifulMessage(`\n❌ File '${cleanCmdName}.js' not found in modules/cmds directory.`);

          try {
            const code = fs.readFileSync(commandPath, 'utf8');
            let commandFile;
            try {
              delete require.cache[require.resolve(commandPath)];
              commandFile = require(commandPath);
            } catch (err) {
              return sendBeautifulMessage(`\n[⚠️]➜ Invalid command file structure: ${err.message}`);
            }

            const uploadData = {
              itemName: commandFile.config?.name || cleanCmdName,
              description: commandFile.config?.longDescription?.en || commandFile.config?.shortDescription?.en || "No description provided",
              type: "GoatBot",
              code: code,
              authorName: commandFile.config?.author || "Unknown"
            };

            let response;
            try {
              response = await axios.post(`${GoatStor}/v1/paste`, uploadData);
            } catch (postErr) {
              response = await axios.post(`${GoatStor}/api/upload`, uploadData);
            }

            if (response.data && (response.data.success || response.data.itemID)) {
              const itemID = response.data.itemID || response.data.id;
              const link = response.data.link || `${GoatStor}/raw/${response.data.rawID || itemID}`;
              
              return sendBeautifulMessage(
                "\n" +
                `╭─❯ ✅ 𝗦𝘁𝗮𝘁𝘂𝘀\n╰ Command uploaded successfully!\n\n` +
                `╭─❯ 👑 𝗡𝗮𝗺𝗲\n╰ ${uploadData.itemName}\n\n` +
                `╭─❯ 🆔 𝗜𝗗\n╰ ${itemID}\n\n` +
                `╭─❯ 👨‍💻 𝗔𝘂𝘁𝗵𝗼𝗿\n╰ ${uploadData.authorName}\n\n`  +
                `╭─❯ 🔗 𝗥𝗮𝘄 𝗟𝗶𝗻𝗸\n╰ ${link}`
              );
            }
            return sendBeautifulMessage("\n[⚠️]➜ Failed to upload the command. Server returned an invalid response.");
          } catch (error) {
            console.error("Upload error:", error?.response?.data || error.message);
            return sendBeautifulMessage(`\n[⚠️]➜ Upload error: ${error?.response?.data?.message || error.message}`);
          }
        }

        default:
          return sendBeautifulMessage("\n[⚠️]➜ Invalid subcommand. Use `goatstore` menu for options");
      }
    } catch (err) {
      console.error("GoatStore Error:", err);
      return sendBeautifulMessage("\n[⚠️]➜ An unexpected error occurred.");
    }
  }
};
