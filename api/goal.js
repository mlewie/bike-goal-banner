const { createCanvas, loadImage, registerFont } = require('canvas'); // Added registerFont
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

export default async function handler(req, res) {
    try {
        // --- NEW: Register the font file ---
        const fontPath = path.join(process.cwd(), 'font.ttf'); // Ensure you have font.ttf in your root
        registerFont(fontPath, { family: 'CustomFont' }); 

        const teamUrl = "https://support.baycrestfoundation.org/site/TR/Events/General?pg=team&team_id=9322&fr_id=1180";
        const response = await axios.get(teamUrl);
        const $ = cheerio.load(response.data);
        
        const raisedText = $('.amount-raised-value').text().replace(/[$,]/g, '');
        const raised = parseFloat(raisedText) || 0;
        const goal = 10000;
        const percentage = Math.min(Math.round((raised / goal) * 100), 100);

        const canvas = createCanvas(600, 200);
        const ctx = canvas.getContext('2d');

        const bottomPath = path.join(process.cwd(), 'bottom-layer.png');
        const topPath = path.join(process.cwd(), 'top-layer.png');
        
        const bottom = await loadImage(bottomPath);
        const top = await loadImage(topPath);

        ctx.drawImage(bottom, 0, 0, 600, 200);
        
        ctx.fillStyle = '#e6e6e6';
        ctx.fillRect(160, 140, 420, 40);

        const fillWidth = (percentage / 100) * 420;
        ctx.fillStyle = '#97257e';
        ctx.fillRect(160, 140, fillWidth, 40);

        // --- UPDATED: Use the 'CustomFont' name we registered above ---
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "CustomFont"'; 
        ctx.textBaseline = 'middle';
        ctx.fillText(`${percentage}%`, 180, 160);

        ctx.drawImage(top, 0, 0, 600, 200);

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.status(200).send(canvas.toBuffer());
        
    } catch (error) {
        console.error(error);
        res.status(500).send("Error generating image");
    }
}
