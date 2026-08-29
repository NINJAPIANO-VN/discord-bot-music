# Discord Music Bot

A Discord music bot built with Node.js and Discord.js that can join a voice channel and play music from supported sources.

## Features

- Play songs by name or URL
- Queue tracks
- Pause, resume, and skip
- Stop playback and leave the voice channel
- View the current queue and now-playing track
- Loop, shuffle, clear, and remove tracks
- Adjust volume

## Requirements

- Node.js 18 or newer
- A Discord bot token
- FFmpeg installed or bundled through the dependencies used by this project

## Installation

1. Open the project folder.
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file from the example:

```bash
copy .env.example .env
```

4. Add your bot token to `.env`:

```env
DISCORD_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
```

## Run the bot

```bash
npm start
```

## Example commands

```text
!play never gonna give you up
!pause
!resume
!skip
!stop
!queue
!nowplaying
!volume 50
!leave
```

## Notes

This project uses `discord.js`, `discord-player`, and the YouTube extractor support configured in the bot code.

## License

This project is for educational and personal use.
