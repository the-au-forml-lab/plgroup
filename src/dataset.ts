import {FILES, DATASET} from './config.ts';
import {FileSystem, promiseAllSettledSplit, log, LogLv} from './util.ts';
import {DblpPrePaper, loadVenues} from './dblp.ts';
import {getCitation} from './doi.ts';

export interface Paper {
    doi: string,
    title: string,
    citation: string,
    venue?: string,
}

export class DataSet {
    private data: Map<string, Paper>;

    private constructor(papers: Paper[] = []) {
        // You are not allowed to construct data sets by hand. Use the `empty`,
        // `copy` or `load` static methods instead.
        this.data = new Map();
        papers.forEach(p => this.insert(p));
    }

    static empty(): DataSet {
        return new DataSet();
    }

    static copy(dataSet: DataSet): DataSet {
        return new DataSet(dataSet.papers());
    }

    static load(): DataSet {
        if(!FileSystem.exists(FILES.PAPERS)){
            return DataSet.empty();
        }
        const papers: Paper[] = JSON.parse(FileSystem.readFile(FILES.PAPERS));
        // do not check for errors since this file should be machine-generated
        return new DataSet(papers);
    }

    insert(p: Paper): void {
        this.data.set(p.doi, p);
    }

    dois(): string[] {
        return [...this.data.keys()];
    }

    papers(): Paper[] {
        return [...this.data.values()];
    }

    has(element: string|Paper): boolean {
        return (typeof element === 'string')
            ? this.data.has(element)
            : this.data.has(element.doi);
    }

    static get(doi: string): Paper|undefined{
        return DataSet.load().get(doi);
    }

    get(doi: string): Paper|undefined {
        return this.data.get(doi);
    }

    write(): void {
        FileSystem.writeJSON(FILES.PAPERS, this.papers(), DATASET.HUMAN_READABLE);
    }
}

async function completePaper(hit: DblpPrePaper, cache: DataSet): Promise<Paper> {
    const cached = cache.get(hit.doi);
    if(cached){
        return cached;
    }
    const citation = await getCitation(hit.doi);
    return {...hit, citation};
}

export async function makeDataSet(
    additive: boolean = DATASET.ADDITIVE
): Promise<DataSet> {
    const cache: DataSet = DataSet.load();
    const dataSet = additive
        ? DataSet.copy(cache)
        : DataSet.empty();
    const venues = loadVenues();
    const { fulfilled: hits,
            rejected: venueRejections
          } = await promiseAllSettledSplit(venues.map(v => v.getHits()));
    const { fulfilled: gotPapers,
            rejected: hitRejections
          } = await promiseAllSettledSplit(
              hits.flat().map(hit => completePaper(hit, cache))
          );
    for(const reason of venueRejections){
        log(LogLv.error, `Failed to fetch data from venue: ${reason}`);
    }
    for(const reason of hitRejections){
        log(LogLv.error, `Failed to fetch data for DOI: ${reason}`);
    }
    for(const paper of gotPapers){
        dataSet.insert(paper);
    }
    dataSet.write();
    return dataSet;
}
