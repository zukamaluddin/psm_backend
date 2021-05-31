const env = 'development';
// const env = 'pre_production';
// const env = 'production';
module.exports = {
    token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvYXBpLmJ1a2t1Lm15XC9zZXR0aW5nc1wvYXBpXC9yZWZyZXNoIiwiaWF0IjoxNjEwNzAyNzY1LCJuYmYiOjE2MTA3MDI3NjUsImp0aSI6ImplbjVnR0RRYjBzZlNLYlIiLCJzdWIiOjIwNDYsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.VW7-_jq1v9zTk0WydJag6PZ15tzUhTmF35GqWKHn2A4",
    __token : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvY29vcGVyLWFwaS5idWtrdS5teVwvc2V0dGluZ3NcL2FwaSIsImlhdCI6MTYwNDUzODQxMiwibmJmIjoxNjA0NTM4NDEyLCJqdGkiOiJGQ1FTQ3FVbWkwWUV4Y1drIiwic3ViIjoxMDQsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.MfccNlGSVnyolh0nkkFCptd2oaH4qSPeacnbE5pkc0c",
    urlBukku: 'https://api.bukku.my',
    __urlBukku: 'https://cooper-api.bukku.my',
    urlEdata: 'https://e-data.demetrology.com.my/edata-be',
    type: "master",
    development: {
        username: 'root',
        password: '',
        database: 'edata',
        host: 'localhost',
        dialect: 'mysql',
        logging: false,
        mailHost: 'smtp.gmail.com',
        mailPort: 465,
        mailUsername: 'msbremote111@gmail.com',
        mailPassword: 'P@ssw0rd123123',
        dialectOptions: {
            useUTC: false //for reading from database
        },
        timezone: 'Asia/Kuala_Lumpur'
    },
    pre_production: {
        username: 'root',
        password: '',
        database: 'edata',
        host: '192.168.5.24',
        dialect: 'mysql',
        logging: false,
        mailUsername: 'msbremote111@gmail.com',
        mailPassword: 'P@ssw0rd123123',
        dialectOptions: {
            useUTC: false //for reading from database
        },
        timezone: 'Asia/Kuala_Lumpur'
    },
    production: {
        username: 'edata',
        password: 'msb111',
        database: 'edata',
        host: '10.104.0.3',
        dialect: 'mysql',
        logging: false,
        mailHost: 'mail.demetrology.com.my',
        mailPort: 465,
        mailUsername: 'support@demetrology.com.my',
        mailPassword: 'VP=u2IPxZ)Y$',
        dialectOptions: {
            useUTC: false //for reading from database
        },
        timezone: '+08:00'
    },
    environment: env
};
