const BaseDB = require('./BaseDB');
const dmdb = require('dmdb');

class DMDB extends BaseDB {
    constructor(options) {
        super(options);
        this.connection = null;
        this.exportName = `dm_${this.options.database}_${this.initFileName()}`;
    }
    async connect() {
        try {
            const { user, password, host, port } = this.options;
            let pool = await dmdb.createPool({
                connectString: `dm://${user}:${password}@${host}:${port}?autoCommit=false`,
                poolMax: 10,
                poolMin: 1
            })
            this.connection =await pool.getConnection();
        } catch (err) {
            throw new Error("getConnection error: " + err.message);
        }
    }
    async query(sql) {
        let arr = []
        let result = await this.connection.execute(sql, [], {
            resultSet: true
        })
        let resultSet = result.resultSet
        if (!resultSet) {
            return []
        }
        let metaData = resultSet.metaData.map(v => v.name)
        let rows = await resultSet.getRows(100)
        while (rows.length) {
            rows = rows.map(row => {
                return metaData.reduce((acc, key, index) => {
                    acc[key] = row[index];
                    return acc;
                }, {});
            })
            arr.push(...rows)
            rows = await resultSet.getRows(100)
        }
        return arr
    }
    close() {
        this.connection.close(function (err) {
            if (err) console.log(err);
        })
    }
    async run() {
        await this.connect();
        await this.loopFindFormateTable()
        this.close();
    }
    async loopFindFormateTable() {
        let schema = this.options.database;
        console.log(`------------${schema} running----------------`);
        let tables = await this.query(`
        SELECT 
        DISTINCT T1.TABLE_NAME,T2.COMMENTS
        FROM USER_TAB_COLUMNS T1 
        INNER JOIN USER_TAB_COMMENTS T2 ON T1.TABLE_NAME = T2.TABLE_NAME
        INNER JOIN USER_COL_COMMENTS T3 ON T1.TABLE_NAME = T3.TABLE_NAME
        WHERE T3.OWNER = '${schema}'
        `);
        for (let i = 0; i < tables.length; i++) {
            await this.buildTableInfo({
                tableName: tables[i].TABLE_NAME,
                tableComment: tables[i].COMMENTS || '',
            });
        }
    }
    async buildTableInfo({ tableName, tableComment }) {
        console.log(`------------${tableName} running----------------`);
        // get table comment
        let tablesInfo = await this.query(`
            SELECT
            T2.COLUMN_NAME,
            T1.COMMENTS,
            T2.DATA_TYPE ,
            T2.DATA_LENGTH  ,
            T2.NULLABLE ,
            T2.DATA_DEFAULT,
            CASE WHEN CONSTRAINT_TYPE='P' THEN 'PRI' END AS KEY
            FROM USER_COL_COMMENTS T1, USER_TAB_COLUMNS T2,
            (SELECT T4.TABLE_NAME, T4.COLUMN_NAME ,T5.CONSTRAINT_TYPE
            FROM USER_CONS_COLUMNS T4, USER_CONSTRAINTS T5
            WHERE T4.CONSTRAINT_NAME = T5.CONSTRAINT_NAME AND T5.CONSTRAINT_TYPE = 'P')T3
            WHERE T1.TABLE_NAME = T2.TABLE_NAME
            AND T1.COLUMN_NAME=T2.COLUMN_NAME
            AND T1.TABLE_NAME = T3.TABLE_NAME(+)
            AND T1.COLUMN_NAME=T3.COLUMN_NAME(+)
            AND T1.TABLE_NAME = '${tableName}'
            AND T1.OWNER = '${this.options.database}'
            ORDER BY T2.TABLE_NAME,T2.COLUMN_ID
        `);
        // define markdown table header
        let titleHeader = `# ${tableName}\n` + `## ${tableComment}\n`;
        // get table fields info
        let tableMd = `| 字段名 | 注释 | 类型 | 长度 | 允许为空 | 默认值 | KEY | \n| --- | --- | --- | --- | --- |--- |--- |\n`;
        tablesInfo.forEach(item => {
            tableMd += `| ${item.COLUMN_NAME} | ${item.COMMENTS || '-'} | ${item.DATA_TYPE} | ${item.DATA_LENGTH} | ${item.NULLABLE} | ${item.DATA_DEFAULT} | ${item.KEY || '-'} |\n`
        })
        let md = titleHeader + tableMd;
        // save markdown file
        this.saveFile(this.exportName, md);
    }

}

module.exports = DMDB;