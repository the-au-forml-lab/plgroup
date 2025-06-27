import fs from 'fs'
import {LOG_LEVEL, DEBUG_JSON} from './config.js';

export enum LogLv {
    quiet = 0,
    error,
    normal,
    verbose,
    debug,
}

export function log(lv: LogLv, ...s: any) {
    if(lv > LOG_LEVEL)
        return;
    console.log(...s);
}

export function sleep(ms: number){
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function spaceFix(s: string): string{
    return (s || '').replace(/\s+/g, ' ').trim();
}

/**
 * Randomize array in-place using Durstenfeld shuffle algorithm
 * credit: https://stackoverflow.com/a/12646864
 */
export function shuffle(xs: any[]){
    for (let i = xs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [xs[i], xs[j]] = [xs[j], xs[i]];
    }
}

export class FileSystem {
    static readFile(fileName: string): string {
        if (!fs.existsSync(fileName))
            return '';
        const content = (fs.readFileSync(fileName)) || '';
        return content.toString();
    }

    static readLines(fileName: string): string[] {
        return (FileSystem.readFile(fileName))
            .split('\n')
            .filter(w => w);
    }

    static writeFile(fileName: string, content: string): void {
        fs.writeFileSync(fileName, content, {encoding: 'utf8', flag: 'w'});
    }

    static append(fileName: string, content: string): void {
        fs.appendFileSync(fileName, `\n${content}`);
    }

    static loadJSON(fileName: string): any {
        try {
            return JSON.parse(FileSystem.readFile(fileName));
        } catch {
            return;
        }
    }

    static writeJSON(fileName: string, obj: any): void{
        const indent = DEBUG_JSON ? undefined : 0;
        const fileContents = JSON.stringify(obj, undefined, indent);
        FileSystem.writeFile(fileName, fileContents);
    }
}
