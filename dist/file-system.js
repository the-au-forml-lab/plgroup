import fs from 'fs';
export class FileSystem {
    // read contents of a file as  a string
    static readFile(fileName) {
        if (!fs.existsSync(fileName))
            return '';
        const content = (fs.readFileSync(fileName)) || '';
        return content.toString();
    }
    // read a file and return its non-empty lines as an array of strings
    static readLines(fileName) {
        return (FileSystem.readFile(fileName))
            .split('\n')
            .filter(w => w); // removes the empty lines.
    }
    // write some text to a file, overwriting the previous file
    static writeFile(fileName, content) {
        fs.writeFileSync(fileName, content, { encoding: 'utf8', flag: 'w' });
    }
    // append some text to a file on a new line
    static append(fileName, content) {
        fs.appendFileSync(fileName, `\n${content}`);
    }
    static loadJSON(fileName) {
        try {
            return JSON.parse(FileSystem.readFile(fileName));
        }
        catch {
            return;
        }
    }
}
