module.exports = {
  config: {
    name: "supportgc",
    aliases: ["sgc"],
    version: "0.0.1",
    author: "ArYAN",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Add user to a support group"
    },
    description: {
      en: "Bot will add you to the support group using the configured threadID"
    },
    category: "system",
    guide: {
      en: "{pn} → bot will add you to the support group"
    }
  },

  langs: {
    en: {
      notSet: "⚠️ Group threadID is not set in file.",
      alreadyIn: "⚠️ You are already in the support group.",
      success: "✅ Successfully added!\n📌 Group: %1\n👥 Members: %2",
      failed: "❌ Failed to add you. Please make sure you are friends with the bot first and try again."
    }
  },

  onStart: async function ({ api, event, getLang }) {
    const groupTID = "2058416324784858";

    if (!groupTID) {
      return api.sendMessage(getLang("notSet"), event.threadID, event.messageID);
    }

    try {
      const threadInfo = await api.getThreadInfo(groupTID);

      if (threadInfo.participantIDs.includes(event.senderID)) {
        return api.sendMessage(getLang("alreadyIn"), event.threadID, event.messageID);
      }

      await api.addUserToGroup(event.senderID, groupTID);

      const groupName = threadInfo.threadName || "Unnamed Group";
      const memberCount = threadInfo.participantIDs.length + 1;

      return api.sendMessage(
        getLang("success", groupName, memberCount),
        event.threadID,
        event.messageID
      );

    } catch (err) {
      console.error(err);
      return api.sendMessage(getLang("failed"), event.threadID, event.messageID);
    }
  }
};
