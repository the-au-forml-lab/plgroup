import fs from 'fs';
import util from 'util';
import {LOG} from './config.ts'; 

export const LogLv = {
    quiet: 0,
    error: 1,
    normal: 2,
    verbose: 3,
    debug: 4,
}

// This implementation of `LogLv` and `log` is a bit ugly, but
// necessary so that the file compiles with the erasableSyntaxOnly
// flag. Otherwise I would have used an enum. In future versions of
// node, it may be possible to change this back to an enum. See the
// nodejs documentation on the "--experimental-transform-types"
// command line option.

export function log(lv: number, ...args: any): void {
    if(lv > LOG.LEVEL) {
        return;
    }
    console.log(...args);
    const s = util.format(...args);
    if(LOG.WRITE_FILE){
        FileSystem.append(LOG.FILE, s);
    }
    return;
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function spaceFix(s: string): string {
    return (s || '').replace(/\s+/g, ' ').trim();
}

export function shuffle<T>(xs: T[]): T[] {
    // Randomize array in-place using Durstenfeld shuffle algorithm.
    // Also returns a reference to the array, like most array methods.
    // credit: https://stackoverflow.com/a/12646864
    for (let i = xs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [xs[i], xs[j]] = [xs[j], xs[i]];
    }
    return xs;
}

export class FileSystem {
    static readFile(fileName: string): string {
        if (!fs.existsSync(fileName)) {
            throw new Error(`File ${fileName} does not exits.`);
        }
        return fs.readFileSync(fileName).toString();
    }

    static readLines(fileName: string): string[] {
        return FileSystem.readFile(fileName)
            .split('\n')
            .filter(w => w);
    }

    static writeFile(fileName: string, content: string): void {
        fs.writeFileSync(fileName, content, {encoding: 'utf8', flag: 'w'});
    }

    static append(fileName: string, content: string): void {
        fs.appendFileSync(fileName, `\n${content}`);
    }

    static writeLines(fileName: string, lines: string[]): void {
        FileSystem.writeFile(fileName, lines.join('\n') + '\n');
        // add a trailing newline since most tools expect one
    }

    static loadJSON(fileName: string) {
        try {
            return JSON.parse(FileSystem.readFile(fileName));
        } catch (e) {
            log(LogLv.error, `Failed to parse JSON from file ${fileName}`);
            throw e;
        }
    }

    static writeJSON(fileName: string, obj: any): void {
        return FileSystem.writeFile(fileName, JSON.stringify(obj));
    }
}

export function all(xs: boolean[]): boolean {
    return xs.reduce((acc, x) => acc && x, true);
}

type PromiseAllSplit<T> = Promise<{fulfilled : T[], rejected: any[]}>;
export async function promiseAllSettledSplit<T>(
    promises: Array<Promise<T>>
): PromiseAllSplit<T> {
    const settled = await Promise.allSettled(promises);
    const fulfilled: T[] = [];
    const rejected: any[] = [];
    for(const s of settled){
        if(s.status === 'fulfilled'){
            fulfilled.push(s.value);
        } else {
            rejected.push(s.reason);
        }
    }
    return {fulfilled, rejected};
}

export function localTimeString(){
    const date = new Date();
    const [year, month, day, hour, minutes, seconds] =
        [ date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          date.getHours(),
          date.getMinutes(),
          date.getSeconds(),
        ];
    return `${year}-${month}-${day}T${hour}.${minutes}.${seconds}`;
}
