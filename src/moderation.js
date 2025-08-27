\
    import db from './db.js';

    export async function isAdmin(ctx, BOT_ADMINS) {
      try {
        const uid = String(ctx.from?.id || '');
        if (BOT_ADMINS.includes(uid)) return true;
        const admins = await ctx.getChatAdministrators();
        const ids = new Set(admins.map(a => String(a.user.id)));
        return ids.has(uid);
      } catch (e) {
        console.error('isAdmin error', e);
        return false;
      }
    }

    export async function warnUser(ctx, targetId, reason, limit=3) {
      await db.read();
      const w = db.data.warnings[targetId] || { count: 0, reasons: [] };
      w.count += 1;
      w.reasons.push({ ts: Date.now(), reason });
      db.data.warnings[targetId] = w;
      await db.write();
      const action = w.count >= limit ? 'ban' : 'warn';
      return { count: w.count, action };
    }

    export async function resetWarnings(targetId) {
      await db.read();
      delete db.data.warnings[targetId];
      await db.write();
    }
