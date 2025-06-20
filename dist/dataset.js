import { FILES as F, DBLP } from './config.js';
import { FileSystem as FS } from './file-system.js';
import { readURL } from './request.js';
import { log, LogLv, sleep, JSON_pretty, spaceFix } from './util.js';
;
function loadVenues() {
    const lines = FS.readLines(F.VENUES);
    function parseVenue(line) {
        const [name, year, url] = line.split(',');
        return { name, url, year: +year };
    }
    return lines.map(l => parseVenue(l));
}
export function loadPapers() {
    return JSON.parse(FS.readFile(F.PAPERS));
}
function writePapers(dataSet) {
    FS.writeFile(F.PAPERS, JSON_pretty(dataSet));
}
/**
 * Basic checker to verify that an entry is acutally a paper (as
 * opposed to e.g. an "editorship" or a keynote).
 */
function isPaper(info) {
    const typeRegex = /paper|article/i;
    const pagesRegex = /\d+-\d+/;
    return typeRegex.test(info.type) && pagesRegex.test(info.pages);
}
async function fetchCitation(doi) {
    const searchParams = new URLSearchParams({
        doi,
        style: 'modern-language-association',
        lang: 'en-US',
    });
    const url = `https://citation.doi.org/format?${searchParams}`;
    return spaceFix(await readURL(url));
}
async function fetchTitle(doi) {
    const url = `https://doi.org/${doi}`;
    const headers = { Accept: 'application/vnd.citationstyles.csl+json' };
    return spaceFix(JSON.parse(await readURL(url, headers)).title);
}
export async function fetchDetails(obj, options = { additive: false }) {
    const doi = obj.doi;
    const dataSet = loadPapers();
    if (Object.keys(dataSet).includes(doi)) {
        return dataSet[doi];
    }
    const cite = obj.cite
        ? obj.cite
        : await fetchCitation(doi);
    const title = obj.title
        ? obj.title
        : await fetchTitle(doi);
    const venue = obj.venue
        ? obj.venue
        : 'unknown venue';
    const details = { doi, title, cite, venue };
    if (options.additive) {
        dataSet[doi] = details;
        writePapers(dataSet);
    }
    return details;
}
export async function fetchVenuePapers(venue) {
    const reqURL = DBLP.DOMAIN
        + DBLP.PATH
        + DBLP.QUERY(venue.name, venue.year);
    const reqURL_backup = DBLP.DOMAIN_BACKUP
        + DBLP.PATH
        + DBLP.QUERY(venue.name, venue.year);
    log(LogLv.normal, `Getting papers from ${venue.name}`);
    const response = await readURL(reqURL)
        .then(good => good, () => readURL(reqURL_backup));
    const fetched = JSON.parse(response)
        .result.hits.hit.map((x) => x.info);
    const hits = fetched
        .filter((ifo) => isPaper(ifo));
    const papers = [];
    for (const ifo of hits) {
        const paper = await fetchDetails({ ...ifo, venue: `${venue.name} ${venue.year}` });
        papers.push(paper);
        sleep(500); // be (kinda) nice to api providers.
    }
    log(LogLv.normal, `... retrieved ${papers.length} papers from ${venue.name}`);
    return papers;
}
export async function makeDataSet(additive = true) {
    const venues = loadVenues();
    const dataSet = additive ? loadPapers() : {};
    for (const v of venues) {
        (await fetchVenuePapers(v)).forEach(p => { dataSet[p.doi] = p; });
        writePapers(dataSet);
    }
}
export function clearDataSet() {
    writePapers({});
}
