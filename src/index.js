import {ACTIONS, CONFIG, FILES as F, KEYS, XREF} from './config.js';
import {FileSystem as FS, shuffle, TextParser} from './helpers.js';
import {readURL} from "./request.js";


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
 * This method attempts to extract paper title, abstract, and citation in
 * MLA format.
 * @param {string} doi - DOI without domain, e.g. 10.1093/ajae/aaq063
 * @param {boolean} additive - set True to add to database if not exists.
 * @param {boolean} log - output the details
 * @returns {Promise<string>}
 */
const getDetails = async (
    doi, additive = false, log = false) => {
    const papers = await FS.loadPapers();
    const doiURL = `${CONFIG.DOI_ORG_DOMAIN}/${doi}`
    const exists = Object.keys(papers).includes(doi)
    const bib = await (exists ? papers[doiURL][KEYS.bib] :
        requestBib(doiURL))
    const title = TextParser.title(bib)
    const html = await readURL(XREF(doi))
    const abs = TextParser.abstract(html) || doiURL
    const mla = TextParser.spaceFix(exists ?
        papers[doiURL][KEYS.mla] : await requestCite(doiURL))
    if (additive && !exists) {
        papers[doiURL] = {[KEYS.mla]: mla, [KEYS.bib]: bib}
        FS.writeFile(F.PAPERS, JSON.stringify(papers))
    }
    const result = [title, mla, abs].join('\n')
    if (log) console.log('Details\n\n', result)
    return result
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
 * @param  {string} doi - The DOI of next paper, without domain.
 * @returns {Promise<void>}
 */
const setNext = async doi => {
    const doiURL = `${CONFIG.DOI_ORG_DOMAIN}/${doi}`
    const meta = await getDetails(doi, true)
    FS.writeFile(F.NEXT_DESC, meta)
    FS.writeFile(F.NEXT_FILE, doiURL)
    FS.append(F.SEMESTER_PAPERS, doiURL)
    FS.append(F.ALLTIME_HISTORY, doiURL)
}

/**
 * Crawl for papers for each URL in files/sources.txt.
 * At completion, this method will generate a dataset of papers.
 * @returns {Promise<void>}
 */
const findPapers = async () => {
    let papers = await FS.loadPapers()
    const paperKeys = Object.keys(papers)
    const sources = await FS.readLines(F.SOURCES);
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
            papers[doi][KEYS.mla] : (await requestCite(doi))
        const stopMatch = matchesStopWord(stop, mla)
        if (stopMatch) {
            if (exists) delete papers[doi];
            continue;
        }
        const bib = exists ?
            papers[doi][KEYS.bib] : (await requestBib(doi))
        const knownConf = TextParser.conference(bib)
        if (!knownConf && exists) delete papers[doi]
        else if (mla && bib && knownConf)
            papers[doi] = {[KEYS.mla]: mla, [KEYS.bib]: bib}
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
            .replace(/^(on )/, "");
    const freq = papers.map(
        ({[KEYS.bib]: bib}) => bib).map(TextParser.conference)

    // group by name, count occurrence and sort DESC
    const confCounts = Object.entries(Object.fromEntries(
        [...new Set(freq)].map(n => [n ? nameFormat(n) : n,
            freq.filter(p => p === n).length])))
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
    const pastPapers = await FS.readFile(F.ALLTIME_HISTORY);
    const stop = await FS.readLines(F.STOPWORDS);
    const selectable = paperKeys.filter(x =>
        pastPapers.indexOf(x) < 0 &&
        !matchesStopWord(stop, papers[x][KEYS.mla]));
    if (!selectable.length) return console.log(
        'There are 0 papers available for selection :(');
    shuffle(selectable)
    const index = Math.floor(Math.random() * selectable.length)
    const randDOI = selectable[index];
    const doiOnly = new URL(randDOI).pathname.substring(1)
    await setNext(doiOnly)
}

/**
 * Generate web page content from paper details.
 *
 * This function takes a list of DOIs, then looks up the metadata
 * for each DOI and returns a corresponding string.
 *
 * @param numbered - number the entries.
 * @param DOIs - iterable of DOIs
 * @returns {Promise<string>}
 */
const updateWeb = async (numbered, ...DOIs) => {
    const papers = await FS.loadPapers();
    let queue = [...DOIs.reverse()], entries = [];
    while (queue.length) {
        const doi = queue.shift()
        if (!doi) {
            console.log('not found', doi)
            continue
        }
        const plain_mla = papers[doi] ?
            papers[doi][KEYS.mla] : (await requestCite(doi))
        const mla = TextParser.hyperDOI(plain_mla, doi)
        const entry = numbered ? `${queue.length + 1}. ${mla}` : mla
        entries.unshift(entry)
    }
    return entries.join('\n');
}

/**
 * Update list of papers on the website.
 * @returns {Promise<void>}
 */
const writeWeb = async () => {
    const all = await FS.readLines(F.SEMESTER_PAPERS)
    const first = all.length > 0 ? all[all.length - 1] : null
    FS.writeFile(F.WEB_NEXT, await updateWeb(false, first))
    FS.writeFile(F.WEB_PAPERS, await updateWeb(true, ...all))
}

/**
 * Handle selected action
 */
(async _ => {
    /* get process args */
    const [action, param] = process.argv.slice(2);

    /* determine the appropriate action */
    let todo;
    switch (action) {
        case(ACTIONS.UPDATE):
            todo = findPapers;
            break;
        case(ACTIONS.CHOOSE):
            todo = chooseNext;
            break;
        case (ACTIONS.SET):
            todo = (() => setNext(param));
            break;
        case (ACTIONS.WEB):
            todo = writeWeb;
            break;
        case (ACTIONS.STATS):
            todo = stats;
            break;
        case (ACTIONS.DETAILS):
            todo = (() =>
                getDetails(param, false, true));
            break;
        default:
            todo = () => console.log('Unknown action')
    }

    await todo();
    process.exit()
})();
