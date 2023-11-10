import https from "https";
import {CONFIG} from "./config.js";

/**
 * TODO: to improve
 *    - this is a pretty hideous code block, make it more readable
 *    - it should handle path redirects, but it does not
 */

/**
 * GET response for some url.
 * This will follow (cross-domain) redirects.
 *
 * @param {string} url - the URL to read
 * @param {Object} headers - request headers (if any)
 * @returns {Promise<unknown>}
 */
export const readURL = (url, headers = {}) => {
    return new Promise((resolve, reject) => {
        const req = (reqUrl, redirs = 0) => {
            const {host, pathname: path} = new URL(reqUrl)
            https.request({host, path, ...headers}, response => {
                if (response.statusCode === 302) {
                    if (redirs > CONFIG.MAX_REDIRS)
                        reject('too many redirects')
                    else
                        // FYI, location could be a path,
                        // assuming here it is a full URL redirect
                        req(response.headers.location,
                            redirs + 1);
                } else {
                    let chunks = [];
                    response.on('data', chunk =>
                        chunks.push(chunk));
                    response.on('end', _ =>
                        resolve(Buffer.concat(chunks).toString()));
                }
            }).on('error', reject).end();
        };
        req(url)
    });
}
