import {CONFIG, FILES as F} from './config.js';

export enum LogLv {
    quiet = 0,
    error,
    normal,
    verbose,
    debug,
}

export function log(lv: LogLv, ...s: any) {
    if(lv > CONFIG.LOG_LEVEL)
        return;
    console.log(...s);
}

export function sleep(ms: number){
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function JSON_pretty(x: any): string{
    return JSON.stringify(x, null, 2);
}

export function spaceFix(s: string): string{
    return (s || '').replace(/\s+/g, ' ').trim();
}

/**
 *  Randomize array in-place using Durstenfeld shuffle algorithm
 *  credit: https://stackoverflow.com/a/12646864
 */
export function shuffle(xs: any[]){
    for (let i = xs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [xs[i], xs[j]] = [xs[j], xs[i]];
    }
}
