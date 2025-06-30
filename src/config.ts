import {LogLv} from './util.ts';

export const FILES = {
    PAPERS: './data/papers.json',
    VENUES: './data/sources.csv',
    ALLTIME_HISTORY: './data/history.txt',
    STOPWORDS: './data/stopwords.txt',
    ACTION_VARS: './data/vars.txt',
    WEB_PAPERS: './docs/papers.md',
    WEB_INDEX: './docs/index.md',
};

export const DATASET = {
    citationStyle: 'modern-language-association',
}

export const LOG_LEVEL = LogLv.normal;

export const DEBUG_JSON = false;

export const REQUEST = {
    API_CALL_DELAY: 1000,
    MAX_REDIRECTS: 20,
};

export const SCHEDULE_EMPTY_LINE_RE: RegExp = /Paper\s+\d+\s+discussion/;
