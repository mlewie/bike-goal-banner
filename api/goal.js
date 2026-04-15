const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

export default async function handler(req, res) {
    try {
        // 1. Register Poppins Font
        const fontPath = path.join(process.cwd(), 'Poppins-Bold.ttf');
        registerFont(fontPath, { family: 'Poppins' }); 

        // 2. Data Scraping from Baycrest
        const teamUrl = "https://support.baycrestfoundation.org/site/TR/Events/General?pg=team&team_id=9322&fr_id=1180";
        const response = await axios.get(teamUrl);
        const $ = cheerio.load(response.data);
        
        // Target the specific values on the page
        const raisedText = $('.amount-raised-value').first().text() || "0";
        const goalText = $('.goal-value').first().text() || "10000";

        // Cleaning function to remove $, commas, and extra text
        const cleanNumber = (str) => {
            const num = parseFloat(str.replace(/[^0-9.]/g, ''));
            return isNaN(num) ? 0 : num;
        };

        const raised = cleanNumber(raisedText);
        const goal = cleanNumber(goalText) || 10000;

        // PROGRESS CALCULATION (Raised / Goal)
        const percentage = Math.min(Math.round((raised / goal) * 100), 100);

        // 3. Canvas Setup (600x200)
        const canvas = createCanvas(600, 200);
        const ctx = canvas.getContext('2d');

        // Load Images
        const bottomPath = path.join(process.cwd(), 'bottom-layer.png');
        const topPath = path.join(process.cwd(), 'top-layer.png');
        const bottom = await loadImage(bottomPath);
        const top = await loadImage(topPath);

        // DRAWING SEQUENCE
        // Background
        ctx.drawImage(bottom, 0, 0, 600, 200);
        
        // Empty Bar Background (#e6e6e6)
        ctx.fillStyle = '#e6e6e6';
        ctx.fillRect(160, 140, 420, 40);

        // Progress Fill (#97257e)
        const fillWidth = (percentage / 100) * 420;
        ctx.fillStyle = '#97257e';
        ctx.fillRect(160, 140, fillWidth, 40);

        // Percentage Text (Centered vertically, 20px from left of bar)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Poppins"';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${percentage}%`, 180, 160); // 160 (bar start) + 20 offset

        // Foreground Overlay
        ctx.drawImage(top, 0, 0, 600, 200);

        // 4. Send the Final Image
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.status(200).send(canvas.toBuffer());
        
    } catch (error) {
        console.error("Error generating image:", error);
        res.status(500).send("Error generating image. Check Vercel logs.");
    }
}
