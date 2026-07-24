import fs from 'fs';
import path from 'path';

const replacements = {
    "'brand.darkPub'": "'brand.pageBg'",
    '"brand.darkPub"': '"brand.pageBg"',
    "'brand.woodDark'": "'brand.cardBg'",
    '"brand.woodDark"': '"brand.cardBg"',
    "'brand.woodMid'": "'brand.cardBgAlt'",
    '"brand.woodMid"': '"brand.cardBgAlt"',
    "'brand.text'": "'brand.textMain'",
    '"brand.text"': '"brand.textMain"',
    "'brand.textMuted'": "'brand.textMutedToken'",
    '"brand.textMuted"': '"brand.textMutedToken"',
};

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
    let newContent = content;
    for (const [oldVal, newVal] of Object.entries(replacements)) {
        newContent = newContent.split(oldVal).join(newVal);
    }
    if (newContent !== content) {
        fs.writeFileSync(filepath, newContent, 'utf8');
        console.log(`Updated ${filepath}`);
    }
});
