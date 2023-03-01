import https from 'https';
import {FILES as F, ACTIONS, KEYS, CONFIG, XREF} from './config.js';
import {FileSystem as FS, TextParser} from './helpers.js';


/**
 * GET response for some url.
 * This will follow (cross-domain) redirects.
 *
 * @param {string} url - the URL to read
 * @param {Object} headers - request headers (if any)
 * @returns {Promise<unknown>}
 */
const readURL = (url, headers = {}) => {
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

/**
 * Gets basic metadata (MLA citation) from some DOI over network.
 *
 * @param {string} doiUrl - DOI with domain, e.g. http:/doi.org/xyz/123
 * @param {string} style - bibtex or mla
 * @returns {Promise<string>}
 */
const requestCite = async (doiUrl, style = 'mla') => {
    return (await readURL(doiUrl, {
        headers: {'Accept': `text/bibliography; style=${style}`}
    })).trim()
}

/**
 * Get Bibtex citation for a paper
 *
 * @param {string} doiUrl - DOI with domain, e.g. http:/doi.org/xyz/123
 * @returns {Promise<string>}
 */
const requestBib = async (doiUrl) =>
    requestCite(doiUrl, 'bibtex')


/**
 * This method attempts to extract paper title and abstract.
 * @param {string} doiURL - DOI with domain, e.g. http:/doi.org/xyz/123
 * @returns {Promise<string>}
 */
const getDetails = async doiURL => {
    const papers = (await FS.loadPapers());
    const xmlAddr = XREF(new URL(doiURL).pathname.substring(1))
    const html = await readURL(xmlAddr)
    const title = TextParser.title(papers[doiURL][KEYS.b])
    const abs = TextParser.abstract(html) || doiURL
    const mla = papers[doiURL][KEYS.m]
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
    FS.writeFile(F.NEXT_FILE, doi)
    FS.writeFile(F.NEXT_DESC, meta)
    FS.append(F.PAST_FILE, doi)
}

/**
 * Crawl for papers for each URL in files/sources.txt.
 * At completion, this method will generate a dataset of papers.
 * @returns {Promise<void>}
 */
const findPapers = async () => {
    let papers = await FS.loadPapers()
    const paperKeys = Object.keys(papers)
    const sources = await FS.readLines(F.SRC_FILE);
    const stop = await FS.readLines(F.STOPWORDS);
    let foundPapers = []
    console.log('Processing', sources.length, 'source(s)')
    for (const src of sources) {
        let rawResp = await readURL(src)
        let reMatch = rawResp.matchAll(TextParser.DoiRE)
        const DOIs = [...new Set(Array.from(reMatch, m => m[0]))]
        foundPapers = foundPapers.concat(DOIs);
    }
    console.log('Found', foundPapers.length, 'papers...')
    for (const doi of foundPapers) {
        const exists = paperKeys.includes(doi)
        const mla = exists ?
            papers[doi][KEYS.m] : (await requestCite(doi))
        const stopMatch = matchesStopWord(stop, mla)
        if (stopMatch) {
            if (exists) delete papers[doi];
            continue;
        }
        const bib = exists ?
            papers[doi][KEYS.b] : (await requestBib(doi))
        if (mla && bib)
            papers[doi] = {[KEYS.m]: mla, [KEYS.b]: bib}
    }
    FS.writeFile(F.PAPERS, JSON.stringify(papers))
    await stats()
}

/**
 * Display dataset paper counts by different conferences.
 * @returns {Promise<void>}
 */
const stats = async () => {
    const papers = Object.values(await FS.loadPapers());
    const nameFormat = name => (name.length < 20) ? name :
        name.split(' ').slice(1).slice(-5).join(' ')
    const freq = papers.map(
        ({[KEYS.b]: bib}) => bib).map(TextParser.conference)

    // group by name, count occurrence and sort DESC
    const confCounts = Object.entries(
        Object.fromEntries([...new Set(freq)].map(n =>
            [nameFormat(n), freq.filter(p => p === n).length])))
        .sort(([, a], [, b]) => b - a)

    for (const [name, count] of confCounts)
        console.log(count, `-- ${name}`);
    console.log('TOTAL: ', freq.length)
}

/**
 * Randomly choose next paper from the dataset.
 * @returns {Promise<void>}
 */
const chooseNext = async () => {
    const papers = await FS.loadPapers()
    const paperKeys = Object.keys(papers)
    const pastPapers = await FS.readFile(F.PAST_FILE);
    const stop = await FS.readLines(F.STOPWORDS);
    const selectable = paperKeys.filter(x =>
        pastPapers.indexOf(x) < 0 &&
        !matchesStopWord(stop, papers[x][KEYS.m]));
    if (!selectable.length) return console.log(
        'There are 0 papers available for selection :(');
    const index = Math.floor(Math.random() * selectable.length)
    const randDOI = selectable[index];
    await setNext(randDOI)
}

/**
 * Generate web page content from paper details.
 *
 * This function takes a list of DOIs, looks up the metadata for each
 * DOI, then add to the webpage between specified markers the list of
 * papers. If the markers are not found, it does nothing.
 *
 * @param web - web page content (HTML as a string).
 * @param keys - content start and end key markers.
 * @param numbered - number the entries.
 * @param DOIs - iterable of DOIs
 * @returns {Promise<string|*>}
 */
const updateWeb = async (web, keys, numbered, ...DOIs) => {
    const papers = await FS.loadPapers();
    const startIdx = web.indexOf(keys.START);
    const endIdx = web.indexOf(keys.END);
    if (startIdx < 0 || endIdx < 0) return web;
    const prefix = web.substring(0, startIdx + keys.START.length)
    const postfix = web.substring(endIdx)
    let queue = [...DOIs], entries = [];
    while (queue.length) {
        const doi = queue.shift()
        const mla = TextParser.hyperDOI(papers[doi][KEYS.m], doi)
        const entry = numbered ? `${queue.length + 1}. ${mla}` : mla
        entries.unshift(entry)
    }
    return [prefix, ...entries, postfix].join('\n');
}

/**
 * Update list of papers on the website.
 * @returns {Promise<void>}
 */
const writeWeb = async () => {
    const pastPapers = await FS.readLines(F.PAST_FILE);
    const nxt = await FS.readFile(F.NEXT_FILE);
    const pp = pastPapers.filter(d => d !== nxt)
    let web = await FS.readFile(F.WEBPAGE);
    web = await updateWeb(web, KEYS.NEXT, false, nxt)
    web = await updateWeb(web, KEYS.HIST, true, ...pp)
    FS.writeFile(F.WEBPAGE, web)
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
    if (action === ACTIONS.STATS) return stats()
    if (action === ACTIONS.DETAILS && param)
        return getDetails(param).then(console.log)
    return console.log('Unknown action')
})();
