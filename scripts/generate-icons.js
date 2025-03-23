const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const services = [
    { name: 'apple', color: '#000000' },
    { name: 'android', color: '#3DDC84' },
    { name: 'verizon', color: '#CD040B' },
    { name: 'att', color: '#00A8E0' },
    { name: 'tmobile', color: '#E20074' },
    { name: 'voip', color: '#4A90E2' },
    { name: 'other', color: '#666666' }
];

const outputDir = path.join(__dirname, '../public/images/services');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

services.forEach(service => {
    const canvas = createCanvas(48, 48);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = service.color;
    ctx.beginPath();
    ctx.arc(24, 24, 24, 0, Math.PI * 2);
    ctx.fill();

    // Draw service name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(service.name.charAt(0).toUpperCase(), 24, 24);

    // Save the image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(outputDir, `${service.name}.png`), buffer);
});

console.log('Service icons generated successfully!'); 