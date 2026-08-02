const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const moment = require("moment");

function roundRect(ctx, x, y, width, height, radius) {
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getRandomNeonColor() {
    const neonColors = [
        "#FF3366", "#00CCFF", "#FFDD00", "#00FF88", "#AA66FF",
        "#FF7700", "#00DDFF", "#FF44AA", "#00FFCC", "#FFAA00"
    ];
    return neonColors[Math.floor(Math.random() * neonColors.length)];
}

function formatMoney(num) {
    if (num === 0) return "0";
    if (num < 1000) return num.toString();
    const suffixes = ["", "K", "M", "B", "T"];
    const exp = Math.floor(Math.log(num) / Math.log(1000));
    const value = (num / Math.pow(1000, exp)).toFixed(2);
    return value.replace(/.00$/, '') + suffixes[exp];
}

function expToLevel(exp) {
    const level = Math.floor((1 + Math.sqrt(1 + 8 * exp / 5)) / 2);
    return Math.max(1, level);
}

function expForNextLevel(currentLevel) {
    return ((currentLevel + 1) * (currentLevel + 2) * 5) / 2;
}

function expForCurrentLevel(currentLevel) {
    if (currentLevel <= 1) return 0;
    return (currentLevel * (currentLevel + 1) * 5) / 2;
}

async function loadAvatar(uid) {
    try {
        let imageBuffer;
        const fbUrls = [
            `https://graph.facebook.com/${uid}/picture?width=500&height=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
            `https://graph.facebook.com/${uid}/picture?width=500&height=500`,
            `https://graph.facebook.com/${uid}/picture?type=large`,
            `https://graph.facebook.com/${uid}/picture`
        ];

        for (const url of fbUrls) {
            try {
                const response = await axios.get(url, {
                    responseType: 'arraybuffer',
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'image/*',
                        'Referer': 'https://www.facebook.com/'
                    }
                });
                if (response.status === 200 && response.data) {
                    imageBuffer = Buffer.from(response.data);
                    break;
                }
            } catch (err) { continue; }
        }

        if (imageBuffer) return await loadImage(imageBuffer);
    } catch (err) {
        console.log("Avatar load failed, using default.");
    }

    return createDefaultAvatar("User");
}

function createDefaultAvatar(name) {
    const canvas = createCanvas(500, 500);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 500, 500);
    gradient.addColorStop(0, '#FF3366');
    gradient.addColorStop(1, '#00CCFF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 500, 500);

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(250, 250, 180, 0, Math.PI * 2);
    ctx.fill();

    const initial = name ? name.charAt(0).toUpperCase() : '?';
    ctx.fillStyle = '#FF3366';
    ctx.font = 'bold 200px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial, 250, 250);

    return canvas;
}

module.exports = {
    config: {
        name: "rank",
        aliases: ["info"],
        version: "1.2",
        author: "Farhan | Azadx69x",
        countDown: 5,
        shortDescription: { en: "Show profile with custom info" },
        longDescription: { en: "Display profile card with custom information section" },
        category: "info"
    },

    onStart: async function ({ event, message, usersData, args, api, threadsData }) {
        try {
            let targetUID;
            if (Object.keys(event.mentions).length > 0) targetUID = Object.keys(event.mentions)[0];
            else if (args[0] && /^\d+$/.test(args[0])) targetUID = args[0];
            else if (event.messageReply) targetUID = event.messageReply.senderID;
            else targetUID = event.senderID;

            await message.reply("⏳Generating rank card...");

            const userData = await usersData.get(targetUID);
            const allUsers = await usersData.getAll();

            let messages = 0;
            try {
                const threadData = await threadsData.get(event.threadID);
                const memberData = threadData.members.find(m => m.userID === targetUID);
                messages = memberData?.count || 0;
            } catch { }

            let name = userData.name || "User";
            let username = "Not set";
            try {
                const info = (await api.getUserInfo(targetUID))[targetUID];
                if (info) {
                    if (info.name) name = info.name;
                    username = info.vanity || info.alternateName || info.name;
                }
            } catch { username = name; }

            let genderText = "Unknown", genderEmoji = "❓";
            if (userData.gender !== undefined && userData.gender !== null) {
                const g = String(userData.gender).toLowerCase();
                if (g === "female" || g === "f" || g === "1") { genderText = "Female"; genderEmoji = "👩"; }
                else if (g === "male" || g === "m" || g === "2") { genderText = "Male"; genderEmoji = "👨"; }
            }
            if (genderText === "Unknown") {
                try {
                    const fbInfo = (await api.getUserInfo(targetUID))[targetUID];
                    if (fbInfo?.gender === 1) { genderText = "Female"; genderEmoji = "👩"; }
                    else if (fbInfo?.gender === 2) { genderText = "Male"; genderEmoji = "👨"; }
                } catch { }
            }

            const exp = userData.exp || 0;
            const level = expToLevel(exp);
            const money = userData.money || 0;
            const expRank = allUsers.filter(u => u.exp > 0).sort((a, b) => b.exp - a.exp).findIndex(u => u.userID === targetUID) + 1;
            const moneyRank = allUsers.filter(u => u.money > 0).sort((a, b) => b.money - a.money).findIndex(u => u.userID === targetUID) + 1;
            
            const isVIP = userData.vip === true || userData.isVIP === true || userData.vip === "true" || userData.isVIP === "true";
            const vipText = isVIP ? "Yes 👑" : "No";
            const vipColor = isVIP ? "#FFD700" : "#AAAAAA";

            let avatar;
            try { avatar = await loadAvatar(targetUID); }
            catch (avatarErr) { console.log("Avatar load error, using default:", avatarErr.message); avatar = createDefaultAvatar(name); }

            const canvas = createCanvas(1200, 675);
            const ctx = canvas.getContext("2d");
            const neonColor = getRandomNeonColor();

            ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, 1200, 675);
            ctx.fillStyle = neonColor; ctx.globalAlpha = 0.2;
            for (let i = 0; i < 30; i++) {
                const x = Math.random() * 1200, y = Math.random() * 675, r = Math.random() * 3;
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;

            ctx.fillStyle = "rgba(26,26,26,0.9)";
            roundRect(ctx, 50, 30, 1100, 615, 20); ctx.fill();
            ctx.strokeStyle = neonColor; ctx.lineWidth = 3;
            roundRect(ctx, 50, 30, 1100, 615, 20); ctx.stroke();

            ctx.fillStyle = "rgba(34,34,34,0.8)";
            roundRect(ctx, 80, 60, 350, 555, 15); ctx.fill();

            ctx.save();
            ctx.beginPath();
            ctx.arc(255, 180, 85, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avatar, 170, 95, 170, 170);
            ctx.restore();
            ctx.strokeStyle = neonColor; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(255, 180, 89, 0, Math.PI * 2); ctx.stroke();

            ctx.fillStyle = neonColor; ctx.font = "bold 20px Arial"; ctx.textAlign = "center";
            const displayUsername = username.length > 15 ? username.substring(0, 15) + "..." : username;
            ctx.fillText(`@${displayUsername}`, 255, 295);
            ctx.fillStyle = "#AAAAAA"; ctx.font = "14px Arial"; ctx.fillText(`ID: ${targetUID}`, 255, 320);

            ctx.textAlign = "left"; ctx.fillStyle = neonColor; ctx.font = "bold 26px Arial";
            ctx.fillText("ℹ️ INFORMATION", 100, 360);
            ctx.strokeStyle = neonColor; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
            ctx.beginPath(); ctx.moveTo(100, 375); ctx.lineTo(380, 375); ctx.stroke();
            ctx.globalAlpha = 1;

            ctx.font = "20px Arial";
            let infoY = 410;

            const infos = [
                { label: "Name", value: name, shift: 0 },
                { label: "Gender", value: `${genderText} ${genderEmoji}`, shift: 0 },
                { label: "Messages", value: formatNumber(messages), shift: 30 },
                { label: "Joined", value: moment(userData.createdAt || Date.now()).format("DD/MM/YYYY"), shift: 0 }
            ];

            for (const info of infos) {
                ctx.fillStyle = "#CCCCCC"; ctx.fillText(info.label, 100, infoY);
                ctx.fillStyle = neonColor; ctx.font = "bold 18px Arial";
                ctx.fillText(`: ${info.value}`, 180 + info.shift, infoY);
                ctx.font = "20px Arial"; infoY += 40;
            }

            ctx.fillStyle = "rgba(34,34,34,0.8)";
            roundRect(ctx, 480, 60, 640, 555, 15); ctx.fill();
            ctx.fillStyle = neonColor; ctx.font = "bold 32px Arial"; ctx.fillText("📊 STATISTICS", 510, 110);
            ctx.strokeStyle = neonColor; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
            ctx.beginPath(); ctx.moveTo(510, 125); ctx.lineTo(1080, 125); ctx.stroke(); ctx.globalAlpha = 1;

            const stats = [
                { icon: "💰", label: "Money", value: `$${formatMoney(money)}`, shift: -30 },
                { icon: "📊", label: "EXP Rank", value: expRank ? `#${expRank}` : "N/A", shift: 0 },
                { icon: "📈", label: "Money Rank", value: moneyRank ? `#${moneyRank}` : "N/A", shift: 10 },
                { icon: "🔄", label: "Commands Used", value: formatNumber(userData.allTime || 0), shift: 0 },
                { icon: "⭐", label: "Level", value: level, shift: 0 },
                { icon: "⚡", label: "EXP", value: formatNumber(exp), shift: 0 },
                { icon: "👑", label: "VIP", value: vipText, shift: 0, color: vipColor }
            ];

            let statsY = 160;
            for (let i = 0; i < stats.length; i += 2) {
                ctx.fillStyle = "#333"; ctx.fillRect(520, statsY - 40, 280, 60);
                ctx.fillStyle = neonColor; ctx.font = "bold 24px Arial"; ctx.fillText(stats[i].icon, 540, statsY);
                ctx.fillStyle = "#DDD"; ctx.font = "18px Arial"; ctx.fillText(stats[i].label, 590, statsY);
                ctx.fillStyle = stats[i].color || neonColor; ctx.font = "bold 20px Arial"; 
                ctx.fillText(stats[i].value, 690 + (stats[i].shift || 0), statsY);

                if (stats[i + 1]) {
                    ctx.fillStyle = "#333"; ctx.fillRect(820, statsY - 40, 280, 60);
                    ctx.fillStyle = neonColor; ctx.font = "bold 24px Arial"; ctx.fillText(stats[i + 1].icon, 840, statsY);
                    ctx.fillStyle = "#DDD"; ctx.font = "18px Arial"; ctx.fillText(stats[i + 1].label, 890, statsY);
                    ctx.fillStyle = stats[i + 1].color || neonColor; ctx.font = "bold 20px Arial"; 
                    ctx.fillText(stats[i + 1].value, 1040 + (stats[i + 1].shift || 0), statsY);
                }
                statsY += 75;
            }

            ctx.fillStyle = neonColor; ctx.font = "bold 22px Arial"; ctx.textAlign = "center";
            ctx.fillText("LEVEL PROGRESS", 800, 520);
            
            const currentLevelExp = expForCurrentLevel(level);
            const nextLevelExp = expForNextLevel(level);
            const progress = Math.max(0, exp - currentLevelExp);
            const totalNeeded = nextLevelExp - currentLevelExp;
            const progressPercent = totalNeeded > 0 ? Math.min(100, Math.floor((progress / totalNeeded) * 100)) : 100;
            
            ctx.fillStyle = "#444"; roundRect(ctx, 510, 540, 580, 25, 12); ctx.fill();
            ctx.fillStyle = neonColor; roundRect(ctx, 510, 540, (580 * progressPercent) / 100, 25, 12); ctx.fill();
            ctx.fillStyle = "#FFF"; ctx.font = "bold 16px Arial";
            ctx.fillText(`${progressPercent}% • ${formatNumber(exp)}/${formatNumber(nextLevelExp)} EXP`, 800, 558);
            
            ctx.fillStyle = "#FF0000"; ctx.font = "13px Arial"; ctx.textAlign = "center";
            ctx.fillText(`${moment().format("DD/MM/YYYY HH:mm:ss")} • made By Azadx69x`, 800, 605);

            const tmpPath = path.join(__dirname, "tmp");
            if (!fs.existsSync(tmpPath)) fs.mkdirSync(tmpPath, { recursive: true });
            const imagePath = path.join(tmpPath, `profile_${targetUID}_${Date.now()}.png`);

            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(imagePath, buffer);

            await message.reply({
                body: `📊 PROFILE INFORMATION 📊\n👤 Name: ${name}\n🚻 Gender: ${genderText} ${genderEmoji}\n💬 Messages: ${formatNumber(messages)}\n📅 Joined: ${moment(userData.createdAt || Date.now()).format("DD/MM/YYYY")}\n⭐ Level: ${level} | 💰 $${formatMoney(money)}\n👑 VIP: ${isVIP ? "Yes 👑" : "No"}`,
                attachment: fs.createReadStream(imagePath)
            });

            setTimeout(() => { try { fs.unlinkSync(imagePath); } catch { } }, 10000);

        } catch (err) {
            console.error("Error in rank command:", err);
            await message.reply(`❌ Error: ${err.message}\nPlease try again!`);
        }
    }
};
