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
    const bib = exists ? papers[doiURL][KEYS.bib] :
        await (requestBib(doiURL))
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
    if (log) console.log(result)
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
 * Find DOI patterns at some webpage.
 *
 * @param pageURL -- full HTTP url of the page to crawl
 * @returns {Promise<*[String]>} -- llist of unique DOIs on that page.
 */
const extractDOIs = async pageURL => {
    let reMatch = (await readURL(pageURL))
        .matchAll(TextParser.DoiRE)
    return [...new Set(Array.from(reMatch, m => m[0]))]
}

/**
 * Build a dataset from a list of DOIs
 * @param DOIs - Dataset input DOIs
 * @returns {Promise<{}|*>} - Constructed dataset
 */
const buildDataset = async DOIs => {
    let papers = await FS.loadPapers()
    const stop = await FS.readLines(F.STOPWORDS);
    for (const doi of DOIs) {
        const paper = papers[doi]
        const mla = paper ? paper[KEYS.mla] : await requestCite(doi)
        const bib = paper ? paper[KEYS.bib] : await requestBib(doi)
        // basic sanity checks
        if (!TextParser.conference(bib) || matchesStopWord(stop, mla)) {
            if (paper) delete papers[doi]
        }
        // add to dataset
        else if (!paper && mla && bib)
            papers[doi] = {[KEYS.mla]: mla, [KEYS.bib]: bib}
    }
    return papers
}

/**
 * Crawl for papers for each URL in files/sources.txt.
 * At completion, this method has generated a dataset of papers.
 * @returns {Promise<void>}
 */
const findPapers = async () => {
    const sourceURLs = await FS.readLines(F.SOURCES);
    console.log('Searching in ', sourceURLs.length, 'source(s)')
    const DOIs = (await Promise.all(
        sourceURLs.map(async s => await extractDOIs(s)))).flat()
    console.log('Found', DOIs.length, 'papers, processing...')
    const papers = await buildDataset(DOIs)
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
 * Generate a  list of paper citations from a list of DOIs.
 *
 * This function takes a list of DOIs, then looks up the MLA citation
 * for each DOI, and returns a corresponding (optionally numbered)
 * string.
 *
 * @param numbered - number the entries.
 * @param DOIs - iterable of DOIs
 * @returns {Promise<string>}
 */
const paperList = async (numbered, ...DOIs) => {
    const papers = await FS.loadPapers()
    const queue = DOIs.filter(x => x).reverse()
    const entries = await Promise.all(
        queue.map(async (doi, index) => {
            const cite = papers[doi] ?
                papers[doi][KEYS.mla] : await requestCite(doi)
            const mla = TextParser.hyperDOI(
                TextParser.spaceFix(cite), doi)
            return numbered ? `${index + 1}. ${mla}` : mla
        }))
    return entries.join('\n');
}

/**
 * Update list of papers on the website.
 * @returns {Promise<void>}
 */
const writeWeb = async () => {
    const all = await FS.readLines(F.SEMESTER_PAPERS)
    const first = all.length > 0 ? all[all.length - 1] : null
    FS.writeFile(F.WEB_NEXT, await paperList(false, first))
    FS.writeFile(F.WEB_PAPERS, await paperList(true, ...all))
}

/**
 * Handle selected action
 */
(async _ => {
    const [action, param] = process.argv.slice(2);

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
            todo = (() => getDetails(param, false, true));
            break;
        default:
            todo = () => console.log('Unknown action')
    }

    await todo();
    process.exit()
})();
