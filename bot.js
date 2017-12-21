// Config

const botToken = "";
const listToken = "";
const commandPrefix = 'ps:'; 
const admins = {
    113673208296636420: true, //Ale32bit
};

Object.freeze(admins);

var emoji = {
    coin:"<:coin:374566363429077005>",
};

var colors = {
    green: [125, 203, 23],
};

var defaultPermissions = [
    "CREATE_INSTANT_INVITE",
    "ADD_REACTIONS",
    "MANAGE_CHANNELS",
    "VIEW_CHANNEL",
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "USE_EXTERNAL_EMOJIS",
    "MANAGE_MESSAGES",
    "CHANGE_NICKNAME",
    "CONNECT",
    "SPEAK",
    "USE_VAD",
];

var alias = {
    /*mute: "mod mute",
    unmute: "mod unmute",
    clear: "mod clear",*/
    e621: "nsfw e621",
    rule34: "nsfw rule34",
    r34: "nsfw rule34",
    hentai: "nsfw hentai",
    play: "music play",
    mod:"moderation",
    clear:"moderation clear",
    anticaps:"moderation anticaps"
};

// End Config

const log = console.log;
log("Starting up Pixel.JS Alpha");

const Discord = require("discord.js");
const client = new Discord.Client();
const superagent = require('superagent');
const fs = require("fs");
const mathjs = require("mathjs");
const schedule = require('node-schedule');
const http = require('http');
const request = require('superagent');
const ytdl = require("ytdl-core");
const yt = require('youtube-dl');
var stdin = process.openStdin();
//const usage = require("node-usage");

var online = true;
var commands = {};
var queues = {};
var CHANNEL = false;
// Load configs

if(!fs.existsSync("data/guilds.json")){
    fs.writeFileSync("data/guilds.json","{}");
}
if(!fs.existsSync("data/golds.json")){
    fs.writeFileSync("data/golds.json","{}");
}
if(!fs.existsSync("data/bans.json")){
    fs.writeFileSync("data/bans.json","{}");
}

var bans = JSON.parse(fs.readFileSync('data/bans.json', 'utf8'));
var golds = JSON.parse(fs.readFileSync('data/golds.json', 'utf8'));
var guilds = JSON.parse(fs.readFileSync('data/guilds.json', 'utf8'));

function getQueue(server) {
    // Check if global queues are enabled.

    // Return the queue.
    if (!queues[server]) queues[server] = [];
    return queues[server];
}

const randomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

cleanArray = function(arr,deleteValue) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == deleteValue) {
            arr.splice(i, 1);
            i--;
        }
    }
    return arr;
};

const registerCommand = function(name,callb,permission,extendedHelp){
    commands[name] = {
        callback: callb,
        permission: (permission || 0),
        help: extendedHelp,
    };
};

const messageHandler = function(message){
    if (!online){
        return;
    }

    if (message.author.bot){
        return;
    }
    //console.log(`${message.author.id}:${message.author.username}> ${message.content}`); //lol
    var content = message.content;

    if(content.substring(0,client.user.tag.length+1) === client.user.tag+" "){
        content = content.substring(client.user.tag.length + 1);
        content = commandPrefix+content;
    }

    if(content.startsWith(commandPrefix)){
        if(bans[message.author.id]){ // Deny use of bot for banned
            if(message.guild && message.guild.ownerID === message.author.id){ // Leave server is the owner is banned
                message.guild.leave();
            }
            return;
        }
        content = content.substring(commandPrefix.length);
        console.log(`${message.author.id}:${message.author.username}> ${content}`);

        content = content.split(" ");
        if(alias[content[0]]){
            var cm = content[0];
            content = content.join(" ");
            content = alias[cm]+content.substring(cm.length);
            content = content.split(" ");
        }

        var command = content[0];
        var args = [];
        args.push(message);
        for (var i = 1; i < content.length; i++) {
            args.push(content[i]);
        }
        if(message.guild) {
            if(!guilds[message.guild.id]){
                guilds[message.guild.id]={};
            }
            if(!guilds[message.guild.id]["moderation"]){
                guilds[message.guild.id]["moderation"] = {};
            }

            if(!guilds[message.guild.id]["moderation"]["mute"]){
                guilds[message.guild.id]["moderation"]["mute"] = {};
            }

            if(!guilds[message.guild.id]["moderators"]){
                guilds[message.guild.id]["moderators"] = {};
            }

            if(!guilds[message.guild.id]["welcome"]){
                guilds[message.guild.id]["welcome"] = [];
            }
        }

        if(commands[command]) {
            if (commands[command].permission === 2 && !admins[message.author.id]) {
                message.channel.send("You are not a bot admin!");
                return false;
            }
            if(message.guild) {
                if (commands[command].permission === 1 && (!admins[message.author.id] && message.guild.owner.id !== message.author.id)) {
                    message.channel.send("You are not the server owner.");
                    return false;
                }
            }
            try {
                var success = commands[command].callback.apply(this, args);
                if (typeof(success) === "boolean") {
                    if (success) {
                        message.react("✅").then(function(){});
                    } else {
                        message.react("❎").then(function(){});
                    }
                }
            } catch (e) {
                message.react("🆘").then(function(){});
                client.guilds.get("374564282752303104").channels.get("375923083967463426").send("`JS` "+message.content+ " `"+e+"`");
                console.trace(e);
            }
        }
    }else{
        if(message.guild){
            if(guilds[message.guild.id] && guilds[message.guild.id]["anticaps"]){
                if(message.guild.owner.id !== message.author.id && !message.channel.permissionsFor(message.author.id).has("MANAGE_MESSAGES") && !message.guild.members.get(message.author.id).hasPermission("MANAGE_MESSAGES") && !message.guild.members.get(message.author.id).hasPermission("ADMINISTRATOR") && !admins[message.author.id]){
                    if(antiCapsFilter(message.content)){
                        message.delete().then(()=>{
                            message.channel.send("Message deleted: Caps lock filter enabled!").then(m=>{
                                client.setTimeout(function(){
                                    m.delete()
                                },3000);
                            })
                        })
                    }
                }
            }
        }
    }
};

// Help list
var helpList = {
    0: [
        ["Common", {
            help: "`[command]` Show this list.",
            ping: "Get the ping in milliseconds.",
            invite: "Get the invite link of the bot.",
            upvote: "Get the link to the Discord Bot List.",
            info: "Grab some information about this bot.",
            server: "Get the invite link to our official server.",
            credits: "Who created this bot?",
            //suggest: "`<suggestion>` Suggest a feature for the bot.",// "Send a message to the #suggestions channel on the official PixelSlime Discord server.",
        }],
        ["Useful", {
            calc: "`<expression>` Let the bot calculate your math!",
            short: "`<URL>` Convert a long URL to a shorter one!",// "Use the URL shortening service https://shtn.ga created by my developers to help you."],
            whois: "`[User ID]` Fetch information about an user. Leave empty for information about your account.",
            serverinfo: "Fetch information about this server.",
        }],
        ["Fun", {
            music: "`<subcommand>` Manage music. (Unstable)",
            cookie: "`<user>` Gives a :cookie: to a member!",
            cookies: "How many cookies do you have?",
            showerthought: "What do you think when you're showering?",
            xkcd: "`[help]` Fetch a comic from xkcd.",
            nsfw: "`<site> [tags]` We all know what this does ( ͡° ͜ʖ ͡°) (WIP)",
            dice: "Pick a random number between 1 and 6!",
            flipcoin: "Flip a coin " + emoji["coin"],
            shrug: "¯\\_(ツ)_/¯",
        }],
    ],
    1: [ //mods
        ["Moderation", {
            checkperms: "Run this command to check if the bot is able to work 100% on this server",
            moderation: "(WIP) Moderation tools for the server",// "Mute, clear chat and manage moderators."],
        }],
    ],
    2: [ // guild
        ["Server", {
            setstats: "Show server statistics in a channel topic.",
            clearstats: "Clear the statistics.",
            checkperms: "Run this command to check if the bot is able to work 100% on this server",
            moderation: "(WIP) Moderation tools for the server",// "Mute, clear chat and manage moderators."],
        }],
        ["Fun", {
            welcome: "Manage welcome messages.",
        }],
    ],
    3: [ // admin
        ["Commands", {
            eval: "Execute JS scripts",
            lookfor: "Look for ids",
            echo:"echo",
            list:"list of all commands registered",
            //usage: "RAM and Shards",// "why did i put these extended helps on admin commands?"],
            //game: "Set the game text",// "The game under the bot name in the player list."],
        }],
    ],
};

// Done help list

// Register all commands here

/*
    USER COMMANDS (0)
*/

registerCommand("hello",function(message){
    message.channel.send("Hello, "+message.author.username+"!");
},0,"This command gives the user the force to live with a big smile.");

registerCommand("help",function(message,he){
    // 125, 203, 23
    if (he){
        if (commands[he]){
            if (commands[he].help){
                message.channel.send("`"+he+"` "+commands[he].help);
                return true;
            }else{
                message.channel.send("This command did not provide any extended help.");
                return false;
            }
        }else{
            message.channel.send("This command does not exist. Run `ps:help` for commands.");
            return false;
        }

    }

    function sendPerm( perm, title, sendInfo) {
        var embed = new Discord.RichEmbed();
        embed
            .setTitle(title)
        ;
        for (var i=0;i<helpList[perm].length;i++) {
            var field = "";
            for (var j in helpList[perm][i][1]) {
                field += "`"+ j +"` "+helpList[perm][i][1][j]+"\n";
            }
            embed.addField(helpList[perm][i][0], field);
            embed.setColor( [125, 203, 23] );
            embed.setFooter("PixelSlime © 2017 Ale32bit")
        }
        if (sendInfo){
            embed.addField("Information","Visit https://ale32bit.me/pixelslime.php for more information about the commands!")
        }
        return {embed:embed};
    }


    message.channel.send(sendPerm(0,"PixelSlime User Commands\n",true));

    if (admins[message.author.id]){
        message.author.send(sendPerm(3,"PixelSlime Admin Commands\n"));
    }
    if (message.guild){
        if (message.guild.owner.id === message.author.id){
            message.author.send(sendPerm(2,"PixelSlime Server Owner Commands\n",true));
        }
    }
    if (message.guild){
        if (message.guild.owner.id !== message.author.id && message.guild.members.get(message.author.id).hasPermission("MANAGE_MESSAGES")){
            message.author.send(sendPerm(1,"PixelSlime Moderator Commands\n",true));
        }
    }
    return null;
},0,"Helpception");

registerCommand("ping",function(message){
    message.channel.send("Pong: `"+Math.round(client.ping)+"ms`")

},0,"Return the ping in milliseconds.");

registerCommand("cookie",function(message,user){
    if(!message.guild){
        message.channel.send("This is not a server.");
        return false;
    }
    if(!user) {
        message.channel.send("Usage: `ps:cookie <Member>`\nExample: `ps:cookie @User#1234`");
        return null;
    }
    if(message.mentions_everyone) {
        message.channel.send("You can not give cookies to everyone...");
        return false;
    }
    var users = message.mentions.members;
    if (!users){
        message.channel.send("That's not a mention.");
        return false;
    }
    if(!users.array()[0]){
        message.channel.send("That's not a mention.");
        return false;
    }
    var user = users.array()[0]["user"];
    if(!user){
        message.channel.send("That's not a mention.");
        return false;
    }
    if (user.id === message.author.id){
        message.channel.send("You like cheats, don't you?");
        return false;
    }
    if (!client.fetchUser(user.id)){
        message.channel.send("I cannot fetch the user. No mutual servers.");
        return false;
    }
    if(user.id===client.user.id){
        message.channel.send("Thanks, but I have infinite cookies :cookie:!");
        return null;
    }
    if(!golds["points"][user.id]){
        golds["points"][user.id] = 0;
    }
    golds["points"][user.id]++;
    //golds["time"][message.author.id] = os.time()
    fs.writeFileSync("data/golds.json",JSON.stringify(golds));
    message.channel.send(":cookie: "+user.tag+" **received a cookie!** :cookie:");
    return true;
},0,"Who doesn't like cookies?");

registerCommand("cookies",function(message){
    var gol = 0;
    if (!golds["points"][message.author.id]) {
        gol = 0;
    }else {
        gol = golds["points"][message.author.id];
    }
    message.channel.send(message.author.username+", you have "+gol+" :cookie:")
},0,"The more you have the better you are.");

registerCommand("dice",function(message){
    message.channel.send(":game_die: The dice says **"+randomInt(1,6)+"** :game_die:");
},0,"Literally just pick a random number between 1 and 6.");

registerCommand("flipcoin",function(message){
    var c = [
        "Heads",
        "Tails",
    ];
    message.channel.send(emoji["coin"]+" "+c[randomInt(0,1)]+" "+emoji["coin"])
},0,"Heads or tails?");

registerCommand("info",function(message){
    message.channel.send("PixelSlime Bot created by Ale32bit https://ale32bit.me/pixelslime.php\nFramework: `Discord.js`\nUptime: `"+Math.floor(client.uptime/1000)+"` seconds");
},0,"This just shows 3 information, nothing more.");

registerCommand("calc",function(message){
    var scope = {
        life:42,
        nacl:"SASCHA",
        SASCHA:"AAAAAAAAAA",
        AAAAAAAAAA:"AAAAAAAAAA",
        god:"Zoidberg",
    };
    var argse = [];
    for (var i=1; i < arguments.length; i++){
        argse.push(arguments[i]);
    }
    var args = argse.join(" ");
    try {
        var val = mathjs.eval(args,scope);
        message.channel.send("= `" + val + "`");
    } catch (e) {
        message.channel.send("`"+e+"`");
    }
},0,"Put any expression and the bot will try to solve them. Any error: check your expression.");

registerCommand("credits",function(message){
    message.channel.send("PixelSlime Bot created by Ale32bit#5164 Website: https://ale32bit.me\nThanks to NathanAdhitya#6588 and Rph#4820 for testing!");
},0,"Ale32bit did.");

registerCommand("invite",function(message){
    client.generateInvite(defaultPermissions).then(link => {
        message.channel.send("With this link you can add me to your server: "+link+" :grinning:");
    });

},0,"With this link you can invite me to all your servers.");

registerCommand("server",function(message){
    message.channel.send("Here's the invite to our official server: https://discord.gg/vRAThuC");
},0,"With this link you can join our official Discord server.");

registerCommand("shrug",function(message){
    message.channel.send("¯\\_(ツ)_/¯");
    message.delete();
},0,"¯\\_(ツ)_/¯");

registerCommand("upvote",function(message){
    message.channel.send("You can upvote PixelSlime here: https://discordbots.org/bot/365408667522039810");
},0,"With this link you can upvote the bot on Discord Bot List to support the developers.");

registerCommand("short",function(message,url){
    if(!url){
        message.channel.send("Please, provide an URL (or a text(?))");
        return null;
    }
    http.get({
        host: 'shtn.ga',
        path: '/api/index.php?url='+url,
    }, function(response) {
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            message.channel.send(message.author.username+", here's your shortened URL: "+body);
        });
    });
},0,"Use the URL shortening service https://shtn.ga created by my developers to help you.");

registerCommand("nsfw",function(message,cmd){
    if(!message.channel.nsfw && message.channel.type !== "dm" && message.channel.type !== "group"){
        message.channel.send("This is not a NSFW channel!");
        return false;
    }
    if (!cmd || cmd === ""){
        message.channel.send("Subcommands:\n" +
            "`hentai` Fetch a random hentai from r/hentai\n" +
            "`e621 [tags]` Furry site\n" +
            "`rule34 [tags]` Just rule34 (Alias r34)");
        return null;
    }
    var args = [];
    for (var i =2; i < arguments.length; i++){
        args.push(arguments[i]);
    }
    if(cmd === "e621") {
        request.post("https://e621.net/post/index.json?limit=30&tags=" + args.join("%20"))
            .set({'Accept': 'application/json', 'User-Agent': 'Superagent Node.js'})
            // Fetching 30 posts from E621 with the given tags
            .end(function (err, result) {
                if (!err && result.status === 200) {
                    if (result.body.length < 1) {
                        message.channel.send('Sorry, nothing found.') // Correct me if it's wrong.
                    } else {
                        var count = Math.floor((Math.random() * result.body.length));
                        var FurryArray = [];
                        FurryArray.push(result.body[count].file_url);
                        message.channel.send(FurryArray.join('\n'))
                    }
                } else {
                    console.log(`Got an error: ${err}, status code: ${result.status}`)
                }
            })
    }else if(cmd === "rule34" || cmd === "r34") {
        request.post('http://rule34.xxx/index.php?page=dapi&s=post&q=index&tags=' + args.join("%20")) // Fetching 100 rule34 pics
            .end((err, result) => {
                if (err || result.status !== 200) {
                    console.log(`${err}, status code ${result.status}`);
                    message.channel.send('The API returned an invalid response.')
                }
                var xml2js = require('xml2js');
                if (result.text.length < 75) {
                    message.channel.send("Nothing found!") // Correct me if it's wrong.
                } else {
                    xml2js.parseString(result.text, (err, reply) => {
                        if (err) {
                            message.channel.send('The API returned an invaldi response.')
                        } else {
                            var count = Math.floor((Math.random() * reply.posts.post.length));
                            var FurryArray = [];
                            FurryArray.push(`https:${reply.posts.post[count].$.file_url}`);
                            message.channel.send(FurryArray.join('\n'))
                        }
                    })
                }
            })
    }else if(cmd === "hentai"){
        var hentai;
        request.get(`https://www.reddit.com/r/hentai/random/.json`)
            .end((error, response) => {
                if (!error && response.status === 200) {
                    hentai = response.text;
                    hentai = JSON.parse(hentai);
                    hentai = hentai[0].data.children[0].data;
                    var embed = new Discord.RichEmbed();
                    embed
                        .setTitle("Source")
                        .setURL(hentai.url);


                    if(hentai.preview) {
                        var preview = hentai.preview;
                        embed.setImage(preview.images[0].source.url);
                    }else{
                        embed.setDescription(hentai.title);
                    }

                    message.channel.send(embed);
                } else {
                    message.channel.send('Please try again later.');
                    console.log(`Got an error: ${error}, status code: ${response.status}`)
                }
            })
    }else{
        message.channel.send("Subcommand not found")
    }
},0,"NSFW commands");

registerCommand("xkcd",function(message,suffix){
    var xkcdInfo;
    request.get('http://xkcd.com/info.0.json')
        .end((error, response) => {
            if (!error && response.status === 200) {
                xkcdInfo = response.body;
                if (suffix && suffix.toLowerCase() === 'latest') {
                    message.channel.send(`${xkcdInfo.alt}\n\n${xkcdInfo.img}`)
                }else if(suffix === "help"){
                    message.channel.send("xkcd subcommands:\n" +
                        "`latest` Shows the latest comic.\n" +
                        "`[ID]` Shows the comic ")
                } else if (!suffix) {
                    var xkcdRandom = Math.floor(Math.random() * (xkcdInfo.num - 1)) + 1;
                    request.get(`http://xkcd.com/${xkcdRandom}/info.0.json`)
                        .end((error, response) => {
                            if (!error && response.status === 200) {
                                xkcdInfo = response.body;
                                message.channel.send("**xkcd comics**\n\n`"+xkcdInfo.num+"` *"+xkcdInfo.title+"*\n"+xkcdInfo.alt+"\n\n"+xkcdInfo.img)
                            } else {
                                message.channel.send('Please try again later.');
                                console.log(`Got an error: ${error}, status code: ${response.status}`)
                            }
                        })
                } else if (!isNaN(parseInt(suffix, 10)) && parseInt(suffix, 10) > 0 && (parseInt(suffix, 10) <= xkcdInfo.num)) {
                    request(`http://xkcd.com/${suffix}/info.0.json`)
                        .end((error, response) => {
                            if (!error && response.status === 200) {
                                xkcdInfo = response.body;
                                message.channel.send("**xkcd comics**\n\n`"+xkcdInfo.num+"` *"+xkcdInfo.title+"*\n"+xkcdInfo.alt+"\n\n"+xkcdInfo.img)
                            } else {
                                message.channel.send(`${error}, status code: ${response.status}`);
                                console.log(`Got an error: ${error}, status code: ${response.status}`)
                            }
                        })
                } else {
                    message.channel.send(`There are only ${xkcdInfo.num} xkcd comics!`)
                }
            } else {
                message.channel.send('Please try again later.');
                console.log(`Got an error: ${error}, status code: ${response.status}`)
            }
        })
},0,"Send an xkcd comic");

registerCommand("music",function(message,suffix,url){
    if(!message.guild){
        message.channel.send("This is not a server!");
        return false;
    }
    var musicChannel = message.guild.members.get(message.author.id).voiceChannel;
    if(!musicChannel){
        message.channel.send("Please join a voice channel.");
        return undefined;
    }
    if(!suffix || suffix === ""){
        message.channel.send("**PixelSlime Music sub-commands**\n\n"+
            "`play <YouTube URL/Search>` Play a YouTube video or add to queue if already playing a song.\n" +
            "`pause` Pause the current streaming.\n" +
            "`resume` Resume the paused streaming.\n" +
            "`stop` Stop the streaming.\n" +
            "`queue` Shows the queue.");
        return undefined;
    }
    const queue = getQueue(message.guild.id);
    if(suffix === "play"){

        // Check if the queue has reached its maximum size.
        if (queue.length >= 20) {
            return message.channel.send('Maximum queue size reached!');
        }

        // Get the video information.
        message.channel.send('Searching...').then(response => {
            var searchstring = url;
            if (!url.toLowerCase().startsWith('http')) {
                searchstring = 'gvsearch1:' + url;
            }

            yt.getInfo(searchstring, ['-q', '--no-warnings', '--force-ipv4'], (err, info) => {
                // Verify the info.
                console.log(err+"    "+info);
                if (err || info.format_id === undefined || info.format_id.startsWith('0')) {
                    return response.edit('Invalid video!');
                }

                info.requester = message.author.id;

                // Queue the video.
                response.edit('Queued: ' + info.title).then(() => {
                    queue.push(info);
                    // Play if only one element in the queue.
                    if (queue.length === 1) executeQueue(message, queue);
                }).catch(console.log);
            });
        }).catch(console.log);
    }else if(suffix === "pause"){
        // Get the voice connection.
        const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == message.guild.id);
        if (voiceConnection === null) return message.channel.send('No music being played.');

        // Pause.
        message.channel.send('Playback paused.');
        const dispatcher = voiceConnection.player.dispatcher;
        if (!dispatcher.paused) dispatcher.pause();
    }else if(suffix==="resume"){
        // Get the voice connection.
        const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == message.guild.id);
        if (voiceConnection === null) return message.channel.send('No music being played.');

        // Resume.
        message.channel.send('Playback resumed.');
        const dispatcher = voiceConnection.player.dispatcher;
        if (dispatcher.paused) dispatcher.resume();
    }else if(suffix==="queue") {
        // Get the queue.
        const queue = getQueue(message.guild.id);

        // Get the queue text.
        const text = queue.map((video, index) => (
            (index + 1) + ': ' + video.title
        )).join('\n');

        // Get the status of the queue.
        let queueStatus = 'Stopped';
        const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == message.guild.id);
        if (voiceConnection !== null) {
            const dispatcher = voiceConnection.player.dispatcher;
            queueStatus = dispatcher.paused ? 'Playing' : 'Paused';
        }

        // Send the queue and status.
        message.channel.send('Queue (' + queueStatus + '):\n' + text);
    }else if(suffix="skip"){
        // Get the voice connection.
        const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == message.guild.id);
        if (voiceConnection === null) return message.channel.send('No music being played.');

        // Get the queue.
        const queue = getQueue(message.guild.id);

        // Get the number to skip.
        let toSkip = 1; // Default 1.
        if (!isNaN(suffix) && parseInt(suffix) > 0) {
            toSkip = parseInt(suffix);
        }
        toSkip = Math.min(toSkip, queue.length);

        // Skip.
        queue.splice(0, toSkip - 1);

        // Resume and stop playing.
        const dispatcher = voiceConnection.player.dispatcher;
        if (voiceConnection.paused) dispatcher.resume();
        dispatcher.end();

        message.channel.send('Skipped ' + toSkip + '!');
    }else if(suffix === "stop"){
        const queue = getQueue(message.guild.id);

        queue.splice(0, queue.length);
        message.channel.send("Stopped!");
    }
},0,"Music");

registerCommand("alias",function(message){
    var m = "**PixelSlime command aliases**\n\n";
    for(var k in alias){
        m += k+" = "+alias[k]+"\n"
    }
    message.channel.send(m)
},0,"Get the list of all aliases");

registerCommand("serverinfo",function(message,id){
    var gg = message.guild;
    if(id && admins[message.author.id]){
        if(client.guilds.get(id)){
            gg = client.guilds.get(id);
        }else{
            message.channel.send("Couldn't find the guild.");
            return undefined;
        }
    }
    var embed = new Discord.RichEmbed();
    embed
        .setTitle(gg.name)
        .setThumbnail(gg.iconURL)
        .setColor( [125, 203, 23] );

    var chs = gg.channels.array();

    var textc = 0;
    var voicec = 0;

    for(var k in chs){
        if(chs[k].type === "text"){
            textc++;
        }else if(chs[k].type === "voice"){
            voicec++;
        }
    }

    embed.addField("ID",gg.id,true);
    embed.addField("Owner",gg.owner.user.tag,true);
    embed.addField("Members",gg.memberCount,true);
    embed.addField("Channels ("+chs.length+")","Text Channels: "+textc+"\nVoice Channels: "+voicec,true);
    embed.addField("Roles",gg.roles.array().length,true);
    embed.addField("Region",gg.region,true);
    message.channel.send(embed);
},0,"Get information about this server.");

registerCommand("whois",function(message,id){
    if(!id){
        id = message.author.id;
    }
    client.fetchUser(id)
        .then(user => {
            var embed = new Discord.RichEmbed();
            embed
                .setTitle(user.tag)
                .setThumbnail(user.avatarURL)
                .setColor( [125, 203, 23] )
                .setDescription("Information about this user");

            embed.addField("ID", user.id, true);
            embed.addField("Bot", user.bot.toString(), true);
            embed.addField("Created",user.createdAt,true);
            embed.addField("Status",user.presence.status,true);
            embed.addField("Discriminator",user.discriminator,true);
            embed.setURL(user.avatarURL);
            message.channel.send(embed);
        })
        .catch(e => {
            message.channel.send("Error: "+e.message);
            return false;
        });
},0,"Get information about an user.");

registerCommand("showerthought",function(message){
    var thought;
    request.get(`https://reddit.com/r/Showerthoughts/random/.json`)
        .end((error, response) => {
            if (!error && response.status === 200) {
                thought = response.text;
                thought = JSON.parse(thought);
                thought = thought[0].data.children[0].data;
                var embed = new Discord.RichEmbed();
                embed
                    .setTitle("Shower thought")
                    .setURL(thought.url)
                    .setAuthor("By "+thought.author)
                    .setThumbnail("https://b.thumbs.redditmedia.com/q0bGsXH16vdr73XZwl1ScRWAIZwen-OMrnuMeR8zMIE.png");

                if(thought.selftext) {
                    embed.addField(thought.title, thought.selftext)
                }else{
                    embed.setDescription(thought.title);
                }

                message.channel.send(embed);
            } else {
                message.channel.send('Please try again later.');
                console.log(`Got an error: ${error}, status code: ${response.status}`)
            }
        })
},0,"Get a random Shower Thought from r/Showerthoughts.");

/*
    ADMIN COMMANDS (2)
 */

registerCommand("crashtest",function(){
    test();
},2)

registerCommand("eval",function(message){
    const clean = text => {
        if (typeof(text) === "string")
            return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
        else
            return text;
    }
    var argse = [];
    for (var i=1; i < arguments.length; i++){
        argse.push(arguments[i]);
    }
    var args = argse.join(" ");
    try {
        var val = eval(args);
        if (typeof val !== "string")
            val = require("util").inspect(val);

        var a = "```javascript\n"+val+"```";
        if(a.length <= 2000) {
            message.channel.send(a);
        }else{
            message.channel.send(a.substring(0,2000));
            message.channel.send(a.substring(2000));
        }
    }catch (e){
        message.channel.send("**Eval error** `"+e+"`");
    }
},2,"just execute sum js");

registerCommand("list",function(message){
    var m = "";
    for (var k in commands){
        var v = commands[k];
        m+="`"+k+"` *"+v.permission+"* "+v.help+"\n";
    }
    message.channel.send(m)
},2,"dis");

registerCommand("echo",function(message){
    var argse = [];
    for (var i =1; i < arguments.length; i++){
        argse.push(arguments[i]);
    }
    var args = argse.join(" ");
    message.channel.send(args);
    if(message.deletable) {
        message.delete();
    }
},2,"echo");

registerCommand("refreshStats",function(message){
    message.channel.send("Refreshing all guild statistics...");
    for(var k in client.guilds.array()){
        var v = client.guilds.array()[k];
        updateStats(v);
    }
    message.channel.send("Refreshed!")
},2,"Refresh all statistics to all guilds! WARNING: Heavy task!");

registerCommand("lookfor",function(message,id){
    if(!id || id === ""){
        return undefined;
    }
    var a = "";
    var m = client.guilds.array();
    for(var k in m){
        var v = m[k];
        if(v.members.get(id)){
            a+=v.id+" : "+v.name+"\n";
        }
    }
    message.channel.send(a);
},2);

/*
    OWNER COMMANDS (1)
 */

registerCommand("checkperms",function(message) {
    if(!message.guild){
        message.channel.send("This is not a server!");
        return false;
    }

    var me = message.guild.me;

    var embed = new Discord.RichEmbed();

    embed
        .setTitle("PixelSlime Permissions")
        .setColor( [125, 203, 23] );

    for (var i=0; i < defaultPermissions.length; i++){
        var v = defaultPermissions[i];
        if(me.hasPermission(v)) {
            embed.addField(v,"True",true);
        }else{
            embed.addField(v,"False",true);
        }
    }
    message.channel.send(embed)
},1,"Check if all permissions required to the bot are allowed.");

registerCommand("setstats",function(message){
    var guild = message.guild;
    if (!guild) {
        message.channel.send("This is not a server.");
        return false;
    }
    if(!message.guild.me.hasPermission("MANAGE_CHANNELS")){
        message.channel.send("I need `MANAGE_CHANNELS` permission to run this command.");
        return false;
    }
    var argse = [];
    for (var i =1; i < arguments.length; i++){
        argse.push(arguments[i]);
    }
    var msg = argse.join(" ");
    if (!msg || msg === "") {
        message.channel.send("Usage: `ps:setstats <message>`\n\n**Templates:**\n"+
            "`%servername%` Name of the server\n"+
            "`%members%` Quantity of total members\n"+
            "`%totalonline%` Quantity of online, idle and busy members\n"+
            "`%online%` Quantity of online members\n"+
            "`%idle%` Quantity of idle members\n"+
            "`%busy%` Quantity of busy members (Do Not Disturb)\n"+
            "`%bots%` Quantity of bots\n"+
            "`%offline%` Quantity of offline members\n\n"+
            "**Requires `Manage Channels` permission!**\n**Warning** This function spams audit logs!");
        return;
    }
    if(!message.guild.me.hasPermission(0x00000010)){
        message.channel.send("Missing permission: `Manage Channel` for "+message.channel.tag);
        return false;
    }
    if(!guilds[guild.id]) {
        guilds[guild.id] = {}
    }
    guilds[guild.id]["stats"] = msg;
    guilds[guild.id]["statsChannel"] = message.channel.id;
    fs.writeFileSync("data/guilds.json",JSON.stringify(guilds));
    updateStats(message.guild);
    message.channel.send("Statistics successfully set to <#"+message.channel.id+">!");
    return true;
},1,"The server statistics will show how many members, online, offline, bots and more by simply using the templates.");

registerCommand("clearstats",function(message){
    if (!message.guild) {
        message.channel.send("This is not a server.");
        return false;
    }
    if (!message.guild.me.hasPermission(0x00000010)){
        message.channel.send("Missing permission: `Manage Channel` for "+message.channel.tag);
        return false;
    }
    if(!message.guild[message.guild.id]) {
        guilds[message.guild.id] = {};
    }
    guilds[message.guild.id]["stats"] = null;
    guilds[message.guild.id]["statsChannel"] = null;
    fs.writeFileSync("data/guilds.json",JSON.stringify(guilds));
    message.channel.setTopic("").then(function(){});
    message.channel.send("Statistics cleared!");
    return true
},1,"Disable and clear the statistics.");

registerCommand("welcome",function(message,cmd){
    var args = [];
    for (var i =2; i < arguments.length; i++){
        args.push(arguments[i]);
    }
    var guild = message.guild;
    if (!guild) {
        message.channel.send("This is not a server.");
        return false;
    }
    if(!cmd) {
        message.channel.send("**Welcome manager**\n\n"+
            "Show a random welcome message when a player joins.\n\n"+
            "Commands:\n"+
            "`setchannel` Set the current channel to show the welcome messages.\n"+
            "`unsetchannel` Unset the channel and disable the welcome module.\n"+
            "`add <message>` Add a message to the list. Returns message id.\n"+
            "`del <id>` Delete a message from the list.\n"+
            "`list` Show all messages with their id.\n"+
            "`templates` Show a list of all available templates.");
        return null;
    }
    if (!guilds[guild.id]) {
        guilds[guild.id] = {};
    }
    if (cmd === "setchannel") {
        guilds[guild.id]["welcomeChannel"] = message.channel.id;
        if (!guilds[guild.id]["welcome"]){
            guilds[guild.id]["welcome"] = {};
        }
        fs.writeFileSync("data/guilds.json",JSON.stringify(guilds));
        message.channel.send("Welcome message successfully set to <#"+message.channel.id+ ">!");
    }else if(cmd === "unsetchannel") {
        if(guilds[guild.id]["welcomeChannel"]) {
            guilds[guild.id]["welcomeChannel"] = null;
            fs.writeFileSync("data/guilds.json",JSON.stringify(guilds));
            message.channel.send("Welcome module disabled. Note: welcome messages are saved!");
            return true;
        }else {
            message.channel.send("Module already disabled.");
            return false;
        }
    }else if (cmd === "add") {
        if(!guilds[guild.id]["welcome"]) {
            guilds[guild.id]["welcome"] = {};
        }
        var ms = args.join(" ");
        if(!ms || ms === "") {
            message.channel.send("Please provide a message!");
            return false;
        }
        guilds[guild.id]["welcome"].push(ms);
        fs.writeFileSync("data/guilds.json", JSON.stringify(guilds));
        var id = guilds[guild.id]["welcome"].length;
        message.channel.send("Added new welcome message! ID: `"+id+"`");
        return true
    }else if(cmd === "del") {
        var id = args[0];
        if(typeof(id) === "undefined") {
            message.channel.send("Please provide the ID to remove!");
            return false;
        }
        id = Number(id);
        if(typeof(id) !== "number") {
            message.channel.send("The ID must be a number!");
            return false;
        }
        if(!guilds[guild.id]["welcome"] || guilds[guild.id]["welcome"].length < 1) {
            message.channel.send("There are no welcome messages!");
            return false;
        }
        if (guilds[guild.id]["welcome"][id]) {
            guilds[guild.id]["welcome"][id] = null;
            guilds[guild.id]["welcome"] = cleanArray(guilds[guild.id]["welcome"]);
            guilds[guild.id]["welcome"].sort(undefined);
            fs.writeFileSync("data/guilds.json", JSON.stringify(guilds));
            message.channel.send("Message `"+id+ "` deleted! List refreshed!");
            return true;
        }else {
            message.channel.send("ID `"+id+"` not found! Run `ps:welcome list` to get the list!");
            return false
        }
    }else if(cmd === "list") {
        if (!guilds[guild.id]["welcome"] || guilds[guild.id]["welcome"].length < 1) {
            message.channel.send("List is empty");
            return false;
        }
        var ls = "**Welcome messages**\n\n";
        for (var k in guilds[guild.id]["welcome"]) {
            var v = guilds[guild.id]["welcome"][k];
            if(k !== "clean") {
                ls += "`" + k + "` " + v + "\n"
            }
        }
        message.channel.send(ls);
        return true;
    }else if(cmd === "templates"){
        message.channel.send("**Templates:**\n"+
            "`%username%` = Name of the user that joined\n"+
            "`%servername%` = Name of the server\n"+
            "`%members%` Quantity of total members\n"+
            "`%totalonline%` Quantity of online, idle and busy members\n"+
            "`%online%` Quantity of online members\n"+
            "`%idle%` Quantity of idle members\n"+
            "`%busy%` Quantity of busy members (Do Not Disturb)\n"+
            "`%bots%` Quantity of bots\n"+
            "`%offline%` Quantity of offline members");
        return true;
    }
},1,"Add, delete or disable welcome messages for new members.");

registerCommand("moderation",function(message,command,par){

    var hasPerms = false;
    var ind = false;

    if(message.channel.permissionsFor(message.author.id).has("MANAGE_MESSAGES")){
        hasPerms = true;
        ind = true;
    }

    if(message.author.id === message.guild.owner.id){
        hasPerms = true;
        ind = false;
    }
    var pp = message.guild.members.get(message.author.id);
    if(pp.hasPermission("MANAGE_MESSAGES") || message.guild.members.get(message.author.id).hasPermission("ADMINISTRATOR")){
        hasPerms = true;
        ind = false;
    }

    if(admins[message.author.id]){
        hasPerms = true;
        ind = false;
    }

    if(!hasPerms){
        message.channel.send("You do not have enough permissions!");
        return false;
    }

    if(command === "clear"){
        if(!message.guild.me.hasPermission("MANAGE_MESSAGES")){
            message.channel.send("I need the `MANAGE_MESSAGES` to perform this action!");
            return false;
        }
        if(!par){
            var par = 20;
        }
        if(par > 100){
            message.channel.send("The amount cannot be greater than 100!");
            return false;
        }
        if(par < 2){
            message.delete().then(function(){
                message.channel.send("Deleted a message.").then(m =>{
                    client.setTimeout(function(){m.delete()},2000);
                })
            });
            return undefined;
        }
        try {
            message.channel.bulkDelete(par);
            message.channel.send("Deleted "+par+" messages!").then(function(m){
                client.setTimeout(function(){m.delete()},2000);
            })
        } catch (e) {
            message.channel.send(e);
        }
    }else if(command ==="anticaps"){
        if(ind){
            message.channel.send("This is a global moderation tool.");
            return false;
        }
        if(!guilds[message.guild.id]){
            guilds[message.guild.id] = {};
        }

        if(!guilds[message.guild.id]["anticaps"]){
            guilds[message.guild.id]["anticaps"] = false;
        }

        guilds[message.guild.id]["anticaps"] = !guilds[message.guild.id]["anticaps"];
        fs.writeFileSync("data/guilds.json",JSON.stringify(guilds));
        if(guilds[message.guild.id]["anticaps"]){
            message.channel.send("Enabled anti-caps filter!");
            return true;
        }else{
            message.channel.send("Disabled anti-caps filter!");
            return true;
        }
    }else if(command === "mute"){
        if(ind){
            message.channel.send("This is a global moderation tool.");
            return false;
        }

    }else if(command === "unmute"){
        if(ind){
            message.channel.send("This is a global moderation tool.");
            return false;
        }
    }else{
        var embed = new Discord.RichEmbed();
        embed
            .setTitle("Moderation Tools")
            .setDescription("Clear messages, toggle anticaps filters and mute members.\nTo add moderators give them the permission MANAGE_MESSAGES (or ADMINISTRATOR (not recommended))!")
            .setFooter("(Module in progress)")
            .setColor( [125, 203, 23] );

        embed.addField("\u200B","(Operations on messages)");
        embed.addField("clear [amount]","Clear messages. Default: 20",true);
        if(!ind) {
            embed.addField("anticaps", "Toggle anti-caps filter", true);
            embed.addField("\u200B", "(Operations on members)");
            embed.addField("mute <Users>", "Mute a member", true);
            embed.addField("unmute <Users>", "Unmute a member", true);
        }
        message.channel.send(embed);
        return undefined;
    }
},0,"Clear messages, toggle anticaps filters and mute members.");

registerCommand("logger",function(message,cmd,ch){
    function sendHelp(){
        var embed = new Discord.RichEmbed();
        embed
            .setTitle("Logger Help")
            .setColor(colors.green)
            .setDescription("Log members activities in the server.");
        embed.addField("set [channel]","Set a channel for logs.");
        embed.addField("unset","Unset channel and disables logging.");

        message.channel.send(embed);
        return undefined;
    }
    if(cmd === "set") {
        var ch;
        if (message.mentions.channels.array().length < 1) {
            ch = message.channel;
        } else {
            ch = message.mentions.channels.array()[0]
        }
        if (!guilds[message.guild.id]) {
            guilds[message.guild.id] = {};
        }
        guilds[message.guild.id]["logchannel"] = ch.id;
        fs.writeFileSync("data/guilds.json", JSON.stringify(guilds));
        message.channel.send("Successfully set <#" + ch.id + "> as logging channel!");
        return true;
    }else if(cmd === "unset"){
        if (!guilds[message.guild.id]) {
            guilds[message.guild.id] = {};
        }
        guilds[message.guild.id]["logchannel"] = undefined;
        message.channel.send("Logging channel disabled!");
        return true;
    }else{
        sendHelp();
    }
},1,"Logs all activities in the server.");

// Done registering

const updateStats = function(guild){
    if(guild) {
        if (!guilds[guild.id]) {
            guilds[guild.id] = {};
        }
        var msg = guilds[guild.id]["stats"];
        if(msg) {
            guild.fetchMembers().then(function(){});
            var mbms = guild.members.array();
            var total = guild.memberCount;
            var totalOnline;
            var bots = 0;
            var online = 0;
            var idle = 0;
            var busy = 0;
            var offline = 0;
            for(var k in mbms){
                var v = mbms[k];
                if(v.presence) {
                    if (v.presence.status === "online") {
                        online++;
                    } else if (v.presence.status === "offline") {
                        offline++;
                    } else if (v.presence.status === "idle") {
                        idle++;
                    } else if (v.presence.status === "dnd") {
                        busy++;
                    }
                }
                if(v.user && v.user.bot){
                    bots++;
                }
            }
            totalOnline = online + idle + busy;
            msg = msg.replace("%members%", total);
            msg = msg.replace("%totalonline%", totalOnline);
            msg = msg.replace("%online%", online);
            msg = msg.replace("%idle%", idle);
            msg = msg.replace("%busy%", busy);
            msg = msg.replace("%offline%", offline);
            msg = msg.replace("%bots%", bots);
            msg = msg.replace("%servername%", guild.name);
            if(!guild.me.hasPermission("MANAGE_CHANNELS")){
                return false;
            }
            guild.channels.get(guilds[guild.id]["statsChannel"]).setTopic(msg);
            return true;
        }
    }
};

const welcomer = function(member){
    var guild = member.guild;
    if (!guild) {
        log("Guild not existing? "+member.username);
        return null;
    }

    if (guilds[guild.id] && guilds[guild.id]["welcome"] && guilds[guild.id]["welcome"].length > 0) {
        if (guilds[guild.id]["welcomeChannel"]) {
            var chs = guild.channels.array();
            for (var i = 0; i < chs.length; i++) {
                if (chs[i].id === guilds[guild.id]["welcomeChannel"]) {
                    var ch = chs[i]
                }
            }
            if (!ch) {
                return false;
            }

            var maxI = guilds[guild.id]["welcome"].length;
            var choice = randomInt(0, maxI - 1);
            var msg = guilds[guild.id]["welcome"][choice];
            if (msg) {
                guild.fetchMembers().then(function () {
                });
                var mbms = guild.members.array();
                var total = guild.memberCount;
                var totalOnline;
                var bots = 0;
                var online = 0;
                var idle = 0;
                var busy = 0;
                var offline = 0;
                for (var k in mbms) {
                    var v = mbms[k];
                    if(v.presence) {
                        if (v.presence.status === "online") {
                            online++;
                        } else if (v.presence.status === "offline") {
                            offline++;
                        } else if (v.presence.status === "idle") {
                            idle++;
                        } else if (v.presence.status === "dnd") {
                            busy++;
                        }
                    }
                    if (v.user && v.user.bot) {
                        bots++;
                    }
                }
                totalOnline = online + idle + busy;
                msg = msg.replace("%members%", total);
                msg = msg.replace("%totalonline%", totalOnline);
                msg = msg.replace("%online%", online);
                msg = msg.replace("%idle%", idle);
                msg = msg.replace("%busy%", busy);
                msg = msg.replace("%offline%", offline);
                msg = msg.replace("%bots%", bots);
                msg = msg.replace("%servername%", guild.name);
                msg = msg.replace("%username%", member.user.username);
                ch.send(msg).then(function () {
                    console.log("Welcomed "+member.user.username+ " to "+guild.name);
                });
                if ((Math.floor(Date.now() / 1000) - Math.floor(member.user.createdTimestamp / 1000)) < 86400) {
                    var embed = new Discord.RichEmbed();
                    embed.setTitle(":warning: WARNING :warning:");
                    embed.setColor([224, 104, 111]);
                    embed.setDescription("**This user account was made less than a day ago!**");
                    ch.send(embed);
                }
            }
        }
    }
};

const updateCounts = function(){
    var guildsCount = client.guilds.size;
    client.user.setGame(commandPrefix+"help | On "+guildsCount+" servers").then(function(){});

    superagent.post(`https://discordbots.org/api/bots/stats`)
        .set('Authorization', listToken)
        .send({ server_count: guildsCount })
        //.then(() => console.log('Updated discordbots.org stats'))
        .catch(err => console.error(`Error updating discordbots.org stats: ${err.body || err}`));

    superagent.post("http://discordbothub.tk/api/bot")
        .send({ id: client.user.id,
            token: "",
            servercount: guildsCount,
        })
        .catch(err => console.error(`Error updating discordbothub.tk stats: ${err.body || err}`));
};

schedule.scheduleJob('*/5 * * * *', function(){
    updateCounts();
});

client.on('message', message => {messageHandler(message);});

//client.on('messageUpdate', (old,message) => {messageHandler(message);});

client.on("presenceUpdate", (oldm,newm) => {
    updateStats(newm.guild);
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log("\007");
    updateCounts();
});

// logs and shit

client.on("guildMemberAdd", m => {
    updateStats(m.guild);
    welcomer(m);
    updateCounts();

    if(m.guild && guilds[m.guild.id] && guilds[m.guild.id]["logchannel"]){
        if(m.guild.channels.get(guilds[m.guild.id]["logchannel"])){
            var logChannel = m.guild.channels.get(guilds[m.guild.id]["logchannel"]);
            var embed = new Discord.RichEmbed();

            embed
                .setTitle("New member!")
                .setTimestamp()
                .setColor("GREEN")
                .setDescription(m.user.tag+" has joined the guild!");

            logChannel.send(embed);
        }
    }
});

client.on("guildMemberRemove", m =>{
    updateStats(m.guild);
    updateCounts();

    if(m.guild && guilds[m.guild.id] && guilds[m.guild.id]["logchannel"]){
        if(m.guild.channels.get(guilds[m.guild.id]["logchannel"])){
            var logChannel = m.guild.channels.get(guilds[m.guild.id]["logchannel"]);
            var embed = new Discord.RichEmbed();

            embed
                .setTitle("Member left!")
                .setTimestamp()
                .setColor("RED")
                .setDescription(m.user.tag+" has left the guild!");

            logChannel.send(embed);
        }
    }
});

client.on("channelCreate", ch=>{
    if(ch.guild && guilds[ch.guild.id] && guilds[ch.guild.id]["logchannel"]){
        if(ch.guild.channels.get(guilds[ch.guild.id]["logchannel"])){
            var logChannel = ch.guild.channels.get(guilds[ch.guild.id]["logchannel"]);
            var embed = new Discord.RichEmbed();

            embed
                .setTitle("New channel created!")
                .setTimestamp()
                .setColor("GREEN")
                .setDescription(ch.name+" has been created!");

            logChannel.send(embed);
        }
    }
});

client.on("channelDelete",ch=>{
    if(ch.guild && guilds[ch.guild.id] && guilds[ch.guild.id]["logchannel"]){
        if(ch.guild.channels.get(guilds[ch.guild.id]["logchannel"])){
            var logChannel = ch.guild.channels.get(guilds[ch.guild.id]["logchannel"]);
            var embed = new Discord.RichEmbed();

            embed
                .setTitle("Channel deleted!")
                .setTimestamp()
                .setColor("RED")
                .setDescription(ch.name+" has been deleted!");

            logChannel.send(embed);
        }
    }
});

client.on("guildBanAdd",(guild,user)=>{
    if(guild && guilds[guild.id] && guilds[guild.id]["logchannel"]){
        if(guild.channels.get(guilds[guild.id]["logchannel"])){
            var logChannel = guild.channels.get(guilds[guild.id]["logchannel"]);
            var embed = new Discord.RichEmbed();

            embed
                .setTitle("New banned user!")
                .setTimestamp()
                .setColor("RED")
                .setDescription(user.tag+" has been banned!");

            logChannel.send(embed);
        }
    }
});

client.on("guildBanRemove",(guild,user)=>{
    if(guild && guilds[guild.id] && guilds[guild.id]["logchannel"]){
        if(guild.channels.get(guilds[guild.id]["logchannel"])){
            var logChannel = guild.channels.get(guilds[guild.id]["logchannel"]);
            var embed = new Discord.RichEmbed();

            embed
                .setTitle("User unbanned!")
                .setTimestamp()
                .setColor("GREEN")
                .setDescription(user.tag+" has been unbanned!");

            logChannel.send(embed);
        }
    }
});

client.on("messageDelete",message=> {
    if(message.author.id === client.user.id){
        return;
    }
    if(message.guild && guilds[message.guild.id] && guilds[message.guild.id]["logchannel"]){
        if(message.guild.channels.get(guilds[message.guild.id]["logchannel"])){
            var logChannel = message.guild.channels.get(guilds[message.guild.id]["logchannel"]);
            var embed = new Discord.RichEmbed();

            embed
                .setTitle("Message deleted!")
                .setTimestamp()
                .setDescription("<#"+message.channel.id+">")
                .setColor("RED")
                .setAuthor(message.author.tag+" ("+message.author.id+")",message.author.avatarURL)
                .addField("Message content",message.content);

            logChannel.send(embed);
        }
    }
});

client.on("messageUpdate",(omsg,nmsg)=>{
    if(omsg.author.id === client.user.id){
        return;
    }
    if(omsg.content === nmsg.content){
        return;
    }
    var guild = omsg.guild;
    if(guild && guilds[guild.id] && guilds[guild.id]["logchannel"]){
        if(guild.channels.get(guilds[guild.id]["logchannel"])){
            var logChannel = guild.channels.get(guilds[guild.id]["logchannel"]);
            var embed = new Discord.RichEmbed();

            embed
                .setTitle("Message updated!")
                .setDescription("<#"+nmsg.channel.id+">")
                .setTimestamp()
                .setColor("GOLD")
                .setAuthor(nmsg.author.tag+" ("+nmsg.author.id+")",nmsg.author.avatarURL);

            if(omsg) {
                embed.addField("Original message", omsg.content);
            }
            if(nmsg) {
                embed.addField("Edited message", nmsg.content);
            }

            logChannel.send(embed);
        }
    }
});

client.login(botToken).then(function(){});

var consoleCommands = {
    eval: function(){
        var argse = [];
        for (var i=1; i < arguments.length; i++){
            argse.push(arguments[i]);
        }
        var args = argse.join(" ");
        try {
            var val = eval(args);
            console.log("OUT> "+val);
        }catch (e){
            console.log(e)
        }
    }
};

stdin.addListener("data", function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that
    // with toString() and then trim()
    var c = d.toString().trim();
    c = c.split(" ");
    var command = c[0];
    var args = [];
    for (var i = 1; i < c.length; i++) {
        args.push(c[i]);
    }
    if(consoleCommands[command]){
        try {
            consoleCommands[command].apply(this, args);
        } catch (e) {
            console.log("ERROR> "+e)
        }
    }else{
        console.log("No such command");
    }
});

function executeQueue(message,queue) {
    try {
// If the queue is empty, finish.
        if (queue.length === 0) {
            message.channel.send('Playback finished.');

            // Leave the voice channel.
            const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == message.guild.id);
            if (voiceConnection !== null) return voiceConnection.disconnect();
        }

        new Promise((resolve, reject) => {
            // Join the voice channel if not already in one.
            const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == message.guild.id);
            if (voiceConnection === null) {
                if (CHANNEL) {
                    message.guild.channels.find('name', CHANNEL).join().then(connection => {
                        resolve(connection);
                    }).catch((error) => {
                        console.log(error);
                    });

                    // Check if the user is in a voice channel.
                } else if (message.member.voiceChannel) {
                    message.member.voiceChannel.join().then(connection => {
                        resolve(connection);
                    }).catch((error) => {
                        console.log(error);
                    });
                } else {
                    // Otherwise, clear the queue and do nothing.
                    queue.splice(0, queue.length);
                    reject();
                }
            } else {
                resolve(voiceConnection);
            }
        }).then(connection => {
            // Get the first item in the queue.
            const video = queue[0];

            console.log(video.webpage_url);

            // Play the video.
            message.channel.send('Now Playing: ' + video.title).then(() => {
                let dispatcher = connection.playStream(ytdl(video.webpage_url, {filter: 'audioonly'}), { // passes: 5 better quality
                    seek: 0,
                    volume: (50 / 100)
                });

                connection.on('error', (error) => {
                    // Skip to the next song.
                    console.log(error);
                    queue.shift();
                    executeQueue(message, queue);
                });

                dispatcher.on('error', (error) => {
                    // Skip to the next song.
                    console.log(error);
                    queue.shift();
                    executeQueue(message, queue);
                });

                dispatcher.on('end', () => {
                    // Wait a second.
                    setTimeout(() => {
                        if (queue.length > 0) {
                            // Remove the song from the queue.
                            queue.shift();
                            // Play the next song in the queue.
                            executeQueue(message, queue);
                        }
                    }, 1000);
                });
            }).catch((error) => {
                console.log(error);
            });
        }).catch((error) => {
            console.log(error);
        });
    } catch (e) {
        console.log("Music player error: "+e)
    }
}

function antiCapsFilter(c){
    var length = c.replace(/[^A-Z]/g, "").length;
    var percentile = Math.floor((length / c.length) * 100);
    if (c.length < 8) {
        return false;
    }
    return percentile > 45;
}
