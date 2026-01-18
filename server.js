const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (HTML/CSS) from the "public" folder
app.use(express.static('public'));

// Route to handle logging volunteers
app.post('/log_volunteer', (req, res) => {
    const { name, lat, lon } = req.body;
    
    // Create a timestamp
    const timestamp = new Date().toLocaleString();
    
    // Format the log entry
    const logEntry = `[${timestamp}] NAME: ${name} : ${lat}, ${lon}\n`;

    // Write to logs.txt (flags: 'a' means append)
    fs.appendFile('logs.txt', logEntry, (err) => {
        if (err) {
            console.error("Error writing to file", err);
            return res.status(500).json({ status: 'error' });
        }
        console.log(`New Log: ${name}`); // Print to your console so you see it live
        res.json({ status: 'success' });
    });
});

// Add this to server.js
app.get('/the-secret-list', (req, res) => {
    res.sendFile(path.join(__dirname, 'logs.txt'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
