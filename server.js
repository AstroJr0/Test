const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const app = express();

// Use the port Render assigns, or 3000 for local testing
const PORT = process.env.PORT || 3000;

// Middleware to handle JSON data and serve your "public" folder
app.use(express.json());
app.use(express.static('public'));

// --- THE LOGGING LOGIC ---
app.post('/log_volunteer', (req, res) => {
    const { name, lat, lon } = req.body;
    const timestamp = new Date().toLocaleString();
    const logEntry = `[${timestamp}] NAME: ${name} : ${lat}, ${lon}\n`;

    // 1. SAVE TO FILE (Temporary on Render free tier)
    fs.appendFile('logs.txt', logEntry, (err) => {
        if (err) console.error("Could not write to logs.txt");
    });

    // 2. PERMANENT STORAGE: SEND TO DISCORD
    // Replace the URL below with your actual Discord Webhook URL
    const discordWebhookUrl = 'YOUR_DISCORD_WEBHOOK_URL_HERE'; 

    const payload = JSON.stringify({
        content: `🚀 **New Volunteer!**\n**Name:** ${name}\n**Location:** ${lat}, ${lon}\n**Time:** ${timestamp}`
    });

    // We use the built-in 'https' module so you don't have to install extra libraries
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

    const request = https.request(options, (response) => {
        console.log(`Discord Status: ${response.statusCode}`); // Should be 204 if successful
    });

    request.on('error', (e) => {
        console.error("Discord Error:", e.message);
    });

    request.write(payload);
    request.end();

    console.log(`Logged volunteer: ${name}`);
    res.json({ status: 'success' });
});

// --- THE SECRET VIEW ROUTE ---
// Access this at: your-site.com/the-secret-list
app.get('/the-secret-list', (req, res) => {
    const logPath = path.join(__dirname, 'logs.txt');
    if (fs.existsSync(logPath)) {
        res.sendFile(logPath);
    } else {
        res.send("No logs recorded yet. Be the first!");
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
