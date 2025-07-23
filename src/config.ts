import {LogLv, localTimeString} from './util.ts';

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
    CITATION_STYLE: 'modern-language-association',
    LOOKUP_ADDITIVE: false,
    HUMAN_READABLE: true,
    MAKE: {
       clear: false,
       additive: false,
    }
}

export const LOG = {
    LEVEL: LogLv.normal,
    WRITE_FILE: false,
    FILE: `paper-picker_${localTimeString()}.log`,
}

export const REQUEST = {
    TIMEOUT_DELAY: 10_000, // timeout requests after 10 seconds
    API_CALL_DELAY: 500,
    MAX_REDIRECTS: 20,
};

export const SCHEDULE_EMPTY_LINE_RE: RegExp = /Paper\s+\d+\s+discussion/;
