let Discord = require('discord.io');
let logger = require('winston');
let auth = require('./auth.json');
let config = require('./config.json');
// Configure logger settings
const {serverUp,serverDown,serverStatus} = require('./server.js');

function isSupportedRegion(region) {
  return config.supported_regions.includes(region);
}


logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
let bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});


bot.on('message', async function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    logger.info(`<${user}> ${message}`);
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'ping':
              message = 'Pong!';
            break;
            case 'uohow':
              message = 'UOW!'
            break;
            case 'help':
              message = "Valid commands are:\n\n!server-start <region>\n!server-stop <region>\n!server-status";
            break;
            case 'server-status':
              message = await serverStatus().catch(e => {logger.error(e.message); return "I've failed executing the action, check my logs!" });
            break;
            case 'server-start':
                let upRegion = args[0];
                if (isSupportedRegion(upRegion)) {
                  message = await serverUp(upRegion).catch(e => {logger.error(e.message); return "I've failed executing the action, check my logs!" });
                } else {
                  message = `I can't spin up servers on ${upRegion}, supported regions are: ` + config.supported_regions.join(', ');
                }
            break;
            case 'server-stop':
                let downRegion = args[0];
                if (isSupportedRegion(downRegion)) {
                  message = await serverDown(downRegion).catch(e => {logger.error(e.message); return "I've failed executing the action, check my logs!" });
                } else {
                  message = `I can't kill servers on ${downRegion}, supported regions are: ` + config.supported_regions.join(', ');
                }
            break;

            default:
              message = 'I don\'t understand that command';
            break;
            // Just add any case commands if you want to..
        }
        bot.sendMessage({
          to: channelID,
          message: message
        });


     }
});