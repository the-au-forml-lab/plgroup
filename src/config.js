/**
 * Crossref request URL - where to request paper details.
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
     * A dataset of papers.
     * @constant
     * @type {string}
     */
    PAPERS: './data/papers.json',
    /**
     * List of full website URLs ("https://...") from where to find papers.
     * Alternatively, since some webpages can be difficult to crawl, lazy load,
     * set cookies, redirect, etc., this a list item can be a physical, local
     * cached file, of a website with DOIs.
     * @constant
     * @type {string}
     */
    SOURCES: './data/sources.txt',
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
     * List of DOIs of previously read papers for the current semester.
     * @constant
     * @type {string}
     */
    SEMESTER_PAPERS: './data/past.txt',
    /**
     * List of DOIs of previously read papers, for all time.
     * We maintain this history for many reasons, one of which is to
     * prevent previous paper from being selected again.
     * @constant
     * @type {string}
     */
    ALLTIME_HISTORY: './data/history.txt',
    /**
     * List of stop words.
     * Papers containing stop words are automatically omitted from
     * papers dataset.
     * @constant
     * @type {string}
     */
    STOPWORDS: './data/stopwords.txt',
    /**
     * Website "next paper" file (auto-updated).
     * Used to display current paper selection.
     * @constant
     * @type {string}
     */
    WEB_NEXT: './docs/next.md',
    /**
     * Website "papers list" file (auto-updated).
     * Used to display a list of papers.
     * @constant
     * @type {string}
     */
    WEB_PAPERS: './docs/papers.md'
}

/**
 * Available CLI commands.
 * This is handled by "main method" in index.js.
 */
export const ACTIONS = {
    /**
     * Choose next paper.
     * @constant
     * @type {string}
     */
    CHOOSE: 'choose',
    /**
     * Get paper meta data for a specific DOI.
     * @constant
     * @type {string}
     */
    DETAILS: 'details',
    /**
     * Set the next paper to specific DOI.
     * @constant
     * @type {string}
     */
    SET: 'set',
    /**
     * Display paper data statistics.
     * @constant
     * @type {string}
     */
    STATS: 'stats',
    /**
     * Update papers database.
     * @constant
     * @type {string}
     */
    UPDATE: 'update',
    /**
     * Update website paper details.
     * @constant
     * @type {string}
     */
    WEB: 'web'
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
    mla: 'mla',
    /**
     * For accessing paper citation in papers dataset in bibtex format
     * @constant
     * @type {string}
     */
    bib: 'bib'
}

/**
 * Other config options
 */
export const CONFIG = {
    /**
     * Max allowed URL request redirects.
     */
    MAX_REDIRS: 20,
    DOI_ORG_DOMAIN: 'https://doi.org'
}