import https from 'https';
import {FILES as F, ACTIONS, XREF, DoiRE} from './config.js';
import {readLines, readFile, writeFile} from './helpers.js';
import {loadJson, append, hyperDOI} from './helpers.js';
import {metaK, DocKEYS} from './config.js';


/**
 * GET response for some url.
 * This will follow (cross-domain) redirects up to 20 times.
 *
 * @param {string} url - the URL to read
 * @param {Object} headers - request headers (if any)
 * @returns {Promise<unknown>}
 */
const readURL = (url, headers = {}) => {
    return new Promise((resolve, reject) => {
        const req = function (reqUrl, redirs = 0) {
            const {host, pathname: path} = new URL(reqUrl)
            https.request({host, path, ...headers},
                response => {
                    if (response.statusCode === 302) {
                        if (redirs > 20)
                            reject('too many redirects')
                        else
                            // FYI, location could be a path,
                            // assuming here it is a full URL redirect
                            req(response.headers.location,
                                redirs + 1);
                    } else {
                        let chunks = [];
                        response.on('data', chunks.push);
                        response.on('end', _ =>
                            resolve(Buffer.concat(chunks).toString()));
                    }
                }).on('error', reject).end();
        };
        req(url)
    });
}

/**
 * Get the paper details from the local dataset.
 * @param {string} doiURL - DOI to lookup.
 * @param {Object} papers - Papers dataset (optional)
 * @returns {Promise<*>}
 */
const getDesc = async (doiURL, papers = null) => {
    const src = papers || (await loadJson(F.PAPERS));
    return src[doiURL][metaK]
}

/**
 * Gets basic metadata (MLA citation) from some DOI over network.
 *
 * @param {string} doiUrl - DOI with domain, e.g. http:/doi.org/xyz/123
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
 * This method attempts to extract paper title and abstract.
 * @param {string} doiURL - DOI with domain, e.g. http:/doi.org/xyz/123
 * @returns {Promise<string>}
 */
const getDetails = async doiURL => {
    const mla = await getDesc(doiURL)
    const xmlAddr = XREF(new URL(doiURL).pathname.substring(1))
    const html = await readURL(xmlAddr)
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/)[1];
    let abs = doiURL
    let aIdx = html.indexOf("<jats:abstract")
    if (aIdx > 0) {
        const absETag = "</jats:abstract>"
        const absE = html.indexOf(absETag) - 1
        const absS = aIdx + html.substring(aIdx).indexOf(">") + 1
        abs = html.substring(absS, absE)
            .replace(/[^\S ]+/g, '')
            .replace(/<(\/?)jats:([a-z]+)>/g, '')
            .replace(/\s\s+/g, ' ').trim()
    }
    return [title, mla, abs].join('\n')
}

/**
 * Check is string matches any of bad keyword (stopword).
 * @param {string[]} words - Array of stopwords.
 * @param  {string} str - String to test.
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
 * Update the next paper selection, and capture this change in the
 * appropriate files.
 *
 * @param  {string} doi - The DOI of next paper.
 * @returns {Promise<void>}
 */
const setNext = async doi => {
    const meta = await getDetails(doi)
    writeFile(F.NEXT_FILE, doi)
    append(F.PAST_FILE, doi)
    writeFile(F.NEXT_DESC, meta)
}

/**
 * Crawl for papers for each URL in files/sources.txt.
 * At completion, this method will generate a dataset of papers.
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
                papers[doi][metaK] : (await getMeta(doi))
            const stopMatch = matchesStopWord(stop, meta)
            if (stopMatch && exists)
                delete papers[doi];
            else if (!stopMatch && !exists && meta)
                papers[doi] = {[metaK]: meta}
        }
    }
    writeFile(F.PAPERS, JSON.stringify(papers))
}

/**
 * Randomly choose next paper from the dataset.
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

const writeWeb = async () => {
    const pastPapers = await readLines(F.PAST_FILE);
    const papers = await loadJson(F.PAPERS);
    let web = await readFile(F.WEBPAGE);
    // update next paper details; must find the anchors
    const nextS = web.indexOf(DocKEYS.NEXT.START);
    const nextE = web.indexOf(DocKEYS.NEXT.END);
    const nextDOI = await readFile(F.NEXT_FILE);
    if (nextS > 0 && nextE > 0) {
        const nextDesc = hyperDOI(
            (await getDesc(nextDOI, papers)), nextDOI)
        web = [web.substring(0, nextS + DocKEYS.NEXT.START.length),
            nextDesc, web.substring(nextE)].join('\n');
    }
    // update the paper history
    const histS = web.indexOf(DocKEYS.HIST.START);
    const histE = web.indexOf(DocKEYS.HIST.END);
    if (histS > 0 && histE > 0) {
        let history = []
        const pp = pastPapers.filter(d => d !== nextDOI)
        for (let i = 0; i < pp.length; i++) {
            const meta = hyperDOI((await getDesc(pp[i], papers)), pp[i])
            history.unshift(`${pp.length - i}. ${meta}`)
        }
        web = [web.substring(0, histS + DocKEYS.HIST.START.length)]
            .concat(history).concat(web.substring(histE)).join('\n');
    }
    writeFile(F.WEBPAGE, web)
}

/**
 * Handle selected action (if recognizable); from process args.
 */
(_ => {
    const [action, param] = process.argv.slice(2);
    if (action === ACTIONS.FETCH) return findPapers()
    if (action === ACTIONS.CHOOSE) return chooseNext()
    if (action === ACTIONS.SET && param) return setNext(param)
    if (action === ACTIONS.WEB) return writeWeb()
    return console.log('Unknown action')
})();
