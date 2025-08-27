import {LogLv, localTimeString} from './util.ts';

/**
 * Filepaths which are read and/or written by the program
 */
export const FILES = {
    /**
     * the dataset of papers
     */
    PAPERS: './data/papers.json',

    /**
     * list of DBLP venues to get papers from
     */
    VENUES: './data/sources.csv',

    /**
     * list of all previously selected papers
     */
    ALLTIME_HISTORY: './data/history.txt',

    /**
     * list of keywords to block from selection
     */
    STOPWORDS: './data/stopwords.txt',

    /**
     * temporary file for communicating between steps in a github-actions
     * workflow
     */
    ACTION_VARS: './data/vars.txt',

    /**
     * list of paper citations on the website
     */
    WEB_PAPERS: './docs/papers.md',

    /**
     * main website for current semester
     */
    WEB_INDEX: './docs/index.md',
};

/**
 * controls the construction of the dataset, which is stored in `FILES.PAPERS`.
 */
export const DATASET = {
    /**
     * Citation style to use; For a list of valid citation styles go to
     * [https://citation.doi.org] and check the relevant dropdown menu .
     */
     CITATION_STYLE: 'modern-language-association',

    /**
     * Whether to write the dataset in human-readable JSON, i.e. with line
     * breaks and indentation. Disabling this saves space, but causes large
     * diffs since everything goes on one line.
     */
    HUMAN_READABLE: true,

    /**
     * If `true`, papers will only be added to the dataset. If `false`, old
     * papers will be deleted during dataset updates.
     */
    KEEP_OLD_PAPERS: false
}

export const LOG = {
    /**
     * level of verbosity for logging. see the file `util.ts` for valid options.
     */
    LEVEL: LogLv.normal,

    /**
     * when enabled log will be written to a file IN ADDITION to being printed
     * to stdout
     */
    WRITE_FILE: false,

    /**
     * the file to write to if `WRITE_FILE` is anabled.
     */
    FILE: `paper-picker_${localTimeString()}.log`,
}

export const REQUEST = {
    /**
     * the amount of time after which http requests time out, in milliseconds
     */
    TIMEOUT_DELAY: 10_000,

    /**
     * delay between consecutive API calls in milliseconds, currently unused
     */
    API_CALL_DELAY: 500,

    /**
     * maximum number of redirects for a http request
     */
    MAX_REDIRECTS: 20,
};


/**
 * regular expression to match empty lines in the schedule inside
 * `FILES.WEB_INDEX`.
 */
export const SCHEDULE_PLACEHOLDER_RE: RegExp = /Paper\s+\d+\s+discussion/;

export const DBLP = {
    /**
     * Array of domains on which mirrors of DBLP are hosted.
     * Each of these will be queried for a response.
     * You probably don't need to modify this.
     */
    DOMAINS: [
        'https://dblp.org',
        'https://dblp.uni-trier.de',
    ],
    /**
     * The maximum number of hits retrieved from the DBLP API for any
     * one conference.
     * If this is lower than the total number of papers at a given conference,
     * DBLP will choose which hits to serve (probably in the order as they
     * appear on the DBLP website).
     */
    MAX_HITS_PER_CONFERENCE: 1000,
}
