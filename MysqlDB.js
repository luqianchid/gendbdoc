const BaseDB = require('./BaseDB');
const mysql = require('mysql2');

class MysqlDB extends BaseDB {
    constructor(options) {
        super(options);
        this.connection = null;
        this.exportName = `mysql_${this.options.database}_${this.initFileName()}`;
    }
    connect() {
        this.connection = mysql.createConnection(this.options)
    }
    query(sql) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, (err, res) => {
                if (err) reject(err);
                resolve(res);
            })
        })
    }
    close() {
        this.connection.close();
    }
    async run() {
        try {
            this.connect();
            await this.loopFindFormateTable()
            this.close();
        } catch (error) {
            throw error;
        }

    }
    async loopFindFormateTable() {
        let tables = await this.query('show tables');
        for (let i of tables) {
            await this.buildTableInfo(i[`Tables_in_${this.options.database}`])
        }
    }
    async buildTableInfo(tableName) {
        console.log(`------------${tableName} running----------------`);
        // get table comment
        let tableComment = await this.query(`SELECT TABLE_COMMENT FROM information_schema.TABLES WHERE table_schema = "${this.options.database}" AND table_name = "${tableName}"`);
        // define markdown table header
        let titleHeader = `# ${tableName}\n` + `## ${tableComment[0].TABLE_COMMENT}\n`;
        // get table fields info
        let tableInfo = await this.query(`SELECT * FROM information_schema.columns WHERE table_schema = "${this.options.database}" AND table_name = "${tableName}"`);
        let tableMd = `| 字段名 | 注释 | 类型 | 允许为空 | 默认值 | KEY |\n| --- | --- | --- | --- | --- | --- |\n`;
        tableInfo.forEach(item => {
            tableMd += `| ${item.COLUMN_NAME} | ${item.COLUMN_COMMENT || '-'} | ${item.COLUMN_TYPE} | ${item.IS_NULLABLE} | ${item.COLUMN_DEFAULT} | ${item.COLUMN_KEY || '-'} |\n`
        })
        let md = titleHeader + tableMd;
        this.saveFile(this.exportName, md);
    }

}

module.exports = MysqlDB;