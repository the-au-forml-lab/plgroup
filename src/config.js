/**
 * Crossref request URL - used to get paper details.
 * @param doi - DOI -only- (not URL)
 * @returns - CrossRef url for DOI.
 */
export const XREF = doi =>
    `https://api.crossref.org/works/${doi}/transform/application/vnd.crossref.unixsd+xml`

/**
 * Paths to data files.
 * Read descriptions below to understand purpose of each file.
 *
 * Note: All text files (.txt) should contain one entry per line.
 */
export const FILES = {
    /**
     * Website "next paper" file
     * Used to write current paper selection.
     * @constant
     * @type {string}
     */
    WEB_NEXT: './docs/next.md',
    /**
     * Website "papers list" file
     * Used to write a list of papers.
     * @constant
     * @type {string}
     */
    WEB_PAPERS: './docs/papers.md',
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
     * Get paper meta data for a specific DOI.
     * @constant
     * @type {string}
     */
    DETAILS: 'details',
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
 * Keys Enum
 * @type {Object}
 */
export const KEYS = {
    /**
     * For accessing paper citation in papers dataset in MLA format.
     * @constant
     * @type {string}
     */
    m: 'mla',
    /**
     * For accessing paper citation in papers dataset in bibtex format
     * @constant
     * @type {string}
     */
    b: 'bib'
}

/**
 * Other config options
 */
export const CONFIG = {
    /**
     * Max allowed URL request redirects.
     */
    MAX_REDIRS: 20
}