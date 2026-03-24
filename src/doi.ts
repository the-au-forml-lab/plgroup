import {DATASET} from './config.ts';
import {type Headers, readUrl} from './request.ts';
import {log, LogLv, spaceFix} from './util.ts';
import {type Paper, DataSet} from './dataset.ts';

function normalizeDoi(k : string) : string {
    const url : URL = new URL(k, 'https://doi.org/');
    return url.pathname.slice(1); // remove the leading slash from pathname
}

async function getTitle(doi:string): Promise<string> {
    const url = `https://doi.org/${doi}`;
    const headers: Headers = {
        Accept: 'application/vnd.citationstyles.csl+json'
    };
    const title = spaceFix(JSON.parse(await readUrl(url, headers)).title);
    log(LogLv.normal, `Retrieved title for DOI ${doi}`);
    return title;
}

async function getCitation(doi: string): Promise<string> {
    const searchParams = new URLSearchParams({
        doi,
        style: DATASET.CITATION_STYLE,
        lang: 'en-US',
    });
    const url = `https://citation.doi.org/format?${searchParams}`;
    const citation = spaceFix(await readUrl(url));
    log(LogLv.normal, `Retrieved citation for DOI ${doi}`);
    return citation;
}

async function getDetails(doi: string): Promise<Paper> {
    const [title, citation] = await Promise.all([
        getTitle(doi),
        getCitation(doi),
    ]);
    return {doi, title, citation};
}

export async function lookupDoi(doi: string): Promise<Paper> {
    doi = normalizeDoi(doi);
    const dataSet = DataSet.load();
    const paper = dataSet.get(doi) ?? await getDetails(doi);
    return paper;
}

export async function insertDoi(doi: string): Promise<void> {
    doi = normalizeDoi(doi);
    const dataSet = DataSet.load();
    const paper = await lookupDoi(doi);
    dataSet.insert(paper);
    dataSet.write();
}
