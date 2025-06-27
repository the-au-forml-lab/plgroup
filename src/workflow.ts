import {FILES as F, SCHEDULE_EMPTY_LINE_RE} from './config.js';
import {Paper, DataSet, fetchDetails, loadPapers} from './dataset.js';
import {FileSystem as FS, log, LogLv} from './util.js';

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

function hasStopwords(paper: Paper): boolean {
    const stopwords: string[] = FS.readLines(F.STOPWORDS);
    for (const stop of stopwords){
        const re = new RegExp(stop, 'gmi');
        if(re.test(paper.title)){
            log('debug', `Rejecting paper: ${paper.title}`);
            return true;
        }
    }
    return false;
}

function updateSchedule(paper: Paper): void{
    const page = FS.readFile(F.WEB_INDEX);
    const match = SCHEDULE_EMPTY_LINE_RE.exec(page);
    if(match){
        const newIndex = page.replace(match[0], paper.title);
        FS.writeFile(F.WEB_INDEX, newIndex);
    } else {
        throw new Error('Attempting to write to the schedule; But no more slots remain');
    }
}

function updateWeb(paper: Paper): void{
    FS.append(F.WEB_PAPERS, formatWebCitation(paper));
    updateSchedule(paper);
}

function updateVars(paper: Paper): void{
    const vars: {[_:string]: string} = {
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
    FS.writeFile(F.ACTION_VARS, out.join('\n'));
}

export async function setNext(doi: string): Promise<void>{
    const paper: Paper = await fetchDetails({doi}, {additive: true});
    updateWeb(paper); // do this first since it can throw.
    updateVars(paper);
    FS.append(F.ALLTIME_HISTORY, doi);
}

export async function chooseNext(): Promise<void>{
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
