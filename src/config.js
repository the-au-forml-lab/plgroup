/**
 * Paths to data files.
 * Read description to understand role of each file.
 *
 * Note: All text files (.txt) should contain one entry per line.
 */
export const FILES = {
    /**
     * A dataset of papers and their metadata.
     * @constant
     * @type {string}
     */
    PAPERS: '../files/papers.json',
    /**
     * SIGPLAN website URLs where to look for papers
     * @constant
     * @type {string}
     */
    SRC_FILE: '../files/sources.txt',
    /**
     * DOI of the "next paper" to be read.
     * @constant
     * @type {string}
     */
    NEXT_FILE: '../files/next.txt',
    /**
     * Metadata of the next paper to be read.
     * @constant
     * @type {string}
     */
    NEXT_DESC: '../files/desc.txt',
    /**
     * List of DOIs of previously read or rejected papers.
     * @constant
     * @type {string}
     */
    PAST_FILE: '../files/past.txt',
    /**
     * List of stop words. Papers containing stop words are
     * automatically omitted from dataset.
     * @constant
     * @type {string}
     */
    STOPWORDS: '../files/stopwords.txt'
}

/**
 * Available commands.
 */
export const ACTIONS = {
    /**
     * Set next paper to specific DOI
     * @constant
     * @type {string}
     */
    SET: 'set',
    /**
     * Update papers database
     * @constant
     * @type {string}
     */
    FETCH: 'fetch',
    /**
     * Choose next paper
     * @constant
     * @type {string}
     */
    CHOOSE: 'choose'
}