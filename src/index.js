import {ACTIONS, CONFIG, FILES as F, KEYS, XREF} from './config.js';
import {FileSystem as FS, shuffle, TextParser} from './helpers.js';
import {readURL} from "./request.js";


/**
 * Request basic metadata (MLA citation) from some DOI.
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
 * Request Bibtex citation for a paper
 *
 * @param {string} doiUrl - DOI with domain, e.g. http:/doi.org/xyz/123
 * @returns {Promise<string>}
 */
const requestBib = async (doiUrl) =>
    requestCite(doiUrl, 'bibtex')

/**
 * Get bib and MLA format references for some paper, by DOI.
 *
 * @param papers - local set of papers; if the paper exists locally
 * the returned values will come from the local data.
 * @param doiURL - DOI url of interest.
 * @returns {Promise<(Object|string)[]>} [bib, MLA] for the given DOI.
 */
const getRefs = async (papers, doiURL) => {
    const paper = papers[doiURL]
    const mla = paper ? paper[KEYS.mla] : await requestCite(doiURL)
    const bib = paper ? paper[KEYS.bib] : await requestBib(doiURL)
    return [bib, TextParser.spaceFix(mla)]
}


/**
 * This method attempts to extract paper title, abstract, and citation
 * in MLA format.
 *
 * @param {string} doi - DOI without domain, e.g. 10.1093/aaq063
 * @param {boolean} additive - set True to add entry to database,
 * if it does not already exist.
 * @param {boolean} log - output the details
 * @returns {Promise<string>}
 */
const getDetails = async (
    doi, additive = false, log = false
) => {
    const papers = await FS.loadPapers();
    const doiURL = `${CONFIG.DOI_ORG_DOMAIN}/${doi}`
    const exists = Object.keys(papers).includes(doi)
    const [bib, mla] = await getRefs(papers, doiURL)
    const title = TextParser.title(bib)
    const html = await readURL(XREF(doi))
    const abs = TextParser.abstract(html) || doiURL
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
 *
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
 * Find DOI patterns on some webpage.
 *
 * @param pageAddress -- full HTTP url of the page to crawl -or- a filepath.
 * @returns {Promise<*[String]>} -- list of unique DOIs found.
 */
const extractDOIs = async pageAddress => {
    const fetchSource = pageAddress.startsWith("http") ?
        () => readURL(pageAddress) : () => FS.readFile(pageAddress)
    const regData = await fetchSource(pageAddress)
    let reMatch = regData.matchAll(TextParser.DoiRE)
    return [...new Set(Array.from(reMatch, m => m[0]))]
}

/**
 * Build a dataset from a list of DOIs.
 *
 * @param DOIs - Dataset input DOIs
 * @returns {Promise<{}|*>} - Constructed dataset
 */
const buildDataset = async DOIs => {
    let papers = await FS.loadPapers()
    const stop = await FS.readLines(F.STOPWORDS);
    for (const doi of DOIs) {
        const [bib, mla] = await getRefs(papers, doi)
        // basic sanity checks
        if (!TextParser.conference(bib) || matchesStopWord(stop, mla)) {
            if (papers[doi]) delete papers[doi]
        }
        // add to dataset
        else if (!papers[doi] && mla && bib)
            papers[doi] = {[KEYS.mla]: mla, [KEYS.bib]: bib}
    }
    return papers
}

/**
 * Crawl for papers for each URL in files/sources.txt.
 * At completion, this method has generated a dataset of papers and
 * displays data set statistics.
 * @returns {Promise<void>}
 */
const findPapers = async () => {
    const sourceURLs = await FS.readLines(F.SOURCES);
    console.log('Searching in', sourceURLs.length, 'source(s)')
    const DOIs = (await Promise.all(
        sourceURLs.map(async s => await extractDOIs(s)))).flat()
    console.log('Found', DOIs.length, 'papers, processing...')
    const papers = await buildDataset(DOIs)
    FS.writeFile(F.PAPERS, JSON.stringify(papers))
    await stats()
}

/**
 * Display dataset paper counts grouped by different conferences.
 * @returns {Promise<void>}
 */
const stats = async () => {
    const papers = Object.values(await FS.loadPapers());

    // extract conference name only, from each paper, into a list
    const confNames = papers.map(({[KEYS.bib]: bib}) => bib)
        .map(TextParser.conference)
    const uniqueNames = [...new Set(confNames)]

    // count conference name occurrences, sort high to low
    const confFreq = uniqueNames.map(n =>
        [confNames.filter(p => p === n).length, n])
        .sort(([a,], [b,]) => b - a)

    // display
    for (const [count, name] of confFreq)
        console.log(+count, '--', name);
    console.log('TOTAL:', confNames.length)
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
 * Generate a list of paper citations from a list of DOIs.
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
    const queue = DOIs.filter(x => x)
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
