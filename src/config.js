/**
 * Build request URL for paper details.
 * @param doi - DOI -only- (not URL)
 * @returns - CrossRef url for DOI.
 */
export const XREF = doi =>
    `https://api.crossref.org/works/${doi}/transform/application/vnd.crossref.unixsd+xml`

/**
 * Key for accessing paper metadata (in papers dataset).
 * @constant
 * @type {string}
 */
export const metaK = 'mla'

/**
 * Regular expression to match DOI urls.
 * @type {RegExp}
 */
export const DoiRE = /https?:\/\/(www\.|)?doi\.org\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/g

/**
 * Paths to data files.
 * Read descriptions below to understand purpose of each file.
 *
 * Note: All text files (.txt) should contain one entry per line.
 */
export const FILES = {
    /**
     * Website index page.
     * Used to write current and list of previous papers.
     * @constant
     * @type {string}
     */
    WEBPAGE: './docs/index.md',
    /**
     * A dataset of papers.
     * @constant
     * @type {string}
     */
    PAPERS: './data/papers.json',
    /**
     * SIGPLAN website URLs, from where to find papers.
     * @constant
     * @type {string}
     */
    SRC_FILE: './data/sources.txt',
    /**
     * DOI of the next paper to be read.
     * @constant
     * @type {string}
     */
    NEXT_FILE: './data/next.txt',
    /**
     * Meta data (title, authors, etc.) of the next paper to be read.
     * @constant
     * @type {string}
     */
    NEXT_DESC: './data/desc.txt',
    /**
     * List of DOIs of previously read papers.
     *
     * We maintain this history for many reasons, one of which is to
     * prevent previous paper from being selected again.
     * @constant
     * @type {string}
     */
    PAST_FILE: './data/past.txt',
    /**
     * List of stop words.
     *
     * Papers containing stop words are automatically omitted from
     * papers dataset.
     * @constant
     * @type {string}
     */
    STOPWORDS: './data/stopwords.txt'
}

/**
 * Available CLI commands.
 * This is handled by "main method" in index.js.
 */
export const ACTIONS = {
    /**
     * Set the next paper to specific DOI.
     * @constant
     * @type {string}
     */
    SET: 'set',
    /**
     * Update papers database.
     * @constant
     * @type {string}
     */
    FETCH: 'fetch',
    /**
     * Choose next paper.
     * @constant
     * @type {string}
     */
    CHOOSE: 'choose',
    /**
     * Update website paper details.
     * @constant
     * @type {string}
     */
    WEB: 'web',
    /**
     * Display paper data statistics.
     * @constant
     * @type {string}
     */
    STATS: 'stats'
}

/**
 * Keys for finding content markers in the web page.
 * The webpage is specified by FILES.WEBPAGE.
 * @type {Object}
 */
export const KEYS = {
    /**
     * Anchor for where to write next paper details.
     * @constant
     * @type {Object}
     */
    NEXT: {
        START: "<!-- next_start -->",
        END: "<!-- next_end -->"
    },
    /**
     * Anchor for where to write papers history.
     * @constant
     * @type {Object}
     */
    HIST: {
        START: "<!-- prev_start -->",
        END: "<!-- prev_end -->"
    }
}