const env = 'development';

module.exports = {
    development: {
        username: 'root',
        password: 'P@ssw0rd123',
        database: 'bernas',
        host: 'localhost',
        dialect: 'mysql',
        logging: false,
        mailHost: 'smtp.gmail.com',
        mailPort: 465,
        mailUsername: 'msbremote111@gmail.com',
        mailPassword: 'P@ssw0rd123123',
        timezone: "+08:00"
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
        timezone: '+08:00'
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
