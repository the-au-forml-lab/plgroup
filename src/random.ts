
export function random(n: number): number{
    // pick a random number in [0, n).
    return Math.floor(Math.random() * n);
}

export function pickN<T>(n: number, xs: T[]): T[] {
    if(n > xs.length){
        throw new Error(`Attempting to pick ${n} elements from array of size ${xs.length}`);
    }
    for(let i = xs.length - 1; i >= xs.length - n; --i){
        const j = random(i + 1);
        [xs[i], xs[j]] = [xs[j], xs[i]];
    }
    return xs.slice(-n);
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
