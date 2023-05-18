const BaseDB = require('./BaseDB');
const { Client } = require('pg');

class PgDatabase extends BaseDB {
    constructor(options) {
        super(options)
        const { user, password, host, port, database } = this.options
        this.client = new Client({
            user,
            password,
            host,
            port,
            database,
        });
        this.exportName = `pg_${this.options.database}_${this.initFileName()}`;
    }

    async connect() {
        return await this.client.connect();
    }

    async query(sql) {
        return (await this.client.query(sql)).rows;
    }

    close() {
        return this.client.end();
    }

    async run() {
        try {
            await this.connect()
            await this.loopFindFormateTable()
            this.close()
        } catch (error) {
            this.close()
            throw error;
        }


    }
    async loopFindFormateTable() {
        let sql = `select schemaname,tablename,obj_description(relfilenode,'pg_class')  from pg_tables  a, pg_class b
        where a.tablename = b.relname and a.tablename not like 'pg%' and a.tablename not like 'sql_%'`
        let schema = this.options.schema;
        if (schema) {
            sql += `AND schemaname = '${schema}';`
        }
        let tables = await this.query(sql);
        for (let i = 0; i < tables.length; i++) {
            const { schemaname, tablename, obj_description } = tables[i]
            await this.buildTableInfo({
                schema: schemaname,
                tableName: tablename,
                tableComment: obj_description || '',
            });
        }
    }
    async buildTableInfo({ schema, tableName, tableComment }) {
        console.log(`------------${tableName} running----------------`);
        // get table comment
        let sql = `
        SELECT a.attname AS "COLUMN_NAME",
            t.typname as "DATA_TYPE",
            col_description(a.attrelid, a.attnum) AS "COMMENTS",
            a.attnotnull AS "NOTNULL",
            pg_get_expr(ad.adbin, ad.adrelid) AS "DATA_DEFAULT",
            CASE WHEN con.contype = 'p' THEN 'Primary Key'
                    WHEN con.contype = 'u' THEN 'Unique'
                    WHEN con.contype = 'c' THEN 'Check'
                    WHEN con.contype = 'f' THEN 'Foreign Key'
            END AS "KEY"
        FROM pg_attribute AS a
        JOIN pg_class AS c ON a.attrelid = c.oid
        JOIN pg_type AS t ON a.atttypid = t.oid
        LEFT JOIN pg_attrdef AS ad ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
        LEFT JOIN pg_constraint AS con ON con.conrelid = c.oid AND con.conkey[1] = a.attnum
        LEFT JOIN pg_namespace AS n ON n.oid = c.relnamespace
        WHERE c.relname = '${tableName}'
        AND n.nspname = '${schema}'
        AND a.attnum > 0
        AND NOT a.attisdropped
        ORDER BY a.attnum;
        `
        let tablesInfo = await this.query(sql);
        // define markdown table header
        let titleHeader = `# ${tableName} (schema: ${schema})\n## ${tableComment}\n`;
        // get table fields info
        let tableMd = `| 字段名 | 注释 | 类型 | 非空 | 默认值 | KEY | \n| --- | --- | --- | --- |--- |--- |\n`;
        tablesInfo.forEach(item => {
            tableMd += `| ${item.COLUMN_NAME} | ${item.COMMENTS || '-'} | ${item.DATA_TYPE}  | ${item.NOTNULL ? "Y" : "N"} | ${item.DATA_DEFAULT} | ${item.KEY || '-'} |\n`
        })
        let md = titleHeader + tableMd;
        // save markdown file
        this.saveFile(this.exportName, md);
    }
}


module.exports = PgDatabase;