
const fs = require('fs');
const path = require('path');

try {
    const content = fs.readFileSync('debug_api_error.log', 'utf16le');
    const index = content.indexOf('FULL ERROR DETAILS:');
    if (index !== -1) {
        const errorBlock = content.substring(index, index + 2000); // Read 2000 chars
        console.log(errorBlock);
    } else {
        console.log('Error marker not found');
    }
} catch (e) {
    console.error(e);
}
