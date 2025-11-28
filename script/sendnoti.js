const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "sendnoti",
    version: "1.2.0",
    role: 2,
    description: "Sends a styled notification message to all groups. Admin only.",
    hasPrefix: true,
    aliases: ["noti"],
    usages: "[Text]",
    cooldown: 0,
};

module.exports.run = async function ({ api, event, args, admin }) {
    const threadList = await api.getThreadList(100, null, ["INBOX"]);
    let sentCount = 0;
    const custom = args.join(" ");
    
    // Define emojis and decorative characters
    const headerEmoji = "📢";
    const footerEmoji = "🔔";
    const borderLine = "━".repeat(40);
    
    // Styled message template
    const styledMessage = `
${headerEmoji} *Notification from Admin* ${headerEmoji}
${borderLine}
${custom}
${borderLine}
${footerEmoji} Thank you for your attention! ${footerEmoji}
`;

    async function sendMessage(thread) {
        try {
            await api.sendMessage(
                styledMessage,
                thread.threadID
            );
            sentCount++;

            const content = `${custom}`;
            const languageToSay = "tl"; 
            const pathFemale = path.resolve(__dirname, "cache", `${thread.threadID}_female.mp3`);

            await downloadFile(
                `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(content)}&tl=${languageToSay}&client=tw-ob&idx=1`,
                pathFemale
            );
            api.sendMessage(
                { attachment: fs.createReadStream(pathFemale) },
                thread.threadID,
                () => fs.unlinkSync(pathFemale)
            );
        } catch (error) {
            console.error("Error sending a message:", error);
        }
    }

    // Send the styled message to each eligible thread
    for (const thread of threadList) {
        if (sentCount >= 20) {
            break;
        }
        if (thread.isGroup && thread.name !== thread.threadID && thread.threadID !== event.threadID) {
            await sendMessage(thread);
        }
    }

    // Confirmation messages
    if (sentCount > 0) {
        api.sendMessage(`✅ Sent the notification successfully to ${sentCount} group(s).`, event.threadID);
    } else {
        api.sendMessage(
            "⚠️ No eligible group threads found to send the message to.",
            event.threadID
        );
    }
};

async function downloadFile(url, filePath) {
    const writer = fs.createWriteStream(filePath);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}
