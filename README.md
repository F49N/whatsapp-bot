<img src="https://files.catbox.moe/lq7nwm.jpg" alt="Garfield Bot" width="300"/>

# WhatsApp Bot

> A powerful and feature-rich WhatsApp bot built with Baileys library

## Quick Setup

### 1. Get Your Session ID
[![Scan QR Code](https://img.shields.io/badge/Scan-QR%20Code-25D366?style=for-the-badge&logo=whatsapp)](https://pair.garfielx.qzz.io/)

### 2. Environment Variables

```bash
SESSION_ID=session_id_here
PREFIX=/
LANG=en
SUDO=×××××××××
OWNER_NUMBER=××××××,××××××,×××××
WORKTYPE=private/public
THEME=Garfield
```

### 3. Start Bot Using PM2

**Start the bot:**
```bash
pm2 start . --name garfield --attach --time
```

**Stop the bot:**
```bash
pm2 stop garfield
```

## Configure

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SESSION_ID` | Session ID | - | ✅ |
| `PREFIX` | cmd prefix | `.` | ❌ |
| `SUDO` | Admin nums | - | ❌ |
| `OWNER_NUMBER` | Owner nums | - | ❌ |
| `WORKTYPE` | (`private`/`public`) | `private` | ❌ |
| `THEME` | appearance theme | `Garfield` | ❌ |

## Available Themes

- **Garfield** (Default)
- **X Astral**  
- **WhatsApp Bot**

> Change themes by setting the `THEME` environment variable

## Deploy on

### Koyeb Deployment
[![Deploy to Koyeb](https://www.koyeb.com/static/images/deploy/button.svg)](https://app.koyeb.com/deploy?name=garfield&type=git&repository=naxordeve%2Fwhatsapp-bot&branch=master&builder=dockerfile&instance_type=free&instances_min=0&autoscaling_sleep_idle_delay=3600&env%5BPREFIX%5D=.&env%5BSESSION_ID%5D=garfield%7E9fgeB7X8&env%5BSUDO%5D=%2B27686881509&env%5BTHEME%5D=Garfield&ports=3000%3Bhttp%3B%2F&hc_protocol%5B3000%5D=tcp&hc_grace_period%5B3000%5D=5&hc_interval%5B3000%5D=30&hc_restart_limit%5B3000%5D=3&hc_timeout%5B3000%5D=5&hc_path%5B3000%5D=%2F&hc_method%5B3000%5D=get)

### Replit
1. Fork this repository to your Replit account
2. Add environment variables in the Secrets tab
3. Click the Run button to start your bot


# Render

[![Render](./lib/deploy-render.svg)](https://render.com/deploy?repo=https://github.com/naxordeve/whatsapp-bot)

# Panel

[![Panel](./lib/deploy-panel.svg)]( https://control.katabump.com/)

## Monitoring

### UptimeBot
Keep your bot online 24/7 with [UptimeRobot](https://uptimerobot.com)

## Development

### Local Setup
```bash
# Clone the repository
git clone https://github.com/naxordeve/whatsapp-bot.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start the bot
npm start
```

### Plugins
Create custom plugins in the `plugins/` directory. Check existing plugins for examples.

[![Join our WhatsApp](https://img.shields.io/badge/💬%20Join%20WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://chat.whatsapp.com/KLd7DIw1OV56wj4BRw0oE9)

**Arigato**

---

<div align="center">

**Made with ❤️**

[![GitHub stars](https://img.shields.io/github/stars/naxordeve/whatsapp-bot?style=social)](https://github.com/naxordeve/whatsapp-bot)
[![GitHub forks](https://img.shields.io/github/forks/naxordeve/whatsapp-bot?style=social)](https://github.com/naxordeve/whatsapp-bot)

</div>
