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
    // We pulled the URL from Render's Environment Variables
    const discordWebhookUrl = process.env.WEBHOOK; 

    // Safety check: If the Webhook URL is missing, don't crash the server
    if (!discordWebhookUrl) {
        console.error("ERROR: WEBHOOK environment variable is not set on Render!");
        return res.status(500).json({ status: 'error', message: 'Config missing' });
    }

    const payload = JSON.stringify({
        content: `🚀 **New Volunteer Alert!**\n**Name:** ${name}\n**Location:** ${lat}, ${lon}\n**Time:** ${timestamp}`
    });

    try {
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
            console.log(`Discord Response: ${response.statusCode}`); 
        });

        request.on('error', (e) => {
            console.error("Discord Request Error:", e.message);
        });

        request.write(payload);
        request.end();

    } catch (err) {
        console.error("Invalid Webhook URL format:", err.message);
    }

    console.log(`Volunteer logged locally: ${name}`);
    res.json({ status: 'success' });
});

// --- THE SECRET VIEW ROUTE ---
app.get('/the-secret-list', (req, res) => {
    const logPath = path.join(__dirname, 'logs.txt');
    if (fs.existsSync(logPath)) {
        res.sendFile(logPath);
    } else {
        res.send("No logs recorded yet.");
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
