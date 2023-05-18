#!/usr/bin/env node

const pkg = require("./package.json");
const { program } = require("commander");
const inquirer = require("inquirer");

const run = require("./run");

async function main() {
  program
    .name("gendbdoc")
    .description("cli to generate database table doc")
    .version(pkg.version);
  program
    .command("start")
    .option("-m, --mode <char>", "use mysql || pg || dm")
    .description("start export database table struct")
    .action(initAction);
  await program.parseAsync(process.argv);
  process.exit();
}
let modeQuestion = {
  pg: {
    port: 5432,
    user: "postgres",
    password: "123456",
    database: "test"
  },
  mysql: {
    port: 3306,
    user: "root",
    password: "root",
    database: "test"
  },
  dm: {
    port: 5236,
    user: "SYSDBA",
    password: "SYSDBA",
    database: "test"
  },
};
const initAction = async (option) => {
  let mode = option.mode || "mysql";
  console.log("mode:", mode);
  let prompts = [
    {
      type: "input",
      name: "host",
      message: "请输入host",
      default: "localhost",
    },
    {
      type: "input",
      name: "port",
      message: "请输入端口",
      default: modeQuestion[mode].port
    },
    {
      type: "input",
      name: "user",
      message: "请输入用户",
      default:modeQuestion[mode].user,
    },
    {
      type: "input",
      name: "password",
      message: "请输入密码",
      default: modeQuestion[mode].password,
    },
    {
      type: "input",
      name: "database",
      message: mode == "dm" ? "模式名" : "请输入数据库",
      default: modeQuestion[mode].database,
    }
  ]
  if(mode == "pg"){
    prompts.push({
      type: "input",
      name: "schema",
      message: "模式名(为空查询所有)",
      default: "",
    })
  }
  let answers = await inquirer.prompt(prompts);
  console.log("database config: ", answers);
  await run(answers, mode);
};

try {
  main();
} catch (error) {
  console.log("error: ", error);
  process.exit();
}
