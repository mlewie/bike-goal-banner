const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

export default async function handler(req, res) {
    try {
        // 1. Register Poppins Bold from your root folder
        const fontPath = path.join(process.cwd(), 'Poppins-Bold.ttf');
        registerFont(fontPath, { family: 'Poppins' }); 

        // 2. Data Scraping
        const teamUrl = "https://support.baycrestfoundation.org/site/TR/Events/General?pg=team&team_id=9322&fr_id=1180";
        const response = await axios.get(teamUrl);
        const $ = cheerio.load(response.data);
        
        // Pulling the raised value (e.g., "$7,100.00")
        const raisedText = $('.amount-raised-value').first().text() || '0';
        
        // Remove symbols to get a clean number for math
        const raised = parseFloat(raisedText.replace(/[$,]/g, '')) || 0;
        const goal = 10000;
        
        // Calculation: (Raised / Goal) * 100
        const percentage = Math.min(Math.round((raised / goal) * 100), 100);

        // 3. Setup Canvas
        const canvas = createCanvas(600, 200);
        const ctx = canvas.getContext('2d');

        const bottomPath = path.join(process.cwd(), 'bottom-layer.png');
        const topPath = path.join(process.cwd(), 'top-layer.png');
        
        const bottom = await loadImage(bottomPath);
        const top = await loadImage(topPath);

        // Draw Sequence
        ctx.drawImage(bottom, 0, 0, 600, 200); // Background
        
        ctx.fillStyle = '#e6e6e6'; // Grey Empty Bar
        ctx.fillRect(160, 140, 420, 40);

        const fillWidth = (percentage / 100) * 420;
        ctx.fillStyle = '#97257e'; // Magenta Progress Fill
        ctx.fillRect(160, 140, fillWidth, 40);

        // Draw Percentage Text: Centered vertically, 20px from bar left
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Poppins"'; 
        ctx.textBaseline = 'middle';
        ctx.fillText(`${percentage}%`, 180, 160); // 160 (bar start) + 20px

        ctx.drawImage(top, 0, 0, 600, 200); // Branding Overlay

        // 4. Send Image
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.status(200).send(canvas.toBuffer());
        
    } catch (error) {
        console.error(error);
        res.status(500).send("Error generating image");
    }
}
