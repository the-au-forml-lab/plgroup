import {readLines, readFile, writeFile, loadJson, appendLine} from './helpers.js';
import {FILES as F, ACTIONS} from './config.js';
import https from 'https';

/**
 * Regular expression to match DOI urls.
 * @type {RegExp}
 */
const DOI_RE = /https?:\/\/(www\.|)?doi\.org\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/g

/**
 * Key for accessing paper metadata (in papers dataset).
 * @constant
 * @type {string}
 */
export const metaKey = 'mla'

const readURL = (initUrl, headers = {}) => {
    return new Promise((resolve, reject) => {
        const req = function (url, counter = 0) {
            const {host, pathname} = new URL(url)
            const options = {
                host, path: pathname, method: 'GET', ...headers}
            https.request(options, response => {
                if (response.statusCode === 302) {
                    if (counter < 20)
                        req(response.headers.location,
                            counter + 1);
                    else reject('too many redirects')
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
        req(initUrl)
    });
}

const getMeta = async doiUrl => {
    return (await readURL(doiUrl,
        {headers: {
            'Accept': 'text/bibliography; style=mla'
        }}
    )).trim()
}

const matchesStopWord = (words, str) => {
    for (let i = 0; i < words.length; i++) {
        const exp = new RegExp(words[i], 'gmi');
        if (exp.test(str)) return true;
    }
    return false
}

const setNext = async doi => {
    const meta = await getMeta(doi)
    writeFile(F.NEXT_FILE, doi)
    appendLine(F.PAST_FILE, doi)
    writeFile(F.NEXT_DESC, meta)
}

const findPapers = async _ => {
    let papers = await loadJson(F.PAPERS);
    const sources = await readLines(F.SRC_FILE);
    const stop = await readLines(F.STOPWORDS);
    for (const src of sources) {
        let rawResp = await readURL(src)
        let foundPapers = Array.from(
            rawResp.matchAll(DOI_RE), m => m[0]);
        for (let i = 0; i < foundPapers.length; i++) {
            const doi = foundPapers[i]
            if (Object.keys(papers).indexOf(doi) > -1) {
                if (matchesStopWord(stop, papers[doi][metaKey]))
                    delete papers[doi]
                continue;
            }
            const meta = await getMeta(doi)
            if (meta && !matchesStopWord(stop, meta))
                papers[doi] = {metaKey: meta}
        }
    }
    writeFile(F.PAPERS, JSON.stringify(papers))
}

const chooseNext = async () => {
    const paperKeys = Object.keys(await loadJson(F.PAPERS))
    const pastPapers = await readFile(F.PAST_FILE);
    const selectable = paperKeys.filter(
        x => pastPapers.indexOf(x) < 0);
    const randDOI = selectable[Math.floor(
        Math.random() * selectable.length)];
    await setNext(randDOI)
}

(() => {
    const [action, param] = process.argv.slice(2);
    if (action === ACTIONS.FETCH) return findPapers()
    if (action === ACTIONS.CHOOSE) return chooseNext()
    if (action === ACTIONS.SET && param) return setNext(param)
    return console.log('Unknown action')
})();
