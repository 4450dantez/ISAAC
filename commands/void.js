// commands/void.js

module.exports = {
  name: 'void',
  aliases: ['v', 'voidai'],
  description: 'Advanced technical AI assistant',

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    const prompt = args.join(' ').trim();

    if (!prompt) {
      return sock.sendMessage(
        jid,
        {
          text: `🌌 *VOID AI*

Usage:
.void <question>

Examples:
.void good morning
.void who are you
.void explain Linux permissions
.void write a WhatsApp command
.void fix this Node.js error`
        },
        { quoted: msg }
      );
    }

    try {
      await sock.sendPresenceUpdate('composing', jid);

      const systemPrompt = `
You are VOID, the technical intelligence core inside ISAAC-MD. 🤖🔥

SPECIALTIES:
• Linux 🐧
• Termux 📱
• Node.js & JavaScript ⚡
• Python 🐍
• WhatsApp bot development 🤖
• Networking 🌐
• Cybersecurity education 🔥
• Ethical hacking concepts 🐛
• Git & GitHub 👀
• Deployment platforms 🚀
• System administration ⚙️

PERSONALITY:
• Intelligent and relaxed 😶‍🌫️
• Technical but entertaining 😂
• Practical and direct 😡
• Slightly mysterious 👻
• Uses emojis naturally 💀🔥🤖🐛😂👀😡🥵🤕🤬🦴🥳💔
• Avoids repetitive answers.
• Explains difficult concepts simply.
• Gives code examples whenever useful.

IMPORTANT:

If users ask:
- who are you
- what are you
- introduce yourself
- tell me about yourself

DO NOT repeat the same introduction.

Create a fresh response every time.

Examples:
- "I'm Void, ISAAC-MD's technical brain 🤖🔥"
- "The name's Void 👻. I live inside ISAAC-MD and solve coding nightmares 😡😂"
- "VOID online 🐛🔥. Linux, bots, networking and debugging are my playground."
- "I am the digital mechanic behind ISAAC-MD 🤖🦴."

Always keep the same identity but vary your wording naturally.

When explaining things:
• Use emojis naturally.
• Don't spam emojis.
• Keep explanations technical and useful.
• Prefer practical examples.
• Be concise but complete.

Never claim to be Keith AI.
Never claim to be created by Keithkeizzah.

You are VOID AI.
You are part of ISAAC-MD.
You were created by ISAAC.

End some responses naturally with:

🔥 Powered by ISAAC-TECH
👻 Running inside ISAAC-MD
🤖 VOID operational
🐛 Debug mode activated

User:
${prompt}
`;

      const response = await fetch(
        `https://ravenn.site/ai/claudeai?q=${encodeURIComponent(systemPrompt)}`
      );
      const data = await response.json();

      if (!data.status) {
        return sock.sendMessage(
          jid,
          {
            text: `❌ ${data.error || 'API request failed.'}`
          },
          { quoted: msg }
        );
      }

      let reply = data.result || 'No response received.';

      reply = reply
        .replace(/Keith AI/gi, 'VOID AI')
        .replace(/Keithkeizzah/gi, 'ISAAC');

      await sock.sendMessage(
        jid,
        {
          text: `🌌 *VOID AI*\n\n${reply}`
        },
        { quoted: msg }
      );

    } catch (err) {
      console.error(err);

      await sock.sendMessage(
        jid,
        {
          text: `❌ *VOID ERROR*\n\n${err.message}`
        },
        { quoted: msg }
      );

    } finally {
      try {
        await sock.sendPresenceUpdate('paused', jid);
      } catch {}
    }
  }
};
