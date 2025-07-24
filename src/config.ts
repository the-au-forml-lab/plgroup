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
    WEB_PAPERS: './site/papers.md',

    /**
     * main website for current semester
     */
    WEB_INDEX: './site/index.md',
};

/**
 * controls the construction of the dataset, which is stored in `FILES.PAPERS`.
 */ 
export const DATASET = {
    /**
     * citation style to use; for a list of valid citation styles go to
     * `https://citation.doi.org` and check the relevant dropdown menu (it can
     * also be searched by typing)
     */
    CITATION_STYLE: 'modern-language-association',

    /**
     * whether to write the dataset in human-readable format, i.e. with line
     * breaks and indentation. disabling this saves space, but causes large
     * diffs since everything goes on one line.
     */
    goes on one line.
        HUMAN_READABLE: true,

    /**
     * options for the process of constructing the dataset.
     */
    MAKE: {
        /**
         * when enabled, data set will be re-built from scratch every
         * time. otherwise the existing dataset is used as a cache to minimize
         * the number of API calls.
         */
        clear: false,

        /**
         * when enabled, keep old papers in the dataset, otherwise delete them.
         */
        additive: false,
    }
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
export const SCHEDULE_EMPTY_LINE_RE: RegExp = /Paper\s+\d+\s+discussion/;
