
const fs = require('fs');

try {
    const content = fs.readFileSync('debug_api_error.log', 'utf16le');
    const index = content.indexOf('FULL ERROR DETAILS:');

    if (index !== -1) {
        // Extract 2000 chars
        let raw = content.substring(index, index + 2000);
        // Remove control characters except newline
        // Actually, force everything to single line to avoid terminal truncation issues
        const safe = raw.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
        console.log(safe);
    } else {
        console.log('NOT FOUND');
    }
} catch (e) {
    console.log('ERROR: ' + e.message);
}
