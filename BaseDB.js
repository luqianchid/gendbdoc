const fs = require('fs');


module.exports = class BaseDB {
    constructor(options) {
        this.options = options;
    }
    initFileName() {
        let date = new Date()
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}_${month}_${day}.md`;;
    }
    connect() {
        throw new Error('connect method must be implemented');
    }
    query() {
        throw new Error('query method must be implemented');
    }
    close() {
        throw new Error('close method must be implemented');
    }
    run() {
        throw new Error('run method must be implemented');
    }
    saveFile(filename, data) {
         // save markdown file
         try {
            fs.writeFileSync(filename, data, {
                flag: "a"
            })
            console.log(`------------end----------------`);
        } catch (error) {
            console.log('error: ', error);
        }
    }
}