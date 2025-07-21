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

/**
 * This implementation of `LogLv` and `log` is a bit ugly, but
 * necessary so that the file compiles with the erasableSyntaxOnly
 * flag. Otherwise I would have used an enum. In future versions of
 * node, it may be possible to change this back to an enum. See the
 * nodejs documentation on the "--experimental-transform-types"
 * command line option.
 */
export function log(lv: number, ...args: any) {
    if(lv > LOG.LEVEL){
        return;
    }
    console.log(...args);
    const s = util.format(...args);
    return FileSystem.append(LOG.FILE, s);
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function spaceFix(s: string): string{
    return (s || '').replace(/\s+/g, ' ').trim();
}

export function shuffle<T>(xs: T[]): T[] {
    /**
     * Randomize array in-place using Durstenfeld shuffle algorithm.
     * Also returns a reference to the array, like most array methods.
     * credit: https://stackoverflow.com/a/12646864
     */
    for (let i = xs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [xs[i], xs[j]] = [xs[j], xs[i]];
    }
    return xs;
}

export class FileSystem {
    static async readFile(fileName: string): Promise<string> {
        if (!fs.existsSync(fileName)){
            throw new Error(`File ${fileName} does not exits.`);
        }
        return (await fs.promises.readFile(fileName)).toString();
    }

    static async readLines(fileName: string): Promise<string[]> {
        return (await FileSystem.readFile(fileName))
            .split('\n')
            .filter(w => w);
    }

    static writeFile(fileName: string, content: string): Promise<void> {
        return fs.promises.writeFile(
            fileName, content, {encoding: 'utf8', flag: 'w'}
        );
    }

    static append(fileName: string, content: string): Promise<void> {
        return fs.promises.appendFile(fileName, `\n${content}`);
    }

    static async loadJSON(fileName: string){
        try {
            return JSON.parse(await FileSystem.readFile(fileName));
        } catch (err) {
            throw new Error(`Failed to parse JSON from file ${fileName}:\n${err}`);
        }
    }

    static writeJSON(fileName: string, obj: any): Promise<void>{
        return FileSystem.writeFile(fileName, JSON.stringify(obj));
    }
}
