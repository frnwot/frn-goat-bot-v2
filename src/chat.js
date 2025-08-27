\
    import db from './db.js';
    import moment from 'moment-timezone';

    const canned = [
      "Hmm, interesting!",
      "Tell me more 👀",
      "Haha, really?",
      "I get you.",
      "Cool!",
      "Why do you think so?",
      "Let’s talk about something fun 😄",
      "Okay!"
    ];

    function nowStr(tz='Asia/Dhaka') {
      return moment().tz(tz).format('HH:mm DD/MM/YYYY');
    }

    export async function shouldReply(ctx) {
      await db.read();
      const enabled = db.data.settings.chat_enabled;
      if (!enabled) return false;
      // don't reply to commands or bots
      if (!ctx.message || !ctx.message.text) return false;
      if (ctx.message.text.startsWith('/')) return false;
      if (ctx.from?.is_bot) return false;
      return true;
    }

    export function smartReply(text, botName='frn-goat bot v2') {
      const t = (text || '').toLowerCase().trim();
      if (!t) return null;
      if (/(hi|hello|hey)\b/.test(t)) return "Hey! I'm here 🐐";
      if (/\btime\b/.test(t)) return `Time now: ${nowStr()}`;
      if (/\bname\b/.test(t)) return `I'm ${botName}.`;
      if (/\bwho\s+are\s+you\b/.test(t)) return `I'm ${botName}, a friendly mod+chat bot.`;
      if (t.endsWith('?')) return "Good question! What do you think?";
      return canned[Math.floor(Math.random()*canned.length)];
    }
