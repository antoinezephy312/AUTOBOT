const axios = require('axios');

module.exports.config = {
  name: "gemini",
  role: 0,
  credits: "clarence",
  description: "Interact with Gemini Vision API",
  hasPrefix: false,
  version: "1.0.0",
  aliases: ["clarence", "gwapo"],
  usage: "gemini [prompt]"
};

module.exports.run = async function ({ api, event, args }) {
  const prompt = args.join(" ");

  if (!prompt) {
    return api.sendMessage('⚠️ Please provide a prompt.', event.threadID, event.messageID);
  }

  // Must be replying to a photo
  if (
    event.type !== "message_reply" ||
    !event.messageReply.attachments[0] ||
    event.messageReply.attachments[0].type !== "photo"
  ) {
    return api.sendMessage('⚠️ Please reply to a photo with this command.', event.threadID, event.messageID);
  }

  const imageUrl = encodeURIComponent(event.messageReply.attachments[0].url);
  const uid = event.senderID;
  const apikey = "416866c9-979b-472f-985b-df54ad29bf79";

  api.sendTypingIndicator(event.threadID);

  try {
    const apiUrl = `https://kaiz-apis.gleeze.com/api/gemini-vision?q=${encodeURIComponent(prompt)}&uid=${uid}&imageUrl=${imageUrl}&apikey=${apikey}`;
    const response = await axios.get(apiUrl);

    if (response.data && response.data.response) {
      return api.sendMessage(response.data.response, event.threadID, event.messageID);
    } else {
      console.error("Unexpected API response:", response.data);
      return api.sendMessage(`❌ Unexpected API response.\nRaw: ${JSON.stringify(response.data)}`, event.threadID, event.messageID);
    }
  } catch (error) {
    console.error(error);
    return api.sendMessage('❌ | An error occurred while processing your request.', event.threadID, event.messageID);
  }
};
