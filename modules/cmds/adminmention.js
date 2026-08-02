module.exports = {
  config: {
    name: "adminmention",
    version: "1.3.2",
    author: "MOHAMMAD AKASH",
    countDown: 0,
    role: 0,
    shortDescription: "Replies angrily when someone tags admins",
    longDescription: "If anyone mentions an admin, bot will angrily reply with random messages.",
    category: "system"
  },

  onStart: async function () {},

  onChat: async function ({ event, message }) {
    const adminIDs = ["61557500431580", "61562826721109", "61564643127325"].map(String);

    // Skip if sender is admin
    if (adminIDs.includes(String(event.senderID))) return;

    // যদি কেউ মেনশন দেয়
    const mentionedIDs = event.mentions ? Object.keys(event.mentions).map(String) : [];
    const isMentioningAdmin = adminIDs.some(id => mentionedIDs.includes(id));

    if (!isMentioningAdmin) return;

    // র‍্যান্ডম রাগী রিপ্লাই
    const REPLIES = [
      " বস কে মেনশন দিলে তোর নানির খালি ঘর 😩🐸",
      " তোর কাজ কাম নাই 🤔 শুধু আমার বসকে  সারাদিন মেনসন লাগাস 🐸",
      " বস দেখেন একটা ছাগুল আপনকে ডাকতেছে...!! 🐸🫶🏻",
      " বস কে খুঁজে না পেলে তার ইনবক্সে এ চলে যাও 🤧💔",
      " বস এখন বেস্ত আছে তাই কি বলবি আমাকে বল...!?? 👿🐸"
    ];

    const randomReply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
    return message.reply(randomReply);
  }
};
