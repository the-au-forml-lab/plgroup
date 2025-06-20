import { ACTIONS, FILES as F } from './config.js';
import { FileSystem as FS } from './file-system.js';
import { loadPapers, fetchDetails, makeDataSet } from './dataset.js';
import { LogLv, log } from './util.js';
function hasStopwords(paper) {
    const stopwords = FS.readLines(F.STOPWORDS);
    for (const stop of stopwords) {
        const re = new RegExp(stop, 'gmi');
        if (re.test(paper.title)) {
            log(LogLv.debug, `Rejecting paper: ${paper.title}`);
            return true;
        }
    }
    return false;
}
async function chooseNext() {
    const dataSet = loadPapers();
    const DOIs = Object.keys(dataSet);
    const pastPapers = FS.readLines(F.ALLTIME_HISTORY);
    const selectable = DOIs
        .filter(x => !pastPapers.includes(x))
        .filter(x => !hasStopwords(dataSet[x]));
    // shuffle(selectable); //turn on for more shuffles.
    if (selectable.length === 0) {
        throw new Error('no selctable papers');
    }
    const idx = Math.floor(Math.random() * selectable.length);
    await setNext(selectable[idx]);
}
function formatDescription(p) {
    return [p.title, p.cite, p.doi].join('\n');
}
async function setNext(doi) {
    const paper = await fetchDetails({ doi }, { additive: true });
    updateWeb(paper); // do this first since it can throw.
    FS.writeFile(F.NEXT_DESC, formatDescription(paper));
    FS.writeFile(F.NEXT_FILE, doi);
    FS.append(F.SEMESTER_PAPERS, doi);
    FS.append(F.ALLTIME_HISTORY, doi);
}
export function stats() {
    const papers = Object.values(loadPapers());
    const venues = papers.map(p => p.venue);
    // count using a hash map;
    // while we're at it, accumulate the total number of papers and
    // a width for displaying later
    const counter = {};
    let width = 0;
    let total = 0;
    for (const v of venues) {
        counter[v] = counter[v] ? counter[v] + 1 : 1;
        total++;
        width = Math.max(width, v.length + 3);
    }
    // sort low to high
    const sorted = Object.keys(counter)
        .map(k => [k, counter[k]]);
    sorted.sort(([, n], [, m]) => n - m);
    const printLine = (s, num) => {
        console.log((s + ' ').padEnd(width, '.'), num.toString().padStart(3, ' '));
    };
    for (const line of sorted) {
        printLine(...line);
    }
    printLine('TOTAL', total);
}
export async function details(doi) {
    console.table(await fetchDetails({ doi }));
}
/**
 * add a leading number to a citation and doi link in <angle backets> so that
 * github pages formats it as a link
 */
function formatWebCitation(paper) {
    const { doi, cite } = paper;
    const doiURL = `https://doi.org/${doi}`;
    return '1. ' + cite.replace(doiURL, `<${doiURL}>`);
}
function updateWeb(paper) {
    FS.append(F.WEB_PAPERS, formatWebCitation(paper));
    updateSchedule(paper);
}
function updateSchedule(paper) {
    const index = FS.readFile(F.WEB_INDEX);
    const match = (/Paper\s+\d+\s+discussion/).exec(index);
    if (match) {
        const newIndex = index.replace(match[0], paper.title);
        FS.writeFile(F.WEB_INDEX, newIndex);
    }
    else {
        throw new Error('Attempting to write to the schedule; But no more slots remain');
    }
}
export const main = async () => {
    const [action, param] = process.argv.slice(2);
    let todo;
    switch (action) {
        case (ACTIONS.CHOOSE):
            todo = chooseNext;
            break;
        case (ACTIONS.DETAILS):
            todo = (() => details(param));
            break;
        case (ACTIONS.SET):
            todo = (() => setNext(param));
            break;
        case (ACTIONS.STATS):
            todo = stats;
            break;
        case (ACTIONS.UPDATE):
            todo = (() => makeDataSet(Boolean(param)));
            break;
        case (ACTIONS.WEB):
            todo = updateWeb;
            break;
        default:
            todo = (() => console.log('Unknown action'));
    }
    await todo();
    process.exit();
};
await main();
