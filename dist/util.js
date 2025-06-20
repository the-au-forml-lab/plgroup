import { LOG_LEVEL, FILES as F } from './config.js';
import { FileSystem as FS } from './file-system.js';
export var LogLv;
(function (LogLv) {
    LogLv[LogLv["quiet"] = 0] = "quiet";
    LogLv[LogLv["error"] = 1] = "error";
    LogLv[LogLv["normal"] = 2] = "normal";
    LogLv[LogLv["verbose"] = 3] = "verbose";
    LogLv[LogLv["debug"] = 4] = "debug";
})(LogLv || (LogLv = {}));
export function log(lv, s) {
    if (lv > LOG_LEVEL)
        return;
    console.log(s);
    FS.append(F.LOG, s);
}
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export function JSON_pretty(x) {
    return JSON.stringify(x, null, 2);
}
export function spaceFix(s) {
    return (s || '').replace(/\s+/g, ' ').trim();
}
/**
 *  Randomize array in-place using Durstenfeld shuffle algorithm
 *  credit: https://stackoverflow.com/a/12646864
 */
export function shuffle(xs) {
    for (let i = xs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [xs[i], xs[j]] = [xs[j], xs[i]];
    }
}
