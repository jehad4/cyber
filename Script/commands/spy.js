const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get(
    `https://raw.githubusercontent.com/Mostakim0978/D1PT0/main/baseApiUrl.json`
  );
  return base.data.api;
};

module.exports = {
  config: {
    name: "spy",
    version: "2.0",
    hasPermission: 0,
    usePrefix: true,
    credits: "Dipto + ChatGPT",
    description: "Get user info + guess gender using name API",
    commandCategory: "information",
    cooldowns: 10,
  },

  run: async function ({ event, api, args }) {
    try {
      const senderID = event.senderID;
      const mentionID = Object.keys(event.mentions || {})[0];
      let uid;

      if (args[0]) {
        if (/^\d+$/.test(args[0])) uid = args[0];
        else {
          const match = args[0].match(/profile\.php\?id=(\d+)/);
          if (match) uid = match[1];
        }
      }

      if (!uid) {
        uid =
          event.type === "message_reply"
            ? event.messageReply.senderID
            : mentionID || senderID;
      }

      // Get user info
      const userInfo = await api.getUserInfo(uid);
      const user = userInfo[uid];
      const name = user.name || "Unknown";

      // Improved Gender Detection
      const firstName = name.split(" ")[0] || "";
      const secondName = name.split(" ")[1] || "";
      let genderText = "Unknown 🤷";

      try {
        let res = await axios.get(
          `https://api.genderize.io?name=${encodeURIComponent(firstName)}`
        );
        let g = res.data.gender;
        let prob = parseFloat(res.data.probability) || 0;
        let count = res.data.count || 0;

        if (g && prob > 0.7 && count > 10) {
          genderText = g === "female" ? "Girl 🙋🏻‍♀️" : "Boy 🙋🏻‍♂️";
        } else if (secondName) {
          res = await axios.get(
            `https://api.genderize.io?name=${encodeURIComponent(secondName)}`
          );
          g = res.data.gender;
          prob = parseFloat(res.data.probability) || 0;
          count = res.data.count || 0;

          if (g && prob > 0.7 && count > 10) {
            genderText = g === "female" ? "Girl 🙋🏻‍♀️" : "Boy 🙋🏻‍♂️";
          }
        }
      } catch (e) {
        console.warn("❌ Gender API failed:", e.message);
      }

      // Get user data from global
      const userData = global.data.users?.[uid] || {};
      const allUsers = Object.keys(global.data.users || {}).map((id) => ({
        id,
        ...global.data.users[id],
      }));
      const money = userData.money || 0;
      const exp = userData.exp || 0;

      const rank =
        allUsers.sort((a, b) => (b.exp || 0) - (a.exp || 0)).findIndex((u) => u.id == uid) + 1;

      const moneyRank =
        allUsers.sort((a, b) => (b.money || 0) - (a.money || 0)).findIndex((u) => u.id == uid) + 1;

      // Baby Teach API
      let babyTeach = 0;
      try {
        const response = await axios.get(`${await baseApiUrl()}/baby?list=all`);
        const data = response.data || {};
        babyTeach =
          data?.teacher?.teacherList?.find((t) => t[uid])?.[uid] || 0;
      } catch (e) {}

      const avatarUrl = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatarStream = (await axios.get(avatarUrl, { responseType: "stream" })).data;

      const info = `
☻︎━━━━━━━━━━━━━━☻︎
        𝙐𝙎𝙀𝙍 𝙄𝙉𝙁𝙊
☺︎︎━━━━━━━━━━━━━━㋛︎
👤 Name: ${name.toUpperCase()}
👤 UID: ${uid}
👤 Gender: ${genderText}
👤 Username: ${user.vanity || "None"}
👤 Profile: https://facebook.com/${user.vanity || "profile.php?id=" + uid}
👤 Nickname: ${user.alternateName || "None"}
👤 Birthday: ${user.isBirthday !== false ? user.isBirthday : "Private"}
👤 Bot Connected: ${user.isFriend ? "Yes ✅" : "No ❎"}
☻︎━━━━━━━━━━━━━━☻︎`;

      return api.sendMessage(
        { body: info, attachment: avatarStream },
        event.threadID,
        event.messageID
      );
    } catch (err) {
      console.error("❌ spy.js error:", err);
      return api.sendMessage(
        "❌ Spy command failed.\n" + err.message,
        event.threadID,
        event.messageID
      );
    }
  },
};

function formatMoney(num) {
  const units = ["", "K", "M", "B", "T"];
  let unit = 0;
  while (num >= 1000 && ++unit < units.length) num /= 1000;
  return num.toFixed(1).replace(/\.0$/, "") + units[unit];
}