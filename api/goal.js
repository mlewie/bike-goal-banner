const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

export default async function handler(req, res) {
    try {
        // 1. Establish the Root Path
        // This ensures Vercel finds files in the main directory
        const rootDir = process.cwd();
        
        // 2. Define File Paths
        const fontPath = path.join(rootDir, 'Poppins-Bold.ttf');
        const bottomPath = path.join(rootDir, 'bottom-layer.png');
        const topPath = path.join(rootDir, 'top-layer.png');

        // 3. Register Font (Must happen before creating canvas)
        registerFont(fontPath, { family: 'Poppins' }); 

        // 4. Scrape Live Data from Baycrest
        const teamUrl = "https://support.baycrestfoundation.org/site/TR/Events/General?pg=team&team_id=9322&fr_id=1180";
        const response = await axios.get(teamUrl);
        const $ = cheerio.load(response.data);
        
        // Grabbing the amount raised (e.g., "$7,100")
        const raisedText = $('.amount-raised-value').first().text() || '0';
        const raised = parseFloat(raisedText.replace(/[$,]/g, '')) || 0;
        const goal = 10000;
        
        // Math: (Raised / Goal) * 100
        const percentage = Math.min(Math.round((raised / goal) * 100), 100);

        // 5. Build the Image
        const canvas = createCanvas(600, 200);
        const ctx = canvas.getContext('2d');

        // Load Image Layers
        const bottom = await loadImage(bottomPath);
        const top = await loadImage(topPath);

        // Background Layer
        ctx.drawImage(bottom, 0, 0, 600, 200); 
        
        // Progress Bar Track (Grey)
        ctx.fillStyle = '#e6e6e6';
        ctx.fillRect(160, 140, 420, 40);

        // Progress Bar Fill (Magenta)
        const fillWidth = (percentage / 100) * 420;
        ctx.fillStyle = '#97257e'; 
        ctx.fillRect(160, 140, fillWidth, 40);

        // Draw Percentage Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Poppins"'; 
        ctx.textBaseline = 'middle';
        // 180 is 160 (start of bar) + 20px padding
        ctx.fillText(`${percentage}%`, 180, 160); 

        // Branding/Overlay Layer
        ctx.drawImage(top, 0, 0, 600, 200); 

        // 6. Serve the Image with No-Cache headers
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.status(200).send(canvas.toBuffer());
        
    } catch (error) {
        // Detailed error logging for Vercel Dashboard
        console.error("Vercel Function Error:", error.message);
        res.status(500).send(`Error: ${error.message}`);
    }
}
