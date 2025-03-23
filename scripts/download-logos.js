const fs = require('fs');
const https = require('https');
const path = require('path');

const logos = {
    'apple': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/apple.svg',
    'android': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/android.svg',
    'verizon': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/verizon.svg',
    'att': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/att.svg',
    'tmobile': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/tmobile.svg',
    'voip': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/voip.svg',
    'other': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/help.svg'
};

const outputDir = path.join(__dirname, '../public/images/services');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Download and convert SVG to PNG
Object.entries(logos).forEach(([name, url]) => {
    https.get(url, (response) => {
        if (response.statusCode !== 200) {
            console.error(`Failed to download ${name} logo: ${response.statusCode}`);
            return;
        }

        const filePath = path.join(outputDir, `${name}.svg`);
        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
            console.log(`Downloaded ${name} logo successfully!`);
        });
    }).on('error', (err) => {
        console.error(`Error downloading ${name} logo:`, err.message);
    });
});

console.log('Logo download process initiated!'); 