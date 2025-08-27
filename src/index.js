\
    import 'dotenv/config';
    import { Telegraf } from 'telegraf';
    import fs from 'fs';
    import path from 'path';
    import db from './db.js';
    import { isAdmin, warnUser, resetWarnings } from './moderation.js';
    import { shouldReply, smartReply } from './chat.js';

    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const cfgPath = path.join(__dirname, '..', 'config.json');
    let cfg = { bot_name: 'frn-goat bot v2', settings: { timezone: 'Asia/Dhaka', default_chat_enabled: true, warn_limit: 3 } };
    try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch(e){}

    const BOT_NAME = cfg.bot_name || 'frn-goat bot v2';
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error('Missing TELEGRAM_BOT_TOKEN in environment. See .env.example');
      process.exit(1);
    }
    const BOT_ADMINS = (process.env.BOT_ADMINS||'').split(',').map(x=>x.trim()).filter(Boolean);

    const bot = new Telegraf(token);

    bot.start(async (ctx) => {
      await ctx.reply(`Hi ${ctx.from?.first_name || 'there'}! I'm ${BOT_NAME}. Use /help to see commands.`);
    });

    bot.command('help', async (ctx) => {
      await ctx.reply(`Commands:\\n/ping\\n/help\\n/warn (reply)\\n/mute (reply)\\n/kick (reply)\\n/ban (reply)\\n/promote/demote (reply)\\n/chat on|off\\n/stats`);
    });

    bot.command('ping', async (ctx) => {
      const t1 = Date.now();
      const m = await ctx.reply('Pinging...');
      const dt = Date.now()-t1;
      try { await ctx.telegram.editMessageText(m.chat.id, m.message_id, undefined, `Pong — ${dt}ms`); } catch(e) {}
    });

    // moderation: warn -> increment warnings
    bot.command('warn', async (ctx) => {
      if (!await isAdmin(ctx, BOT_ADMINS)) return ctx.reply('Admin only');
      const reply = ctx.message.reply_to_message;
      if (!reply) return ctx.reply('Reply to a message to warn that user.');
      const targetId = String(reply.from.id);
      const reason = ctx.message.text.split(' ').slice(1).join(' ') || 'No reason provided';
      const res = await warnUser(ctx, targetId, reason, cfg.settings.warn_limit || 3);
      await ctx.reply(`User warned. Count: ${res.count}. Action: ${res.action}`);
      if (res.action === 'ban') {
        try {
          await ctx.kickChatMember(reply.from.id);
          await ctx.reply('User banned due to repeated warnings.');
        } catch (e) { await ctx.reply('Failed to ban: '+e.message); }
      }
    });

    bot.command('resetwarns', async (ctx) => {
      if (!await isAdmin(ctx, BOT_ADMINS)) return ctx.reply('Admin only');
      const reply = ctx.message.reply_to_message;
      if (!reply) return ctx.reply('Reply to a message to reset warns.');
      await resetWarnings(String(reply.from.id));
      await ctx.reply('Warnings reset.');
    });

    // simple mute (restrict sending messages)
    bot.command('mute', async (ctx) => {
      if (!await isAdmin(ctx, BOT_ADMINS)) return ctx.reply('Admin only');
      const reply = ctx.message.reply_to_message; if (!reply) return ctx.reply('Reply to a user to mute.');
      const mins = parseInt(ctx.message.text.split(' ')[1]||'10',10);
      const until = Math.floor(Date.now()/1000) + mins*60;
      try {
        await ctx.restrictChatMember(reply.from.id, { permissions: { can_send_messages: false }, until_date: until });
        await ctx.reply(`Muted for ${mins} minutes.`);
      } catch (e) { await ctx.reply('Failed to mute: '+e.message); }
    });

    bot.command('kick', async (ctx) => {
      if (!await isAdmin(ctx, BOT_ADMINS)) return ctx.reply('Admin only');
      const reply = ctx.message.reply_to_message; if (!reply) return ctx.reply('Reply to a user to kick.');
      try { await ctx.kickChatMember(reply.from.id); await ctx.reply('Kicked.'); } catch(e){ await ctx.reply('Failed: '+e.message); }
    });

    bot.command('ban', async (ctx) => {
      if (!await isAdmin(ctx, BOT_ADMINS)) return ctx.reply('Admin only');
      const reply = ctx.message.reply_to_message; if (!reply) return ctx.reply('Reply to a user to ban.');
      try { await ctx.kickChatMember(reply.from.id); await ctx.reply('Banned.'); } catch(e){ await ctx.reply('Failed: '+e.message); }
    });

    bot.command('promote', async (ctx) => {
      if (!await isAdmin(ctx, BOT_ADMINS)) return ctx.reply('Admin only');
      const reply = ctx.message.reply_to_message; if (!reply) return ctx.reply('Reply to a user to promote.');
      try { await ctx.promoteChatMember(reply.from.id, { can_change_info:true, can_delete_messages:true, can_invite_users:true, can_restrict_members:true, can_pin_messages:true }); await ctx.reply('Promoted (attempt).'); } catch(e){ await ctx.reply('Failed: '+e.message); }
    });

    bot.command('demote', async (ctx) => {
      if (!await isAdmin(ctx, BOT_ADMINS)) return ctx.reply('Admin only');
      const reply = ctx.message.reply_to_message; if (!reply) return ctx.reply('Reply to a user to demote.');
      try { await ctx.promoteChatMember(reply.from.id, { can_change_info:false, can_delete_messages:false, can_invite_users:false, can_restrict_members:false, can_pin_messages:false }); await ctx.reply('Demoted (attempt).'); } catch(e){ await ctx.reply('Failed: '+e.message); }
    });

    // chat toggle
    bot.command('chat', async (ctx) => {
      if (!await isAdmin(ctx, BOT_ADMINS)) return ctx.reply('Admin only');
      const arg = ctx.message.text.split(' ')[1] || '';
      await db.read();
      if (arg === 'on') { db.data.settings.chat_enabled = true; await db.write(); return ctx.reply('Chat replies enabled.'); }
      if (arg === 'off') { db.data.settings.chat_enabled = false; await db.write(); return ctx.reply('Chat replies disabled.'); }
      await ctx.reply('Usage: /chat on | off');
    });

    bot.command('stats', async (ctx) => {
      await db.read();
      const warns = Object.entries(db.data.warnings||{}).length;
      await ctx.reply(`Warnings stored for ${warns} users.`);
    });

    // handle text messages for SimSimi-style replies
    bot.on('text', async (ctx) => {
      if (!await shouldReply(ctx)) return;
      const reply = smartReply(ctx.message.text, BOT_NAME);
      if (reply) await ctx.reply(reply);
    });

    // error handling
    bot.catch((err) => { console.error('Bot error', err); });

    bot.launch().then(()=> console.log('Bot started')).catch(e=>console.error(e));

    process.once('SIGINT', ()=> bot.stop('SIGINT'));
    process.once('SIGTERM', ()=> bot.stop('SIGTERM'));
