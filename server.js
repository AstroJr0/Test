const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const app = express();

// Use the port Render assigns, or 3000 for local testing
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// --- ROUTES ---

// 1. Secret route to view the text file directly in browser
app.get('/the-secret-list', (req, res) => {
    const logPath = path.join(__dirname, 'logs.txt');
    if (fs.existsSync(logPath)) {
        res.sendFile(logPath);
    } else {
        res.send("No logs recorded yet.");
    }
});

// 2. The logging logic (File + Discord)
app.post('/log_volunteer', (req, res) => {
    const { name, lat, lon } = req.body;
    const timestamp = new Date().toLocaleString();
    const logEntry = `[${timestamp}] NAME: ${name} : ${lat}, ${lon}\n`;

    // Save to local file (Temporary on Render)
    fs.appendFile('logs.txt', logEntry, (err) => {
        if (err) console.error("Error writing to logs.txt");
    });

    // PERMANENT STORAGE: Send to Discord Webhook
    const discordWebhookUrl = 'https://discord.com/api/webhooks/1462446485638480075/p4tU5X_KgFcAR85tz7AGCf4QbXpDdkH8N6iRdtuGLpqX447PLTo3v9vEWpne4FX6khlj'; 

    if (discordWebhookUrl !== 'YOUR_DISCORD') {
        const payload = JSON.stringify({
            content: `🚀 **New Volunteer!**\n**Name:** ${name}\n**Location:** ${lat}, ${lon}\n**Time:** ${timestamp}`
        });

        const url = new URL(discordWebhookUrl);
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        };

        const request = https.request(options);
        request.on('error', (e) => console.error("Discord Error:", e));
        request.write(payload);
        request.end();
    }

    console.log(`Volunteer logged: ${name}`);
    res.json({ status: 'success' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is live on port ${PORT}`);
});
