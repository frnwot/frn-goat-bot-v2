\
    import { Low } from 'lowdb'
    import { JSONFile } from 'lowdb/node'
    import path from 'path'
    import fs from 'fs'

    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const file = path.join(__dirname, '..', 'data', 'db.json');
    // ensure directory exists
    fs.mkdirSync(path.dirname(file), { recursive: true });

    const adapter = new JSONFile(file);
    const db = new Low(adapter);

    // default structure
    await db.read();
    db.data ||= { warnings: {}, settings: { chat_enabled: true }, users: {} };
    await db.write();

    export default db;
