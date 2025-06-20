import { LogLv } from './util.js';
export const FILES = {
    PAPERS: './data/papers.json',
    VENUES: './data/sources.csv',
    SEMESTER_PAPERS: './data/past.txt',
    ALLTIME_HISTORY: './data/history.txt',
    STOPWORDS: './data/stopwords.txt',
    NEXT_DESC: './data/desc.txt',
    NEXT_FILE: './data/next.txt',
    WEB_PAPERS: './docs/papers.md',
    WEB_INDEX: './docs/index.md',
    LOG: './data/log.txt',
};
export const DBLP = {
    DOMAIN: 'https://dblp.org',
    DOMAIN_BACKUP: 'https://dblp.uni-trier.de',
    PATH: '/search/publ/api',
    QUERY: (venue, year) => `/?q=stream:conf/${venue}: year:${year}`
        + '&format=json&h=1000',
};
export const DOI = {
    DOI_DOMAIN: 'https://doi.org/',
};
export const LOG_LEVEL = LogLv.debug;
export const MAX_REDIRECTS = 20;
export const ACTIONS = {
    CHOOSE: 'choose',
    DETAILS: 'details',
    SET: 'set',
    STATS: 'stats',
    UPDATE: 'update',
    WEB: 'web',
};
