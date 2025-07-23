import {DATASET} from './config.ts';
import {type Headers, readUrl} from './request.ts';
import {log, LogLv, spaceFix} from './util.ts';
import {type Paper, DataSet} from './dataset.ts';

export async function getTitle(doi:string): Promise<string> {
    const url = `https://doi.org/${doi}`;
    const headers: Headers = {
        Accept: 'application/vnd.citationstyles.csl+json'
    };
    const title = spaceFix(JSON.parse(await readUrl(url, headers)).title);
    log(LogLv.normal, `Retrieved title for DOI ${doi}`);
    return title;
}

export async function getCitation(doi: string): Promise<string> {
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

async function lookupDoiNoCache(doi: string): Promise<Paper> {
    const [title, citation] = await Promise.all([
        getTitle(doi),
        getCitation(doi),
    ]);
    return {doi, title, citation};
}

export async function lookupDoi(
    doi: string,
    additive=DATASET.LOOKUP_ADDITIVE
): Promise<Paper> {
    const dataSet = DataSet.load();
    const paper = dataSet.get(doi) ?? await lookupDoiNoCache(doi);
    if(additive){
        dataSet.insert(paper);
        dataSet.write();
    }
    return paper;
}
