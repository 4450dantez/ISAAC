const os = require('os');
const config = require('../config/config');

// Helper to convert standard text into Monospace Sans-Serif
function toMonospace(text) {
    const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const mono = "𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿";
    return text.split('').map(char => {
        const index = normal.indexOf(char);
        return index !== -1 ? mono[index] : char;
    }).join('');
}

// Format system uptime string (e.g. 95h 24m)
function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
}

module.exports = {
    name: 'menu',
    description: 'Displays the Cyber Minimalist command menu.',
    async execute(sock, msg, args, commands) {
        const jid = msg.key.remoteJid;

        // 1. Gather live system information and RAM in GB
        const totalRamGb = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(1);
        const freeRamGb = (os.freemem() / (1024 * 1024 * 1024)).toFixed(1);
        const usedRamGb = (parseFloat(totalRamGb) - parseFloat(freeRamGb)).toFixed(1);
        
        const uptimeSeconds = os.uptime();
        const systemDate = new Date();
        
        const currentDate = `${String(systemDate.getDate()).padStart(2, '0')}/${String(systemDate.getMonth() + 1).padStart(2, '0')}/${systemDate.getFullYear()}`;
        const currentTime = systemDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        // 2. Build Option A (Cyber Minimalist Header)
        let menuMessage = `┌──────────────────────────────┐\n`;
        menuMessage += `  🤖 ${toMonospace("ISAAC ASSISTANT")}\n`;
        menuMessage += `  ━━━━━━━━━━━━━━━━━━━━━━━\n`;
        menuMessage += `  👤 Owner  : Pappi Isaac\n`;
        menuMessage += `  ⚡ Prefix : [ ${config.prefix || '.'} ]\n`;
        menuMessage += `  🕒 Time   : ${currentTime}\n`;
        menuMessage += `  🗓️ Date   : ${currentDate}\n`;
        menuMessage += `  📦 Engine : Baileys v5\n`;
        menuMessage += `  💾 Ram    : ${usedRamGb} GB / ${totalRamGb} GB\n`;
        menuMessage += `  ⏱️ Uptime : ${formatUptime(uptimeSeconds)}\n`;
        menuMessage += `└──────────────────────────────┘\n`;

        // 3. Your 13 active bot commands grouped cleanly
        const categories = {
            'ɢʀᴏᴜᴘ': ['demote', 'groupinfo', 'kick', 'mute', 'promote', 'tagall', 'warn'],
            'ᴍɪsᴄ': ['calc', 'help', 'joke', 'menu', 'ping', 'quote']
        };

        // 4. Append structured categories below the header
        for (const [categoryName, commandList] of Object.entries(categories)) {
            menuMessage += ` ╭─❏ ${categoryName.toUpperCase()} ❏\n`;
            commandList.forEach(cmd => {
                menuMessage += ` │ ${toMonospace(cmd.toUpperCase())}\n`;
            });
            menuMessage += ` ╰─────────────────\n`;
        }

        // Send the completed menu layout
        await sock.sendMessage(jid, { text: menuMessage });
    },
};
```eof

We have updated your command file specifically for Option A. This design also converts your RAM usage display from megabytes to gigabytes for that clean, server-dashboard look.

### How to Apply:
1. Open your `commands/menu.js` file on GitHub, delete the old code, paste this in, and commit your changes.
2. Head over to your MacBook terminal.
3. Pull the code down and restart the engine:
   
```bash
   git pull origin main
   npm start
