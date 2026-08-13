module.exports = {
  config: {
    name: "tag",
    alises: ["mention"],
    category: 'box chat',
    role: 0,
    author: '乛 Xꫀᥒos ゎ',
    countDown: 2,
    description: { en: 'Advanced tagging with a premium UI interface.' },
    guide: {
      en: `{pn} [name] | [reply] + [text]`
    },
  },

  onStart: async ({ api, event, usersData, threadsData, args }) => {
    const { threadID, messageID, messageReply, senderID } = event;

    try {
      let tags = [];
      let msg = args.join(' ');
      let targetID = messageID;

      
      if (messageReply) {
        targetID = messageReply.messageID;
        const name = await usersData.getName(messageReply.senderID);
        tags.push({ name, id: messageReply.senderID });
      } else if (args.length > 0) {
        const thread = await threadsData.get(threadID);
        const query = args[0].toLowerCase();
        msg = args.slice(1).join(' ');

        tags = thread.members
          .filter(m => m.name.toLowerCase().includes(query))
          .map(m => ({ name: m.name, id: m.userID }));
      }

      if (tags.length === 0) {
        return api.sendMessage("╭═━━━┈┈┈┈┈┈━━━═╮\n       🍓 𝗡𝗼𝘁𝗶𝗳𝗶𝗰𝗮𝘁𝗶𝗼𝗻\n   ━━━━━━━━━━━━━\n   𝖭𝗈 𝗎𝗌𝖾𝗋 𝖿𝗈𝗎𝗇𝖽 𝗍𝗈 𝗍𝖺𝗀\n   𝖯𝗅𝖾𝖺𝗌𝖾 𝗋𝖾𝗉𝗅𝗒 𝗈𝗋 𝗍𝗒𝗉𝖾\n         𝖺 𝗏𝖺𝗅𝗂𝖽 𝗇𝖺𝗆𝖾.\n╰═━━━┈┈┈┈┈┈━━━═╯", threadID, messageID);
      }

      
      const mentions = tags.map(t => ({ tag: t.name, id: t.id }));
      const tagLabel = tags.map(t => `    ${t.name}`).join(', ');

      let uiMessage = `╭═━━━┈┈┈┈┈┈━━━═╮\n`;
      uiMessage += `     ${tagLabel}\n\n`;
      
      if (msg) {
        uiMessage += `💬 𝗠𝘀𝗴: ${msg}\n`;
      }
      
      uiMessage += `  ═━━━┈┈┈┈┈┈━━━═\n`;
      uiMessage += `              𝖠𝖼𝗍𝗂𝗈𝗇 𝖻𝗒:\n            ${await usersData.getName(senderID)}\n╰═━━━┈┈┈┈┈┈━━━═╯`;

      return api.sendMessage({
        body: uiMessage,
        mentions
      }, threadID, targetID);

    } catch (err) {
      return api.sendMessage(`❗ 𝗘𝗿𝗿𝗼𝗿: ${err.message}`, threadID, messageID);
    }
  }
};
