import https from 'https';
import { log, LogLv as LogLv } from './util.js';
import { MAX_REDIRECTS } from './config.js';
export function readURL(url, headers = {}) {
    if (typeof (url) === 'string') {
        url = new URL(url);
    }
    log(LogLv.debug, `fetching ${url}`);
    return new Promise((resolve, reject) => {
        const req = (v, redirects = 0) => {
            https.get(v, { headers }, res => {
                if (res.statusCode === 302) {
                    if (redirects < MAX_REDIRECTS) {
                        const newUrl = URL.parse(res.headers.location, url);
                        log(LogLv.debug, `... redirecting to ${newUrl}`);
                        req(newUrl, redirects + 1);
                    }
                    else {
                        log(LogLv.error, `too many redirects from ${url}`);
                        reject('too many redirects');
                    }
                }
                else if (200 <= res.statusCode && res.statusCode < 300) {
                    log(LogLv.debug, `... retrieved ${v}`);
                    const chunks = [];
                    res.on('data', chunk => chunks.push(chunk));
                    res.on('end', () => {
                        resolve(Buffer.concat(chunks).toString());
                    });
                }
                else {
                    log(LogLv.error, `Retrieval from ${v} failed with status code ${res.statusCode}`);
                    reject();
                }
            });
        };
        req(url);
    });
}
