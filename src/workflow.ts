import {FILES, SCHEDULE_PLACEHOLDER_RE, DBLP, RANDOM_POLICY} from './config.ts';
import {FileSystem, log, LogLv} from './util.ts';
import {type Paper, DataSet} from './dataset.ts';
import {lookupDoi} from './doi.ts';
import {loadVenues} from './dblp.ts';
import {pickN, pickNKey} from './random.ts';

function doiUrl(doi: string, target: 'plain'|'discord'|'gfm'){
    // target selects for which application to format:
    // - plain text
    // - discord
    // - github flavored markdown (gfm)
    const url = `https://doi.org/${doi.trim()}`;
    switch(target){
        case 'plain':
        case 'discord':
            return url;
        case 'gfm':
            return `<${url}>`;
    }
}

function formatWebCitation(paper: Paper): string {
    const {doi, citation} = paper;
    const plainUrl = doiUrl(doi, 'plain');
    const gfmUrl = doiUrl(doi, 'gfm');
    return '1. ' + citation.replace(new RegExp(plainUrl, 'i'), gfmUrl);
}

function updateSchedule(paper: Paper): void {
    const page = FileSystem.readFile(FILES.WEB_INDEX);
    const match = SCHEDULE_PLACEHOLDER_RE.exec(page);
    if(match){
        const newIndex = page.replace(match[0], paper.title);
        FileSystem.writeFile(FILES.WEB_INDEX, newIndex);
    } else {
        throw new Error('Attempting to write to the schedule; But no more slots remain');
    }
}

function updateWeb(paper: Paper): void {
    updateSchedule(paper); // do this first since it can throw
    FileSystem.append(FILES.WEB_PAPERS, formatWebCitation(paper));
}

function updateVars(paper: Paper): void {
    const vars = new Map([
        ['body', `This paper was randomly selected as your next reading:
### ${paper.title}
${paper.citation}

**Merge this PR to apply selection.**`],
        ['title', paper.title],
        ['citation', paper.citation],
        ['doi', doiUrl(paper.doi, 'plain')],
    ])
    let out: string[] = [];
    for(const [k, v] of vars.entries()){
        out.push(`${k}=${JSON.stringify(v)}`);
    }
    FileSystem.writeFile(FILES.ACTION_VARS, out.join('\n'));
}

function writeNext(paper: Paper): void {
    updateWeb(paper);
    updateVars(paper);
    FileSystem.append(FILES.ALLTIME_HISTORY, paper.doi);
    log(LogLv.normal, paper);
}

function hasStopWords(paper: Paper, stopwords: string[]): boolean {
    for(const word of stopwords){
        const re = new RegExp(word, 'mi');
        if(re.test(paper.title)){
            log(LogLv.debug, `Found stopwords in paper: ${paper.title}`);
            return true;
        }
    }
    return false;
}

function selectablePapers(): Paper[] {
    const dataSet = DataSet.load()
    const stopwords = FileSystem.readLines(FILES.STOPWORDS);
    const history = new Set(FileSystem.readLines(FILES.ALLTIME_HISTORY));
    return dataSet.papers()
        .filter(x => !hasStopWords(x, stopwords))
        .filter(x => !history.has(x.doi));
}

export function chooseNext(n: number = 1): void {
    const pool = selectablePapers();
    log(LogLv.debug, pool.map(p => p.title).join('\n'));
    if (n > pool.length){
        throw new Error('Not enough selectable papers remaining');
    }
    let chosen;
    switch(RANDOM_POLICY){
        case('uniform'):
            chosen = pickN(n, pool);
            break;
        case('uniform_venue'):
            chosen = pickNKey(n, pool, p => p.venue ?? '');
            break;
    }
    let chosen_dois = chosen.map(c => c.doi);
    FileSystem.writeJSON(FILES.CHOICES, chosen_dois);
    log(LogLv.normal, chosen);
}

export async function details(doi: string): Promise<void> {
    const paper = await lookupDoi(doi);
    console.log(paper);
}

export async function setNext(doi: string, addToDataSet=true): Promise<void> {
    const paper = await lookupDoi(doi, addToDataSet);
    writeNext(paper);
}

export function stats(): void {
    const dataSet = DataSet.load();
    const unknownVenue = 'no venue';
    const venues = dataSet.papers().map(p => p.venue ?? unknownVenue);
    const counter: Map<string,number> = new Map();
    venues.forEach(v => {
        counter.set(v, (counter.get(v) ?? 0) + 1);
    });
    table(counter);
}

function table(data: Map<string,number>): void{
    const columnOffset = 3;
    const sorted: Array<[string, number]> =
          [...data.entries()].sort(([,n], [,m]) => n - m);

    const total = sorted
        .map(([, n]) => n)
        .reduce((acc, n) => acc + n, 0);
    const width = columnOffset + sorted
        .map(([k, ]) => k.length)
        .reduce((acc, x) => Math.max(acc, x), 0);

    const printLine = (s: string, num: number) =>
        console.log(
            (s + ' ').padEnd(width, '.'),
            num.toString().padStart(3, ' ')
        );

    for(const line of sorted){
        printLine(...line);
    }
    printLine('TOTAL', total);
}

export function venues(): void {
    const domain = DBLP.DOMAINS[0];
    const venues = loadVenues();
    for(const v of venues){
        console.log(v.apiUrl(domain));
    }
}
