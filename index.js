require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    PermissionsBitField
} = require("discord.js");

const {
    Player
} = require("discord-player");

const {
    DefaultExtractors
} = require("@discord-player/extractor");

const {
    YouTubeDlpExtractor
} = require("discord-player-youtubedlp");

const ffmpeg = require("ffmpeg-static");

// discord-player needs FFmpeg to convert audio into a Discord-compatible stream.
if (ffmpeg) {
    process.env.FFMPEG_PATH = ffmpeg;
}

const PREFIX = "!";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const player = new Player(client, {
    ffmpegPath: ffmpeg || undefined
});

player.events.on("playerStart", (queue, track) => {
    console.log(`▶️ Audio started: ${track.title}`);
});

player.events.on("playerError", (queue, error) => {
    console.error("❌ Audio playback error:", error);

    queue.metadata?.channel?.send(
        "❌ Audio playback failed. Check the bot terminal for the decoder error."
    ).catch(() => {});
});

client.once("clientReady", async () => {

    console.log("================================");
    console.log("🎵 DISCORD MUSIC BOT");
    console.log("================================");

    console.log(`🤖 Logged in as: ${client.user.tag}`);

    // Set bot presence/status
    client.user.setPresence({
        status: 'online',
        activities: [{ name: 'your commands', type: 'LISTENING' }],
    });
    console.log("📊 Status set: Listening to your commands");

    try {

        // Load SoundCloud / Spotify metadata / other default extractors
        await player.extractors.loadMulti(DefaultExtractors);

        console.log("✅ Default extractors loaded");

        // Load YouTube playback
        await player.extractors.register(
            YouTubeDlpExtractor,
            {
                agent: {
                    autoCookiesFromBrowser: false
                },
                debug: true,
                searchLimit: 5,
                relatedLimit: 5,

                searchTimeoutMs: 10000,
                videoTimeoutMs: 15000,
                ytdlpTimeoutMs: 30000,

                enableProtocols: true
            }
        );

        console.log("✅ YouTube extractor loaded");

        console.log("🎵 MUSIC BOT READY");

    } catch (error) {

        console.error("❌ Extractor startup error:");
        console.error(error);

    }

});


// ======================================
// COMMAND HANDLER
// ======================================

client.on("messageCreate", async (message) => {

    if (message.author.bot) return;

    if (!message.guild) return;

    if (!message.content.startsWith(PREFIX)) return;

    const parts = message.content
        .slice(PREFIX.length)
        .trim()
        .split(/\s+/);

    const command = parts.shift()?.toLowerCase();

    const query = parts.join(" ");

    console.log(
        `📩 ${message.author.tag}: ${message.content}`
    );


    // ======================================
    // HELP
    // ======================================

    if (command === "help") {

        return message.reply(
            [
                "🎵 **MUSIC COMMANDS**",
                "",
                "`!play <song / URL>`",
                "`!pause`",
                "`!resume`",
                "`!skip`",
                "`!stop`",
                "`!queue`",
                "`!nowplaying`",
                "`!loop`",
                "`!unloop`",
                "`!shuffle`",
                "`!remove <number>`",
                "`!clear`",
                "`!volume <1-100>`",
                "`!leave`"
            ].join("\n")
        );

    }


    // ======================================
    // PLAY
    // ======================================

    if (command === "play" || command === "p") {

        if (!query) {

            return message.reply(
                "❌ Example: `!play never gonna give you up`"
            );

        }

        const voiceChannel =
            message.member.voice.channel;

        if (!voiceChannel) {

            return message.reply(
                "🔊 **Join a voice channel first.**"
            );

        }

        const permissions =
            voiceChannel.permissionsFor(
                message.client.user
            );

        if (!permissions?.has(
            PermissionsBitField.Flags.Connect
        )) {

            return message.reply(
                "❌ I need the **Connect** permission."
            );

        }

        if (!permissions?.has(
            PermissionsBitField.Flags.Speak
        )) {

            return message.reply(
                "❌ I need the **Speak** permission."
            );

        }

        await message.reply(
            `🔎 Searching for **${query}**...`
        );

        try {

            console.log(
                "🎵 PLAY REQUEST:",
                query
            );

            const result =
                await player.play(
                    voiceChannel,
                    query,
                    {
                        nodeOptions: {

                            metadata: {
                                channel:
                                    message.channel,

                                requestedBy:
                                    message.author
                            },

                            leaveOnEmpty: true,
                            leaveOnEnd: false,
                            leaveOnStop: true,

                            bufferingTimeout: 30000,

                            volume: 100
                        }
                    }
                );

            console.log(
                "🎵 TRACK:",
                result.track.title
            );

            return message.channel.send(
                `▶️ **Playing:** ${result.track.title}\n` +
                `👤 ${result.track.author}`
            );

        } catch (error) {

            console.error(
                "================================"
            );

            console.error(
                "❌ PLAYBACK ERROR"
            );

            console.error(error);

            console.error(
                "================================"
            );

            return message.channel.send(
                "❌ **Couldn't play that.**\n" +
                "Check the VS Code terminal for the actual error."
            );

        }

    }


    const queueCommands = new Set([
        "pause",
        "resume",
        "unpause",
        "skip",
        "s",
        "stop",
        "leave",
        "disconnect",
        "nowplaying",
        "np",
        "queue",
        "q",
        "loop",
        "unloop",
        "shuffle",
        "remove",
        "clear",
        "volume",
        "vol"
    ]);

    if (!queueCommands.has(command)) return;

    const queue = player.nodes.get(message.guild.id);

    if (!queue) {
        return message.reply("❌ Nothing is currently playing.");
    }


    // ======================================
    // PAUSE
    // ======================================

    if (command === "pause") {

        queue.node.setPaused(true);

        return message.reply(
            "⏸️ **Paused**"
        );

    }


    // ======================================
    // RESUME
    // ======================================

    if (
        command === "resume" ||
        command === "unpause"
    ) {

        queue.node.setPaused(false);

        return message.reply(
            "▶️ **Resumed**"
        );

    }


    // ======================================
    // SKIP
    // ======================================

    if (
        command === "skip" ||
        command === "s"
    ) {

        if (!queue.currentTrack) {

            return message.reply(
                "❌ Nothing is playing."
            );

        }

        const old =
            queue.currentTrack.title;

        await queue.node.skip();

        return message.reply(
            `⏭️ Skipped **${old}**`
        );

    }


    // ======================================
    // STOP
    // ======================================

    if (command === "stop") {

        queue.delete();

        return message.reply(
            "⏹️ Stopped."
        );

    }


    // ======================================
    // LEAVE
    // ======================================

    if (
        command === "leave" ||
        command === "disconnect"
    ) {

        queue.delete();

        return message.reply(
            "👋 Left the voice channel."
        );

    }


    // ======================================
    // NOW PLAYING
    // ======================================

    if (
        command === "nowplaying" ||
        command === "np"
    ) {

        if (!queue.currentTrack) {

            return message.reply(
                "❌ Nothing is playing."
            );

        }

        return message.reply(
            `🎵 **Now Playing**\n\n` +
            `**${queue.currentTrack.title}**\n` +
            `👤 ${queue.currentTrack.author}`
        );

    }


    // ======================================
    // QUEUE
    // ======================================

    if (
        command === "queue" ||
        command === "q"
    ) {

        const tracks =
            queue.tracks.toArray();

        let text = "🎶 **QUEUE**\n\n";

        if (queue.currentTrack) {

            text +=
                `▶️ **Now:** ${queue.currentTrack.title}\n\n`;

        }

        if (!tracks.length) {

            text += "No upcoming songs.";

        } else {

            tracks
                .slice(0, 20)
                .forEach((track, index) => {

                    text +=
                        `**${index + 1}.** ${track.title}\n`;

                });

        }

        return message.reply(text);

    }


    // ======================================
    // LOOP
    // ======================================

    if (command === "loop") {

        queue.setRepeatMode(2);

        return message.reply(
            "🔁 **Track loop ON**"
        );

    }


    // ======================================
    // UNLOOP
    // ======================================

    if (command === "unloop") {

        queue.setRepeatMode(0);

        return message.reply(
            "➡️ **Loop OFF**"
        );

    }


    // ======================================
    // SHUFFLE
    // ======================================

    if (command === "shuffle") {

        if (queue.tracks.size < 2) {

            return message.reply(
                "❌ Need at least 2 queued songs."
            );

        }

        queue.tracks.shuffle();

        return message.reply(
            "🔀 **Queue shuffled**"
        );

    }


    // ======================================
    // REMOVE
    // ======================================

    if (command === "remove") {

        const number =
            Number(parts[0]);

        const tracks =
            queue.tracks.toArray();

        if (
            !Number.isInteger(number) ||
            number < 1 ||
            number > tracks.length
        ) {

            return message.reply(
                "❌ Example: `!remove 2`"
            );

        }

        const track =
            tracks[number - 1];

        queue.removeTrack(track);

        return message.reply(
            `🗑️ Removed **${track.title}**`
        );

    }


    // ======================================
    // CLEAR
    // ======================================

    if (command === "clear") {

        queue.tracks.clear();

        return message.reply(
            "🧹 Queue cleared."
        );

    }


    // ======================================
    // VOLUME
    // ======================================

    if (
        command === "volume" ||
        command === "vol"
    ) {

        if (!parts[0]) {
            return message.reply(
                `🔊 Current volume: **${queue.node.volume}%**`
            );
        }

        const volume = Number(parts[0]);

        if (
            !Number.isInteger(volume) ||
            volume < 0 ||
            volume > 100
        ) {

            return message.reply(
                "❌ Use a volume from `0` to `100`, for example: `!volume 50`"
            );

        }

        try {
            queue.node.setVolume(volume);
        } catch (error) {
            console.error("❌ Volume error:", error);
            return message.reply("❌ Could not change the volume.");
        }

        return message.reply(
            `🔊 Volume: **${volume}%**`
        );

    }

});


// ======================================
// DISCORD ERRORS
// ======================================

client.on("error", (error) => {

    console.error(
        "❌ DISCORD ERROR:",
        error
    );

});


// ======================================
// LOGIN
// ======================================

if (!process.env.DISCORD_BOT_TOKEN) {

    console.error(
        "❌ DISCORD_BOT_TOKEN is missing."
    );

    console.error(
        'PowerShell: $env:DISCORD_BOT_TOKEN="YOUR_TOKEN"'
    );

    process.exit(1);

}


client.login(
    process.env.DISCORD_BOT_TOKEN
);
player.events.on("error", (queue, error) => {
    console.error("❌ PLAYER ERROR:", error);
});

player.events.on("playerError", (queue, error) => {
    console.error("❌ PLAYER ERROR:", error);
});
player.events.on("playerStart", (queue, track) => {
    console.log("🔊 PLAYER START:", track.title);
});

player.events.on("debug", (queue, message) => {
    console.log("🔎 PLAYER DEBUG:", message);
});