import {ACTIONS, FILES as F} from './config.js';
import {FileSystem as FS} from './file-system.js';
import {Paper, DataSet, loadPapers, fetchDetails, makeDataSet} from './dataset.js';
import {LogLv, log} from './util.js';

function hasStopwords(paper: Paper): boolean {
    const stopwords: string[] = FS.readLines(F.STOPWORDS);
    for (const stop of stopwords){
        const re = new RegExp(stop, 'gmi');
        if(re.test(paper.title)){
            log(LogLv.debug, `Rejecting paper: ${paper.title}`);
            return true;
        }
    }
    return false;
}

async function chooseNext(): Promise<void>{
    const dataSet: DataSet = loadPapers();
    const DOIs: string[] = Object.keys(dataSet);
    const pastPapers = FS.readLines(F.ALLTIME_HISTORY);
    const selectable = DOIs
        .filter(x => !pastPapers.includes(x))
        .filter(x => !hasStopwords(dataSet[x]));
    // shuffle(selectable); //turn on for more shuffles.
    if(selectable.length === 0){
        throw new Error('no selctable papers');
    }
    const idx: number = Math.floor(Math.random() * selectable.length);
    await setNext(selectable[idx]);
}

function updateVars(paper: Paper): void{
    const vars: {[_:string]: string} = {
        'body': ['This paper was randomly selected as your next reading:',
                 `### ${paper.title}`,
                 paper.cite,
                 '',
                 '**Merge this PR to apply selection.**'].join('\\n'),
        'title': paper.title,
        'cite': paper.cite,
        'doi': doiURL(paper.doi, 'plain'),
        'discord': [`**${paper.title}**`,
                    doiURL(paper.doi, 'discord')
                   ].join('\\n'),
    }
    let out: string[] = [];
    for(const v in vars){
        out.push(`${v}=${vars[v]}`);
    }
    FS.writeFile(F.ACTION_VARS, out.join('\n'));
}

async function setNext(doi: string): Promise<void>{
    const paper: Paper = await fetchDetails({doi}, {additive: true});
    updateWeb(paper); // do this first since it can throw.
    updateVars(paper);
    FS.writeFile(F.NEXT_FILE, doi);
    FS.append(F.SEMESTER_PAPERS, doi);
    FS.append(F.ALLTIME_HISTORY, doi);
}

export function stats(): void{
    const papers: Paper[] = Object.values(loadPapers());
    const venues: string[] = papers.map(p => p.venue);

    // count using a hash map;
    // while we're at it, accumulate the total number of papers and
    // a width for displaying later
    const counter: {[_:string]: number} = {};
    let width = 0;
    let total = 0;
    for(const v of venues){
        counter[v] = counter[v] ? counter[v] + 1 : 1;
        total++;
        width = Math.max(width, v.length + 3);
    }

    // sort low to high
    const sorted: Array<[string, number]> = Object.keys(counter)
        .map(k => [k, counter[k]]);
    sorted.sort(([,n], [,m]) => n - m);

    const printLine = (s: string, num: number) => {
        console.log(
            (s + ' ').padEnd(width, '.'),
            num.toString().padStart(3, ' ')
        );
    }

    for(const line of sorted){
        printLine(...line);
    }
    printLine('TOTAL', total);
}

export async function details(doi: string): Promise<void>{
    console.table(await fetchDetails({doi}));
}

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
/**
 * add a leading number to a citation and doi link in <angle backets> so that
 * github pages formats it as a link
 */
function formatWebCitation(paper: Paper): string{
    const {doi, cite} = paper;
    return `1. ${cite.replace(doiURL(doi, 'plain'), doiURL(doi, 'gfm'))}`;
}

function updateWeb(paper: Paper): void{
    FS.append(F.WEB_PAPERS, formatWebCitation(paper));
    updateSchedule(paper);
}

function updateSchedule(paper: Paper): void{
    const index = FS.readFile(F.WEB_INDEX);
    const match = (/Paper\s+\d+\s+discussion/).exec(index);
    if(match){
        const newIndex = index.replace(match[0], paper.title);
        FS.writeFile(F.WEB_INDEX, newIndex);
    } else {
        throw new Error('Attempting to write to the schedule; But no more slots remain');
    }
}

export const main = async () => {
    const [action, param] = process.argv.slice(2);
    let todo: Function;
    switch (action) {
        case(ACTIONS.CHOOSE):
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
        case(ACTIONS.UPDATE):
            todo = (() => makeDataSet(Boolean(param)));
            break;
        default:
            todo = (() => console.log('Unknown action'));
    }
    await todo();
    process.exit()
};

await main();
