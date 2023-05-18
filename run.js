const DMDB = require('./DmDB');
const MysqlDB = require('./MysqlDB');
const PGDB = require("./PGDB")

const run = async (options, mode) => {
    let db = null;
    switch (mode) {
        case 'mysql':
            db = new MysqlDB(options);
            break;
        case 'dm':
            db = new DMDB(options);
            break;
        case 'pg':
            db = new PGDB(options);
            break;
        default:
            throw new Error('mode must in [mysql,pg,dm]');
    }
    await db.run();
}

module.exports = run;