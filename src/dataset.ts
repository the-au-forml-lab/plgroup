import {FILES as F, DATASET} from './config.ts';
import {type Headers, readURL} from './request.ts';
import {FileSystem as FS, log, LogLv, spaceFix} from './util.ts';

class DBLPVenue {
    constructor(name: string, year: string|number){
        this.name = name;
        this.year = +year;
    }
    name: string;
    year: number;
    toString(){
        return `${this.name} ${this.year}`;
    }
    static parse(line: string): DBLPVenue {
        const lineRE = /^[a-zA-Z]+,\d+$/;
        if (!lineRE.test(line)){
            const errorMessage = `Improperly formatted venue:\n${line}`;
            log(LogLv.error, errorMessage);
            throw new Error(errorMessage);
        }
        const [name, year] = line.split(',');
        return new DBLPVenue(name, year);
    }

}

export interface Paper {
    doi: string,
    title: string,
    cite: string,
    venue?: string
}

interface DBLPInfo {
    authors: {
        author: {text:string, '@pid': string}
            | Array<{text:string, '@pid': string}>
    },
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
    url: string,
}

export class DataSet {
    private data: {[doi:string]: Paper};
    private fileName: string;

    constructor(fileName: string = F.PAPERS){
        this.fileName = fileName;
        this.data = {};
        for(const line of FS.readLines(fileName)){
            const paper: Paper = JSON.parse(line);
            this.data[paper.doi] = paper;
        }
    }

    DOIs(): string[] {
        return Object.keys(this.data);
    }

    papers(): Paper[] {
        return Object.values(this.data);
    }

    includes(doi: string): boolean {
        return this.DOIs().includes(doi);
    }

    lookup(doi: string): Paper{
        if(!this.includes(doi)){
            throw new Error(`Looked up nonexistent DOI ${doi}`);
        }
        return this.data[doi];
    }

    insert(paper: Paper): void{
        if(this.includes(paper.doi)){
            return;
        }
        this.data[paper.doi] = paper;
        if(this.DOIs().length === 0){
            FS.writeFile(this.fileName, JSON.stringify(paper));
        } else {
            FS.append(this.fileName, JSON.stringify(paper));
        }
    }

    write(){
        const fileContent = this.papers()
            .map(p => JSON.stringify(p))
            .join('\n')
        FS.writeFile(this.fileName, fileContent);
    }

    clear(): void {
        this.data = {};
        this.write();
    }

    stats(): void {
        const venues = this.papers().map(p => p.venue ?? '');
        /**
         * count using a hash map; while we're at it, accumulate the `total`
         * number of papers and a `width` for displaying later.
         */
        const counter: {[_:string]: number} = {};
        let width = 0;
        let total = 0;
        venues.forEach(v => {
            counter[v] = counter[v] ? counter[v] + 1 : 1;
            total++;
            width = Math.max(width, v.length + 3);
        });

        // sort low to high
        const sorted: Array<[string, number]> =
            Object.keys(counter).map(k => [k, counter[k]]);
        sorted.sort(([,n], [,m]) => n - m);

        const printLine = (s: string, num: number) =>
            console.log(
                (s + ' ').padEnd(width, '.'),
                num.toString().padStart(3, ' '));

        for(const line of sorted){
            printLine(...line);
        }
        printLine('TOTAL', total);
    }
}

function loadVenues(): DBLPVenue[] {
    const lines: string[] = FS.readLines(F.VENUES);
    return lines.map(l => DBLPVenue.parse(l));
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

async function requestTitle(doi:string): Promise<string> {
    const url = `https://doi.org/${doi}`;
    const headers: Headers = {Accept: 'application/vnd.citationstyles.csl+json'}
    return spaceFix(JSON.parse(await readURL(url, headers)).title);
}

async function requestCite(doi: string): Promise<string> {
    const searchParams = new URLSearchParams({
        doi,
        style: DATASET.citationStyle,
        lang: 'en-US',
    });
    log(LogLv.debug, `Requesting citation for DOI ${doi}`);
    const url = `https://citation.doi.org/format?${searchParams}`;
    return spaceFix(await readURL(url));
}

async function requestDetails(doi:string): Promise<Paper>{
    const title = await requestTitle(doi);
    const cite = await requestCite(doi);
    return {doi, title, cite};
}

export async function getDetails (doi: string, options={additive: false}): Promise<Paper> {
    const dataSet = new DataSet();
    if(dataSet.includes(doi)){
        return dataSet.lookup(doi);
    }
    const paper = await requestDetails(doi);
    if(options.additive){
        dataSet.insert(paper);
    }
    log(LogLv.debug, `Retrieved details for DOI ${paper.doi}`);
    return paper;
}

async function requestVenueData(venue: DBLPVenue){
    const DBLP_Domains = [
        'https://dblp.org',
        'https://dblp.uni-trier.de',
    ];
    const ApiPath = '/search/publ/api';
    function getQuery(v: DBLPVenue): string{
        return `/?q=stream:conf/${v.name}: year:${v.year}&format=json&h=1000`;
    }
    const urls = DBLP_Domains.map(domain => domain + ApiPath + getQuery(venue));
    try {
        return await Promise.any(urls.map(url => readURL(url)));
    } catch (err) {
        const errorMessage =
            `All DBLP endpoints failed for ${venue.name} ${venue.year}:\n${err}`;
        log(LogLv.error, errorMessage);
        throw err;
    }
}

function parseDBLPResponse(response: string): DBLPInfo[]{
    const json = JSON.parse(response);
    try {
        if(!json.result?.hits?.hit){
            throw new Error('Unexpected DBLP response shape. Maybe the API changed?');
        }
        return json.result.hits.hit
            .map((x: {info: DBLPInfo}) => x.info)
            .filter((info: DBLPInfo) => isPaper(info));
    } catch (err) {
        throw err;
    }
}

export async function makeDataSet(clear=false) {
    const dataSet: DataSet = new DataSet();

    async function getVenuePapers(venue: DBLPVenue): Promise<Paper[]> {
        log(LogLv.normal, `Getting papers from ${venue.name} ${venue.year}`);
        const response = await requestVenueData(venue);
        const hits = parseDBLPResponse(response);
        const requests: Promise<Paper>[] = hits.map(async h => {
            const { doi, title } = h;
            if(dataSet.includes(doi)){
                return dataSet.lookup(doi);
            }
            const cite = await requestCite(doi);
            return { doi, title, cite, venue: venue.toString() };
        })
        const papers: Paper[] = await Promise.all(requests);
        log(LogLv.normal,
            `... retrieved ${papers.length} papers from ${venue.name}`);
        return papers;
    }
    const venues = loadVenues();
    if(clear){
        dataSet.clear();
    }
    for(const v of venues){
        (await getVenuePapers(v)).forEach(p => dataSet.insert(p));
    }
}
