# install
```shell
npm i gendbdoc -g
```
# command
    
    Usage: gendbdoc start [options]

    start export database table struct

    Options:
    -m, --mode <char>  use mysql || dm || pg
    -h, --help         display help for command

# example mysql export data
# users
## 
| 字段名 | 注释 | 类型 | 允许为空 | 默认值 | KEY |
| --- | --- | --- | --- | --- | --- |
| id | - | int unsigned | NO | null | PRI |
| username | - | varchar(50) | YES | null | - |
| password | - | varchar(250) | YES | null | - |
| avatar | - | varchar(250) | YES | null | - |
| email | - | varchar(250) | YES | null | - |
| status | - | tinyint | YES | 1 | - |
| created_at | - | timestamp | YES | null | - |
| updated_at | - | timestamp | YES | null | - |
    
# example dm export data
## ORG
### 
| 字段名 | 注释 | 类型 | 长度 | 允许为空 | 默认值 | KEY | 
| --- | --- | --- | --- | --- |--- |--- |
| id | - | INT | 4 | N | null | PRI |
| name | - | VARCHAR | 50 | Y | null | - |
| parentId | - | INT | 4 | Y | null | - |

# example pg export data
## hello (schema: public)
###
| 字段名 | 注释 | 类型 | 非空 | 默认值 | KEY | 
| --- | --- | --- | --- |--- |--- |
| id | - | int8  | Y | null | Primary Key |
| name | - | varchar  | Y | null | - |