const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "fbpics",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Jehad Joy",
  description: "Fetch Facebook profile and cover photo via API",
  commandCategory: "utility",
  usages: "fbpics [uid or fb link]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const uid = args[0];
  if (!uid) return api.sendMessage("📌 উদাহরণ:\nfbpics 1000123456789\nfbpics https://facebook.com/zuck", event.threadID);

  const query = encodeURIComponent(uid);

  try {
    // Use third-party API (replace with your own if needed)
    const res = await axios.get(`https://api.riteux.dev/fbinfo?query=${query}`);
    const data = res.data;

    if (!data.profile || !data.cover) return api.sendMessage("❌ প্রোফাইল অথবা কভার ছবি খুঁজে পাওয়া যায়নি।", event.threadID);

    const path1 = __dirname + `/cache/fbpic_${event.senderID}_1.jpg`;
    const path2 = __dirname + `/cache/fbpic_${event.senderID}_2.jpg`;

    const get1 = (await axios.get(data.profile, { responseType: "arraybuffer" })).data;
    const get2 = (await axios.get(data.cover, { responseType: "arraybuffer" })).data;

    fs.writeFileSync(path1, Buffer.from(get1, "utf-8"));
    fs.writeFileSync(path2, Buffer.from(get2, "utf-8"));

    const msg = `📄 Profile: ${data.link || uid}\n👤 Name: ${data.name || "Unknown"}`;

    return api.sendMessage({
      body: msg,
      attachment: [
        fs.createReadStream(path1),
        fs.createReadStream(path2)
      ]
    }, event.threadID, () => {
      fs.unlinkSync(path1);
      fs.unlinkSync(path2);
    });

  } catch (e) {
    console.log("❌ API Error:", e.message);
    return api.sendMessage("❌ ডেটা আনতে ব্যর্থ। প্রোফাইল হয়তো প্রাইভেট বা API লিমিট।", event.threadID);
  }
};