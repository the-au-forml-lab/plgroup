import https from 'https';
import {FILES as F, ACTIONS, DoiRE} from './config.js';
import {
    readLines,
    readFile,
    writeFile,
    loadJson,
    append
} from './helpers.js';


/**
 * Key for accessing paper metadata (in papers dataset).
 * @constant
 * @type {string}
 */
export const metaKey = 'mla'

/**
 * GET response for some url.
 * This will follow redirects up to 20 times.
 *
 * @param url - the URL to read
 * @param headers - request headers (if any)
 * @returns {Promise<unknown>}
 */
const readURL = (url, headers = {}) => {
    return new Promise((resolve, reject) => {
        const req = function (reqUrl, counter = 0) {
            const {host, pathname} = new URL(reqUrl)
            const options = {
                host, path: pathname, method: 'GET', ...headers
            }
            https.request(options, response => {
                if (response.statusCode === 302) {
                    if (counter < 20)
                        req(response.headers.location,
                            counter + 1);
                    else
                        reject('too many redirects')
                } else {
                    let chunks = [];
                    response.on('data', chunk => {
                        chunks.push(chunk);
                    });
                    response.on('end', _ => resolve(
                        Buffer.concat(chunks).toString()));
                }
            }).on('error', reject).end();
        };
        req(url)
    });
}

/**
 * Gets basic metadata (MLA citation) from some DOI
 * @param doiUrl - DOI with domain, e.g. http:/doi.org/xyz/123
 * @returns {Promise<string>}
 */
const getMeta = async doiUrl => {
    return (await readURL(doiUrl, {
        headers: {
            'Accept': 'text/bibliography; style=mla'
        }
    })).trim()
}

/**
 * Check is string matches any of bad keyword (stopword).
 * @param words - Array of stopwords.
 * @param str - String to test.
 * @returns {boolean} - True if match exists.
 */
const matchesStopWord = (words, str) => {
    for (let i = 0; i < words.length; i++) {
        const exp = new RegExp(words[i], 'gmi');
        if (exp.test(str)) return true;
    }
    return false
}

/**
 * Update the next paper selection
 * @param doi - The DOI of next paper.
 * @returns {Promise<void>}
 */
const setNext = async doi => {
    const meta = await getMeta(doi)
    writeFile(F.NEXT_FILE, doi)
    append(F.PAST_FILE, doi)
    writeFile(F.NEXT_DESC, meta)
}

/**
 * Crawl for papers for each URL in files/sources.txt
 * @returns {Promise<void>}
 */
const findPapers = async () => {
    let papers = await loadJson(F.PAPERS);
    const sources = await readLines(F.SRC_FILE);
    const stop = await readLines(F.STOPWORDS);
    for (const src of sources) {
        let rawResp = await readURL(src)
        let foundPapers = [...new Set(Array.from(
            rawResp.matchAll(DoiRE), m => m[0]))];
        for (let i = 0; i < foundPapers.length; i++) {
            const doi = foundPapers[i]
            const exists = Object.keys(papers).indexOf(doi) >= 0
            const meta = exists ?
                papers[doi][metaKey] : (await getMeta(doi))
            const stopMatch = matchesStopWord(stop, meta)
            if (stopMatch && exists)
                delete papers[doi];
            else if (!stopMatch && !exists && meta)
                papers[doi] = {[metaKey]: meta}
        }
    }
    writeFile(F.PAPERS, JSON.stringify(papers))
}

/**
 * Randomly choose next paper
 * @returns {Promise<void>}
 */
const chooseNext = async () => {
    const paperKeys = Object.keys(await loadJson(F.PAPERS))
    const pastPapers = await readFile(F.PAST_FILE);
    const selectable = paperKeys.filter(
        x => pastPapers.indexOf(x) < 0);
    const randDOI = selectable[Math.floor(
        Math.random() * selectable.length)];
    await setNext(randDOI)
}

/**
 * Handle selected action (if recognizable); from process args.
 */
(_ => {
    const [action, param] = process.argv.slice(2);
    if (action === ACTIONS.FETCH) return findPapers()
    if (action === ACTIONS.CHOOSE) return chooseNext()
    if (action === ACTIONS.SET && param) return setNext(param)
    return console.log('Unknown action')
})();
