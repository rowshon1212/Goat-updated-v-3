module.exports = {
  config: {
    name: "listbox",
    version: "1.1.0",
    author: "RS RIFAT",
    role: 2,
    countDown: 10,
    shortDescription: {
      en: "List all groups bot is in and join them",
    },
    longDescription: {
      en: "Shows all group names where bot is in. Reply with group number to get added into that group.",
    },
    category: "system",
    guide: {
      en: "{pn} -> Reply with group number to join",
    },
  },

  onReply: async function ({ api, event, Reply }) {
    const { author, groupThreads } = Reply;
    const { senderID, threadID, messageID, body } = event;

    if (senderID !== author) {
      return api.sendMessage("❌ Only the command user can reply!", threadID, messageID);
    }

    const choice = parseInt(body);
    if (isNaN(choice) || choice < 1 || choice > groupThreads.length) {
      return api.sendMessage(
        `❌ Invalid choice! Please enter a number between 1 and ${groupThreads.length}.`,
        threadID,
        messageID
      );
    }

    const selectedGroup = groupThreads[choice - 1];

    try {
      await api.addUserToGroup(senderID, selectedGroup.threadID);
      return api.sendMessage(
        `✅ Successfully added you to "${selectedGroup.name}"!`,
        threadID,
        messageID
      );
    } catch (error) {
      return api.sendMessage(
        `❌ Couldn't add you to "${selectedGroup.name}".\nPossible reasons:\n1. Bot is not admin in that group.\n2. Your Facebook settings prevent being added to groups directly.`,
        threadID,
        messageID
      );
    }
  },

  onStart: async function ({ api, event, commandName }) {
    try {
      const threads = await api.getThreadList(100, null, ["INBOX"]);
      const groupThreads = threads.filter(
        (t) => t.isGroup && t.name && t.threadID
      );

      if (groupThreads.length === 0) {
        return api.sendMessage("❌ No groups found.", event.threadID, event.messageID);
      }

      let msg = `🎯 𝗧𝗼𝘁𝗮𝗹 𝗚𝗿𝗼𝘂𝗽𝘀: ${groupThreads.length}\n━━━━━━━━━━━━━━\n`;

      groupThreads.forEach((group, index) => {
        msg += `📦 𝗚𝗿𝗼𝘂𝗽 ${index + 1}:\n`;
        msg += `📌 𝗡𝗮𝗺𝗲: ${group.name}\n`;
        msg += `🆔 𝗧𝗵𝗿𝗲𝗮𝗱 𝗜𝗗: ${group.threadID}\n`;
        msg += `━━━━━━━━━━━━━━\n`;
      });

      msg += `\n👉 Reply to this message with the group number to join that group! (Example: 1)`;

      return api.sendMessage(msg, event.threadID, (err, info) => {
        if (err) return console.error(err);
        
        if (global.GoatBot) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            author: event.senderID,
            groupThreads
          });
        } else if (global.client && global.client.handleReply) {
          global.client.handleReply.push({
            name: commandName,
            messageID: info.messageID,
            author: event.senderID,
            groupThreads
          });
        }
      }, event.messageID);

    } catch (error) {
      return api.sendMessage(
        `⚠️ Error while fetching group list:\n${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  },
};
