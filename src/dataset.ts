import {FILES as F, REQUEST, DATASET} from './config.ts';
import {readURL, type Headers} from './request.ts';
import {FileSystem as FS, log, sleep, spaceFix} from './util.ts';

interface DBLPVenue {
    name: string,
    year: number,
}

export interface Paper {
    doi: string,
    title: string,
    cite: string,
    venue: string
}

interface DBLPInfo {
    authors: {author: {text:string} | Array<{text:string}>},
    /**^^^
     * for single author papers, there is an author object,
     * otherwise there is an array of author objects.
     */
    title: string,
    venue: string,
    volume: string,
    number: string,
    pages: string,
    year: string,
    type: string,
    key: string,
    doi: string,
    ee: string,
    url: string,
}

export interface DataSet {
    [doi: string] : Paper
};

function loadVenues(): DBLPVenue[] {
    const lines: string[] = FS.readLines(F.VENUES);
    function parseVenue(line: string): DBLPVenue {
        const [name, year] = line.split(',');
        return {name, year: +year};
    }
    return lines.map(l => parseVenue(l));
}

export function loadPapers(): DataSet {
    return FS.loadJSON(F.PAPERS);
}

function writePapers(dataSet: DataSet): void {
    FS.writeJSON(F.PAPERS, dataSet);
}

/**
 * Basic checker to verify that an entry is actually a paper (as
 * opposed to e.g. an "editorship" or a keynote).
 */
function isPaper(info: DBLPInfo): boolean {
    const typeRegex = /paper|article/i;
    const pagesRegex = /\d+-\d+/;
    return typeRegex.test(info.type) && pagesRegex.test(info.pages);
}

async function fetchCitation(doi: string): Promise<string> {
    const searchParams = new URLSearchParams({
        doi,
        style: DATASET.citationStyle,
        lang: 'en-US',
    });
    const url = `https://citation.doi.org/format?${searchParams}`;
    return spaceFix(await readURL(url));
}

async function fetchTitle(doi:string): Promise<string> {
    const url = `https://doi.org/${doi}`;
    const headers: Headers = {Accept: 'application/vnd.citationstyles.csl+json'}
    return spaceFix(JSON.parse(await readURL(url, headers)).title);
}

export async function fetchDetails
(
    obj: {doi: string, title?: string, cite?: string, venue?: string},
    options = {additive: false}
): Promise<Paper>
{
    const doi = obj.doi
    const dataSet = loadPapers();
    if(Object.keys(dataSet).includes(doi)){
        return dataSet[doi];
    }
    const cite = obj.cite
        ? obj.cite
        : await fetchCitation(doi);
    const title: string = obj.title
        ? obj.title
        : await fetchTitle(doi);
    const venue = obj.venue
        ? obj.venue
        : 'Added Manually'
    const details: Paper = {doi, title, cite, venue};
    if(options.additive){
        dataSet[doi] = details;
        writePapers(dataSet)
    }
    log('normal', `Retrieved details for DOI ${details.doi}`);
    return details;
}

async function fetchVenuePapers(venue: DBLPVenue): Promise<Paper[]> {
    const DBLP = {
        DOMAIN: 'https://dblp.org',
        DOMAIN_BACKUP: 'https://dblp.uni-trier.de',
        PATH: '/search/publ/api',
        QUERY: (venue: string, year: number) =>
            `/?q=stream:conf/${venue}: year:${year}`
            + '&format=json&h=1000',
    };
    const reqURL = DBLP.DOMAIN
        + DBLP.PATH
        + DBLP.QUERY(venue.name, venue.year)
    const reqURL_backup = DBLP.DOMAIN_BACKUP
        + DBLP.PATH
        + DBLP.QUERY(venue.name, venue.year)
    log('normal', `Getting papers from ${venue.name}`);
    const response = await readURL(reqURL)
        .then(good => good,
              ()   => readURL(reqURL_backup));
    const fetched: DBLPInfo[] = JSON.parse(response)
        .result.hits.hit.map((x: {info: DBLPInfo}) => x.info);
    const hits = fetched.filter((ifo: DBLPInfo) => isPaper(ifo))
    const papers: Paper[] = [];
    for(const ifo of hits){
        const paper: Paper =
            await fetchDetails({...ifo, venue: `${venue.name} ${venue.year}`});
        papers.push(paper);
        sleep(REQUEST.API_CALL_DELAY); // be (kinda) nice to api providers.
    }
    log('normal', `... retrieved ${papers.length} papers from ${venue.name}`);
    return papers;
}

export async function makeDataSet(additive = true) {
    const venues = loadVenues();
    if(!additive){
        clearDataSet();
    }
    const dataSet: DataSet = loadPapers();
    for(const v of venues){
        (await fetchVenuePapers(v)).forEach(p => {dataSet[p.doi] = p;});
        writePapers(dataSet);
    }
}

function clearDataSet(){
    writePapers({});
}
