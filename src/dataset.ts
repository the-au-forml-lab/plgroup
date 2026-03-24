import {FILES, DATASET} from './config.ts';
import {FileSystem, promiseAllSettledSplit, log, LogLv} from './util.ts';
import {loadVenues} from './dblp.ts';
import type {DblpHit} from './dblp.ts';
import {lookupDoi} from './doi.ts';

export interface Paper {
    doi: string,
    title: string,
    citation: string,
    venue?: string,
}

export class DataSet {
    private data: Map<string, Paper>;

    constructor(papers: Paper[] = []) {
        this.data = new Map();
        papers.forEach(p => this.insert(p));
    }

    static empty(): DataSet {
        return new DataSet();
    }

    static copy(dataSet: DataSet): DataSet {
        return new DataSet(dataSet.papers());
    }

    copyKeys(keys: string[]){
        return new DataSet(keys.map(k => this.get(k)!));
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
        const k = (typeof element === 'string') ? element : element.doi;
        return this.data.has(k);
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

export async function makeDataSet(
    keepOldPapers: boolean = DATASET.KEEP_OLD_PAPERS
): Promise<DataSet> {
    const cache: DataSet = DataSet.load();
    const venues = loadVenues();
    const { fulfilled: hits,
            rejected: venueRejections
    } = await promiseAllSettledSplit(venues.map(v => () => v.getHits()));
    const { fulfilled: gotPapers,
            rejected: hitRejections
          } = await promiseAllSettledSplit(
              hits.flat().map(hit => (async () => {
                  const doi = hit.info.doi;
                  const paper = cache.get(doi) ?? await lookupDoi(hit.info.doi);
                  paper.venue = hit.venue;
                  return paper;
              })));
    for(const reason of venueRejections){
        log(LogLv.error, `Failed to fetch data from venue: ${reason}`);
    }
    for(const reason of hitRejections){
        log(LogLv.error, `Failed to fetch data for DOI: ${reason}`);
    }
    for(const paper of gotPapers){
        cache.insert(paper);
    }
    if(venueRejections.length === 0 && hitRejections.length === 0){
        const dataSet = new DataSet(gotPapers);
        dataSet.write();
        return dataSet;
    }
    cache.write();
    if(keepOldPapers){
        return cache;
    }
    throw new Error('Failed to retrieve some papers, fix venues and try again\n'
        + 'intermediate progress has been saved');
}
