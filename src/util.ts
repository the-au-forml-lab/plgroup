import fs from 'fs'
import {LOG_LEVEL, REQUEST} from './config.ts'; 

export const LogLv = {
    quiet: 0,
    error: 1,
    normal: 2,
    verbose: 3,
    debug: 4,
}

export function log(lv: number, ...s: any) {
    if(lv > LOG_LEVEL){
        return;
    }
    console.log(...s);
}
/**
 * This implementation of `LogLv` and `log` is a bit ugly, but
 * necessary so that the file compiles with the erasableSyntaxOnly
 * flag. Otherwise I would have used an enum. In future versions of
 * node, it may be possible to change this back to an enum. See the
 * nodejs documentation on the "--experimental-transform-types"
 * command line option.
 */

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
        const fileContents = JSON.stringify(obj);
        return FileSystem.writeFile(fileName, fileContents);
    }
}

export async function promiseAllSequential<T,U>(
    asyncFun: (_: T) => Promise<U>,
    inputs: T[],
    delay = REQUEST.API_CALL_DELAY,
): Promise<U[]> {
    const out: U[] = [];
    for (const input of inputs){
        out.push(await asyncFun(input));
        await sleep(delay);
    }
    return out;
}

export async function promiseAnySequential<T,U>(
    asyncFun: (_: T) => Promise<U>,
    inputs: T[],
) : Promise<U> {
    const errors: any[] = [];
    for(const t of inputs){
        try {
            return await asyncFun(t);
        } catch (err) {
            errors.push(err);
        }
    }
    throw new AggregateError(errors);
}
