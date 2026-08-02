const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { loadImage, createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "yes",
    version: "3.1.1",
    author: "RS.RIFAT",
    countDown: 5,
    role: 0,
    description: {
      en: "Comment on the board"
    },
    category: "Memes",
    guide: {
      en: "{p}yes [text]"
    }
  },

  wrapText: function (ctx, text, maxWidth) {
    return new Promise(resolve => {
      if (ctx.measureText(text).width < maxWidth) return resolve([text]);
      if (ctx.measureText('W').width > maxWidth) return resolve(null);
      const words = text.split(' ');
      const lines = [];
      let line = '';
      while (words.length > 0) {
        let split = false;
        while (ctx.measureText(words[0]).width >= maxWidth) {
          const temp = words[0];
          words[0] = temp.slice(0, -1);
          if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
          else {
            split = true;
            words.splice(1, 0, temp.slice(-1));
          }
        }
        if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) line += `${words.shift()} `;
        else {
          lines.push(line.trim());
          line = '';
        }
        if (words.length === 0) lines.push(line.trim());
      }
      return resolve(lines);
    });
  },

  onStart: async function ({ api, event, args }) {
    let { threadID, messageID } = event;
    
    // Path fix for GoatBot
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    
    const pathImg = path.join(cacheDir, `yes_${threadID}.png`);
    const text = args.join(" ");
    
    if (!text) return api.sendMessage("Enter the content of the comment on the board", threadID, messageID);
    
    try {
      const imageUrl = `https://i.ibb.co/GQbRhkY/Picsart-22-08-14-17-32-11-488.jpg`;
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(pathImg, Buffer.from(response.data, 'binary'));
      
      let baseImage = await loadImage(pathImg);
      let canvas = createCanvas(baseImage.width, baseImage.height);
      let ctx = canvas.getContext("2d");
      
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx.font = "bold 35px Arial";
      ctx.fillStyle = "black";
      ctx.textAlign = "start";
      
      const lines = await this.wrapText(ctx, text, 350);
      ctx.fillText(lines.join('\n'), 280, 50);
      
      const imageBuffer = canvas.toBuffer();
      fs.writeFileSync(pathImg, imageBuffer);
      
      return api.sendMessage({ 
        attachment: fs.createReadStream(pathImg) 
      }, threadID, () => {
        if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
      }, messageID);
      
    } catch (error) {
      console.error(error);
      return api.sendMessage(`Error: Problem loading image or canvas. Make sure the link is alive.`, threadID, messageID);
    }
  }
};
