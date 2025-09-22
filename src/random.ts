import { groupBy } from './util.ts';

export function random(n: number): number{
    // pick a random number in [0, n).
    return Math.floor(Math.random() * n);
}

export function pickN<T>(n: number, ts: T[]): T[] {
    if(n > ts.length){
        throw new Error(`Attempting to pick ${n} elements from array of size ${ts.length}`);
    }
    for(let i = ts.length - 1; i >= ts.length - n; --i){
        const j = random(i + 1);
        [ts[i], ts[j]] = [ts[j], ts[i]];
    }
    return ts.slice(-n);
}

export function pick<T>(ts: T[]): T{
    if(ts.length === 0){
        throw new Error('Attempting to pick from empty array');
    }
    const index = random(ts.length);
    return ts[index];
}

export function pickNKey<T>(n: number, ts: T[], key: (t: T) => string): T[]{
    const groups = groupBy(ts, key);
    const picked_groups = pickN(n, groups);
    return picked_groups.map(g => pick(g));
}

export function shuffle<T>(xs: T[]): T[] {
    // Randomize array in-place using Durstenfeld shuffle algorithm.
    // Also returns a reference to the array, like most array methods.
    // credit: https://stackoverflow.com/a/12646864
    for (let i = xs.length - 1; i > 0; i--) {
        const j = random(i + 1);
        [xs[i], xs[j]] = [xs[j], xs[i]];
    }
    return xs;
}
