import {FILES as F, SCHEDULE_EMPTY_LINE_RE} from './config.ts';
import {type Paper, DataSet, details} from './dataset.ts';
import {FileSystem as FS, log, LogLv} from './util.ts';

function doiURL(doi: string, target: 'gfm'|'discord'|'plain'): string{
    const baseURL = 'https://doi.org/';
    switch(target){
        case 'plain':
            return baseURL + doi;
        case 'discord':
            return baseURL + doi;
        case 'gfm':
            return `<${baseURL + doi}>`;
    }
}

function formatWebCitation(paper: Paper): string{
    const {doi, cite} = paper;
    const plainURL = doiURL(doi, 'plain');
    const gfmURL = doiURL(doi, 'gfm');
    return '1. ' + cite.replace(plainURL, gfmURL);
}

function hasStopwords(paper: Paper, stopwords: string[]): boolean {
    for (const stop of stopwords){
        const re = new RegExp(stop, 'gmi');
        if(re.test(paper.title)){
            log(LogLv.debug, `Rejecting paper: ${paper.title}`);
            return true;
        }
    }
    return false;
}

async function updateSchedule(paper: Paper): Promise<void>{
    const page = await FS.readFile(F.WEB_INDEX);
    const match = SCHEDULE_EMPTY_LINE_RE.exec(page);
    if(match){
        const newIndex = page.replace(match[0], paper.title);
        return FS.writeFile(F.WEB_INDEX, newIndex);
    } else {
        throw new Error('Attempting to write to the schedule; But no more slots remain');
    }
}

async function updateWeb(paper: Paper): Promise<void>{
    await FS.append(F.WEB_PAPERS, formatWebCitation(paper));
    await updateSchedule(paper);
}

function updateVars(paper: Paper): Promise<void> {
    const vars: {[varName: string]: string} = {
        'body': ['This paper was randomly selected as your next reading:',
                 `### ${paper.title}`,
                 paper.cite,
                 '',
                 '**Merge this PR to apply selection.**'].join('\n'),
        'title': paper.title,
        'cite': paper.cite,
        'doi': doiURL(paper.doi, 'plain'),
        'discordNext': [
            `Next Paper ${paper.title}`,
            '', '',
            paper.cite,
        ].join('\n'),
    }
    let out: string[] = [];
    for(const v in vars){
        out.push(`${v}=${JSON.stringify(vars[v])}`);
    }
    return FS.writeFile(F.ACTION_VARS, out.join('\n'));
}

export async function writeNext(paper: Paper): Promise<void>{
    await updateWeb(paper); // do this first since it can throw.
    await updateVars(paper);
    await FS.append(F.ALLTIME_HISTORY, paper.doi);
}

export async function chooseNext(): Promise<void>{
    const dataSet: DataSet = await DataSet.load();
    const papers: Paper[] = dataSet.papers();
    const stopwords: string[] = await FS.readLines(F.STOPWORDS);
    const pastPapers = await FS.readLines(F.ALLTIME_HISTORY);
    const selectable = papers
        .filter(paper => !pastPapers.includes(paper.doi))
        .filter(paper => !hasStopwords(paper, stopwords));
    // shuffle(selectable); //turn on for more shuffles.
    if(selectable.length === 0){
        throw new Error('no selectable papers');
    }
    const idx: number = Math.floor(Math.random() * selectable.length);
    await writeNext(selectable[idx]);
}

export async function setNext(doi: string): Promise<void>{
    const paper = await details(doi);
    await writeNext(paper);
}

export async function stats(): Promise<void> {
    const dataSet = await DataSet.load();
    const venues = dataSet.papers().map(p => p.venue ?? '');
    /**
     * count using a hash map; while we're at it, accumulate the
     * `total` number of papers and a `width` for displaying later.
     */
    const counter: {[venue: string]: number} = {};
    venues.forEach(v => {
        counter[v] = counter[v] ? counter[v] + 1 : 1;
    });
    table(counter);
}

function table(data: {[field:string]: number}): void{
    const columnOffset = 3;
    const sorted: Array<[string, number]> = Object.entries(data);
    sorted.sort(([,n], [,m]) => n - m);

    const total = sorted
        .map(([_, n]) => n)
        .reduce((acc, n) => acc + n, 0);
    const width = columnOffset + sorted
        .map(([k, _]) => k.length)
        .reduce((acc, x) => Math.max(acc, x), 0);
        
    const printLine = (s: string, num: number) =>
        console.log(
            (s + ' ').padEnd(width, '.'),
            num.toString().padStart(3, ' '));

    for(const line of sorted){
        printLine(...line);
    }
    printLine('TOTAL', total);

}
