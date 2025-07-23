import https from 'https';
import {type OutgoingHttpHeaders} from 'http';
import {log, LogLv} from './util.ts';
import {REQUEST} from './config.ts';

export type Headers = OutgoingHttpHeaders;

type RequestTarget = string | URL;

export function readUrl(url: RequestTarget, headers: Headers={}): Promise<string> {
    if(typeof(url) === 'string'){
        url = new URL(url);
    }
    log(LogLv.debug, `fetching ${url}`);
    return new Promise((resolve, reject) => {
        const req = (v: URL, redirects: number = 0) => {
            https.get(v, {headers, timeout: REQUEST.TIMEOUT_DELAY}, res => {
                if(res.statusCode === 302){
                    if(redirects < REQUEST.MAX_REDIRECTS){
                        const newUrl = URL.parse(res.headers.location!, url);
                        log(LogLv.debug, `... redirecting to ${newUrl}`);
                        req(newUrl!, redirects+1);
                    } else {
                        reject(new Error(`too many redirects from ${url}`));
                    }
                } else if(200 <= res.statusCode! && res.statusCode! < 300){
                    log(LogLv.debug, `... retrieved ${v}`);
                    const chunks: any[] = [];
                    res.on('data', chunk => chunks.push(chunk));
                    res.on('end', () => {
                        resolve(Buffer.concat(chunks).toString());
                    })
                } else {
                    reject(new Error(`Retrieval from ${url} failed with status code ${res.statusCode}`));
                }
            });
        };
        req(url);
    });
}
