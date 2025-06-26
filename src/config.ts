import {LogLv} from './util.js';

export const FILES = {
    PAPERS: './data/papers.json',
    VENUES: './data/sources.csv',
    ALLTIME_HISTORY: './data/history.txt',
    STOPWORDS: './data/stopwords.txt',
    ACTION_VARS: './data/vars.txt',
    WEB_PAPERS: './docs/papers.md',
    WEB_INDEX: './docs/index.md',
};

export const DBLP = {
    DOMAIN: 'https://dblp.org',
    DOMAIN_BACKUP: 'https://dblp.uni-trier.de',
    PATH: '/search/publ/api',
    QUERY: (venue: string, year: number) =>
        `/?q=stream:conf/${venue}: year:${year}`
        + '&format=json&h=1000',
};

export const ACTIONS = {
    CHOOSE: 'choose',
    DETAILS: 'details',
    SET: 'set',
    STATS: 'stats',
    UPDATE: 'update',
}

export const DATASET = {
    citationStyle: 'modern-language-association',
}


export const CONFIG = {
    LOG_LEVEL: LogLv.normal,
    API_CALL_DELAY: 500,
    MAX_REDIRECTS: 20,
}
