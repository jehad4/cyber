const { exec } = require("child_process");

module.exports.config = {

  name: "installpuppeteer",

  version: "1.0.0",

  hasPermssion: 2,

  credits: "Jehad Joy",

  description: "Install puppeteer in your bot",

  commandCategory: "system",

  usages: "installpuppeteer",

  cooldowns: 5

};

module.exports.run = async function ({ api, event }) {

  const { threadID, messageID } = event;

  api.sendMessage("📦 Puppeteer ইনস্টল হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...", threadID, messageID);

  exec("npm install", (error, stdout, stderr) => {

    if (error) {

      console.error(`❌ Error: ${error.message}`);

      return api.sendMessage(`❌ ইনস্টল করতে সমস্যা হয়েছে:\n${error.message}`, threadID);

    }

    if (stderr) {

      console.error(`⚠️ Stderr: ${stderr}`);

      return api.sendMessage(`⚠️ কিছু Warning এসেছে:\n${stderr}`, threadID);

    }

    console.log(`✅ stdout: ${stdout}`);

    return api.sendMessage("✅ Puppeteer সফলভাবে ইনস্টল হয়েছে!", threadID);

  });

};