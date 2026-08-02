const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
	config: {
		name: "zuck",
		version: "1.0.1",
		author: "RS.RIFAT", // Requested Credits
		countDown: 10,
		role: 0,
		description: "Comment on the board ( ͡° 15 75)",
		category: "edit-img",
		guide: {
			en: "{p}zuck [text]"
		}
	},

	wrapText: async (ctx, text, maxWidth) => {
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

	onStart: async function ({ api, event, args, message }) {
		const { threadID, messageID } = event;
		const text = args.join(" ");
		if (!text) return message.reply("Enter the content of the comment on the board");

		const pathImg = path.join(__dirname, "cache", `zuck_${Date.now()}.png`);
		
		try {
			// Ensure cache directory exists
			if (!fs.existsSync(path.join(__dirname, "cache"))) {
				fs.mkdirSync(path.join(__dirname, "cache"));
			}

			// Fetch background image
			const response = await axios.get("https://i.postimg.cc/gJCXgKv4/zucc.jpg", { responseType: 'arraybuffer' });
			const baseImage = await loadImage(Buffer.from(response.data, 'utf-8'));
			
			const canvas = createCanvas(baseImage.width, baseImage.height);
			const ctx = canvas.getContext("2d");
			
			ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
			ctx.font = "400 18px Arial";
			ctx.fillStyle = "#000000";
			ctx.textAlign = "start";
			
			let fontSize = 50;
			while (ctx.measureText(text).width > 1200) {
				fontSize--;
				ctx.font = `400 ${fontSize}px Arial`;
			}

			const lines = await this.wrapText(ctx, text, 470);
			ctx.fillText(lines.join('\n'), 15, 75);
			
			const imageBuffer = canvas.toBuffer();
			fs.writeFileSync(pathImg, imageBuffer);

			return message.reply({
				attachment: fs.createReadStream(pathImg)
			}, () => fs.unlinkSync(pathImg));

		} catch (error) {
			console.error(error);
			return message.reply("An error occurred while processing the image.");
		}
	}
};
