import {FILES as F, DATASET, DBLP_DOMAINS} from './config.ts';
import {type Headers, readURL} from './request.ts';
import {
    FileSystem as FS,
    log,
    LogLv,
    spaceFix,
    promiseAllSequential
} from './util.ts';

export interface Paper {
    doi: string,
    title: string,
    cite: string,
    venue?: string
}

interface DblpInfo {
    authors: {
        author: {text:string, '@pid': string}
            | Array<{text:string, '@pid': string}>
    },
    /**
     * for single author papers, there is an author object, otherwise
     * there is an array of author objects. Note that this was a design
     * choice on the side of the DBLP API authors. I am not responsible
     * for this.
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

/**
 * Basic checker to verify that an entry is actually a paper as opposed
 * to e.g. an editorship or a keynote, etc
 */
function isPaper(item: DblpInfo): boolean {
    const tests: Array<(item: DblpInfo) => boolean> = [
        (info) => /paper|article/i.test(info.type),
        (info) => /\d+-\d+/.test(info.pages),
    ];
    const passed = tests.reduce((acc, test) => acc && test(item), true);
    if(!passed){
        log(LogLv.debug, `Rejecting hit ${JSON.stringify(item, null, 2)}`);
    }
    return passed;
}

class DblpHit {
    doi: string;
    title: string;
    private constructor(doi: string, title: string) {
        this.doi = doi;
        this.title = title;
    }
    
    static parseApiResponse(hit: DblpInfo): DblpHit {
        const {doi, title} = hit;
        if(!doi){
            const errorMessage = 'Received DBLP hit with no doi:'
                + `\n${JSON.stringify(hit, null, 2)}`;
            throw new Error(errorMessage);
        }
        if (!title){
            const errorMessage = 'Received DBLP hit with no title:'
                + `\n${JSON.stringify(hit, null, 2)}`;
            throw new Error(errorMessage);
        }
        return new DblpHit(doi, title);
    }
}

class DblpVenue {
    name: string;
    year: number;
    private constructor(name: string, year: number){
        this.name = name;
        this.year = year;
    }

    toString(){
        return `${this.name} ${this.year}`;
    }

    private static parse(line: string): DblpVenue {
        const lineRE = /^[a-zA-Z]+,\d+$/;
        if (!lineRE.test(line)){
            const errorMessage = `Improperly formatted venue:\n${line}`;
            throw new Error(errorMessage);
        }
        const [name, year] = line.split(',');
        const parsedYear = Number.parseInt(year);
        if(Number.isNaN(parsedYear)){
            throw new Error(`year ${year} is not an integer`);
        }
        return new DblpVenue(name, parsedYear);
    }

    static async load(): Promise<DblpVenue[]> {
        const lines: string[] = await FS.readLines(F.VENUES);
        return lines.map(l => DblpVenue.parse(l));
    }

    async getHits(): Promise<DblpHit[]> {
        log(LogLv.normal, `Getting papers from ${this}`);
        const response = await this.getData();
        const json = JSON.parse(response);
        if(!json.result?.hits?.hit){
            throw new Error(
                `Unexpected DBLP response shape for venue ${this}. Maybe the API changed?`
            );
        }
        const hits: DblpHit[] = json.result.hits.hit
            .map(({info}: {info: DblpInfo}) => info)
            .filter(isPaper)
            .map((info: DblpInfo) => DblpHit.parseApiResponse(info));
        log(LogLv.normal, `... got ${hits.length} papers from ${this}`);
        return hits;
    }

    private constructQueryUrl(domain: string|URL): string{
        const ApiPath = '/search/publ/api';
        return domain
            + ApiPath
            + `/?q=stream:conf/${this.name}: year:${this.year}&format=json&h=1000`;

    }
    private async getData(){
        const urls = DBLP_DOMAINS.map(domain => this.constructQueryUrl(domain));
        try {
            return await Promise.any(urls.map(url => readURL(url)));
        } catch (err) {
            throw new Error(
                `All DBLP endpoints failed for venue ${this}:\n${err}`
            );
        }
    }
}

export class DataSet {
    private data: Map<string, Paper>;
    private fileName: string;

    private constructor(papers: Paper[], fileName: string) {
        this.data = new Map(papers.map(p => [p.doi, p]));
        this.fileName = fileName;
    }

    static async load(fileName=F.PAPERS) {
        const papers: Paper[] = (await FS.readLines(fileName))
                                    .map(line => JSON.parse(line));
        return new DataSet(papers, fileName);
    }

    DOIs(): string[] {
        return [...this.data.keys()];
    }

    papers(): Paper[] {
        return [...this.data.values()];
    }

    has(item: string|Paper): boolean {
        return typeof item === 'string'
            ? this.data.has(item)
            : this.data.has(item.doi);
    }

    lookup(doi: string): Paper{
        const get = this.data.get(doi);
        if(!get) {
            throw new Error(`Looked up nonexistent DOI ${doi} in data set.`);
        } 
        return get;
    }

    insert(paper: Paper): void{
        this.data.set(paper.doi, paper);
    }

    write(): Promise<void> {
        const fileContent = this.papers()
            .map(p => JSON.stringify(p))
            .join('\n')
        return FS.writeFile(this.fileName, fileContent);
    }

    clear(): void {
        this.data.clear();
    }
}

async function requestTitle(doi:string): Promise<string> {
    const url = `https://doi.org/${doi}`;
    const headers: Headers = {
        Accept: 'application/vnd.citationstyles.csl+json'
    };
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

export async function requestDetails(doi: string): Promise<Paper> {
    const title = await requestTitle(doi);
    const cite = await requestCite(doi);
    return {doi, title, cite};
}

export async function details(doi: string, options={additive: false}):
Promise<Paper> {
    const dataSet: DataSet = await DataSet.load();
    const paper: Paper = dataSet.has(doi)
        ? dataSet.lookup(doi)
        : await requestDetails(doi);
    if(options.additive){
        dataSet.insert(paper);
        await dataSet.write();
    }
    return paper;
}

export async function makeDataSet(clear=false): Promise<void> {
    const dataSet: DataSet = await DataSet.load();
    const venues = await DblpVenue.load();
    if(clear){
        dataSet.clear();
    }
    for(const venue of venues){
        const hits = await venue.getHits();
        const papers: Paper[] = await promiseAllSequential(
            async ({doi, title}) => ({
                doi: doi,
                title: title,
                venue: venue.toString(),
                cite: await requestCite(doi),}),
            hits
        );
        papers.forEach(paper => dataSet.insert(paper));
    }
    await dataSet.write();
}
