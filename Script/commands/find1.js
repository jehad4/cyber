const axios = require('axios');

const fs = require('fs');

const https = require('https');

const FormData = require('form-data');

const path = require('path');

module.exports.config = {

  name: "facecheck",

  version: "1.0",

  hasPermission: 0,

  credits: "JehadJoy + FaceCheck",

  description: "Search the internet using a face image",

  commandCategory: "tools",

  usages: "[reply with image or send link]",

  cooldowns: 10

};

const TESTING_MODE = true; // Set to false to deduct credits and get real results

const APITOKEN = 'qRbgP2GaP1nPuagQBlJgJHGMsGAoQClnIPF77+UUQTLCXQiriFdfeaGYIIg2Cq+4jWxg6Xl6vuU=';

const site = 'https://facecheck.id';

const downloadImage = async (url, filename) => {

  const file = fs.createWriteStream(filename);

  return new Promise((resolve, reject) => {

    https.get(url, response => {

      response.pipe(file);

      file.on('finish', () => {

        file.close(() => resolve(filename));

      });

      file.on('error', reject);

    });

  });

};

const search_by_face = async (image_file) => {

  let form = new FormData();

  form.append('images', fs.createReadStream(image_file));

  form.append('id_search', '');

  let response = await axios.post(`${site}/api/upload_pic`, form, {

    headers: {

      ...form.getHeaders(),

      accept: 'application/json',

      Authorization: APITOKEN

    }

  });

  response = response.data;

  if (response.error) return [`${response.error} (${response.code})`, null];

  const id_search = response.id_search;

  const json_data = {

    id_search,

    with_progress: true,

    status_only: false,

    demo: TESTING_MODE,

  };

  while (true) {

    let result = await axios.post(`${site}/api/search`, json_data, {

      headers: {

        accept: 'application/json',

        Authorization: APITOKEN

      }

    });

    result = result.data;

    if (result.error) return [`${result.error} (${result.code})`, null];

    if (result.output) return [null, result.output.items];

    await new Promise(r => setTimeout(r, 1000));

  }

};

module.exports.run = async function ({ api, event, args }) {

  const { messageID, threadID, type, messageReply, senderID } = event;

  let imagePath = path.join(__dirname, `cache/${senderID}_face.jpg`);

  try {

    if (messageReply?.attachments?.[0]?.type === "photo") {

      const imgUrl = messageReply.attachments[0].url;

      await downloadImage(imgUrl, imagePath);

    } else if (args[0]?.startsWith("http")) {

      await downloadImage(args[0], imagePath);

    } else {

      return api.sendMessage("⚠️ দয়া করে কোনও ছবি রিপ্লাই দিন অথবা একটি ছবি লিঙ্ক দিন।", threadID, messageID);

    }

    api.sendMessage("🔍 ছবি আপলোড করা হচ্ছে এবং খোঁজা শুরু হচ্ছে...", threadID);

    const [error, results] = await search_by_face(imagePath);

    fs.unlinkSync(imagePath);

    if (error) return api.sendMessage(`❌ ত্রুটি: ${error}`, threadID, messageID);

    if (!results || results.length === 0) return api.sendMessage("😢 কোনও মিল খুঁজে পাওয়া যায়নি।", threadID, messageID);

    let msg = "🔎 খোঁজার ফলাফল:\n\n";

    for (let i = 0; i < Math.min(5, results.length); i++) {

      const r = results[i];

      msg += `📌 মিলের স্কোর: ${r.score}%\n🌐 লিংক: ${r.url}\n\n`;

    }

    api.sendMessage(msg.trim(), threadID, messageID);

  } catch (err) {

    console.error(err);

    api.sendMessage("❌ একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।", threadID, messageID);

  }

};