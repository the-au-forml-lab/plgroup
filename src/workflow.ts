import {FILES, SCHEDULE_EMPTY_LINE_RE} from './config.ts';
import {FileSystem, log, LogLv} from './util.ts';
import {type Paper, DataSet} from './dataset.ts';
import {lookupDoi} from './doi.ts';

function doiUrl(doi: string, target: 'plain'|'discord'|'gfm'){
    // target selects for which application to format:
    // - plain text
    // - discord
    // - github flavored markdown (gfm)
    const url = `https://doi.org/${doi}`;
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
    const match = SCHEDULE_EMPTY_LINE_RE.exec(page);
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
        ['discordNext', `Next Paper, ${paper.title}\n\n\n${paper.citation}`]
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
}

function hasStopWords(paper: Paper, stopwords: RegExp[]): boolean {
    for(const re of stopwords){
        if(re.test(paper.title)){
            log(LogLv.debug, `Found stopwords in paper: ${paper.title}`);
            return true;
        }
    }
    return false;
}

export async function chooseNext(): Promise<void> {
    const dataSet = DataSet.load()
    const stopwords = FileSystem.readLines(FILES.STOPWORDS)
        .map(l => new RegExp(l, 'gmi'));
    const history = new Set(FileSystem.readLines(FILES.ALLTIME_HISTORY));
    const selectable = dataSet.papers()
        .filter(x => !hasStopWords(x, stopwords))
        .filter(x => !history.has(x.doi));
    if(selectable.length === 0){
        throw new Error('No selectable papers remaining');
    }
    const index = Math.floor(Math.random() * (selectable.length));
    const selected = selectable[index];
    writeNext(selected);
    console.log(selected);
}

export async function details(doi: string): Promise<void> {
    const paper = await lookupDoi(doi);
    console.log(paper);
}
export async function setNext(doi: string, additive=true): Promise<void> {
    const paper = await lookupDoi(doi, additive);
    writeNext(paper);
}

export function stats(): void {
    const dataSet = DataSet.load();
    const unknownVenue = 'no venue';
    const venues = dataSet.papers().map(p => p.venue ?? unknownVenue);
    /**
     * count using a hash map; while we're at it, accumulate the
     * `total` number of papers and a `width` for displaying later.
     */
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
