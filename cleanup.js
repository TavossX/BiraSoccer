import fs from 'fs';
import path from 'path';

function walkSync(dir, callback) {
    fs.readdirSync(dir).forEach(file => {
        let filepath = path.join(dir, file);
        let stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            walkSync(filepath, callback);
        } else if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
            callback(filepath);
        }
    });
}

walkSync('./src', (filepath) => {
    let content = fs.readFileSync(filepath, 'utf8');
    let original = content;

    // Remove textShadow
    content = content.replace(/textShadow="[^"]*"/g, '');
    
    // Replace borderRadius="0" with borderRadius="md"
    content = content.replace(/borderRadius=(?:'0'|"0"|{[^}]+'0'[^}]+})/g, 'borderRadius="md"');
    
    // Replace hard shadows
    content = content.replace(/boxShadow={?['"][^"']*(?:4px 4px|2px 2px|3px 3px|6px 6px)[^"']*['"]}?/g, 'boxShadow="md"');
    
    // Remove inline brand colors (mustard, orange, darkPub, woodDark)
    content = content.replace(/color={?['"]brand\.[a-zA-Z]+['"]}?/g, '');
    content = content.replace(/bg={?['"]brand\.[a-zA-Z]+['"]}?/g, '');
    content = content.replace(/borderColor={?['"]brand\.[a-zA-Z]+['"]}?/g, '');
    
    // Remove border="2px solid" 
    content = content.replace(/border="2px solid"/g, '');
    
    // Remove specific literal colors like #1A0A05, #2D1A13, #FDBB00, #F94A29
    content = content.replace(/bg="#2D1A13"/g, '');
    content = content.replace(/bg="#1A0A05"/g, '');
    content = content.replace(/color="#F5DEB3"/g, '');
    content = content.replace(/borderColor={formato === val \? '#F94A29' : '#000'}/g, "borderColor={formato === val ? 'brand.500' : 'gray.200'} _dark={{ borderColor: formato === val ? 'brand.500' : 'gray.700' }}");
    
    // Clean up empty props
    content = content.replace(/ \w+="" /g, ' ');

    if (content !== original) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Cleaned ${filepath}`);
    }
});
