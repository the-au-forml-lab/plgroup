/**
 * Collection of helper methods, mostly for various I/O operations.
 */
import fs from 'fs'
import {FILES as F} from './config.js';

/**
 * Wrapper for file system operations.
 */
export const FileSystem = class {

    static async loadPapers() {
        return FileSystem.loadJson(F.PAPERS)
    }

    /**
     * Read any file content as string.
     * @param fileName - Path to file.
     * @returns {Promise<string>} - File content as one string.
     */
    static readFile = async fileName =>
        !fs.existsSync(fileName) ? '' :
            ((await fs.promises.readFile(fileName)) || '').toString()

    /**
     * Read any file content as lines on text.
     * @param fileName - Path to file.
     * @returns {Promise<*>} - String array of lines of text.
     */
    static readLines = async fileName =>
        ((await FileSystem.readFile(fileName))
            .split("\n")).filter(w => w)

    /**
     * Write some text to a file.
     * If file does not exist, it will be created.
     * @param {string} fileName - Path to file.
     * @param {string} content - Text to write.
     */
    static writeFile = (fileName, content) =>
        fs.writeFileSync(fileName, content,
            {encoding: 'utf8', flag: 'w'})

    /**
     * Append a line of text to the end of an existing file.
     * @param {string} fileName - Path to file.
     * @param {string} content - Text to append.
     */
    static append = (fileName, content) =>
        fs.appendFileSync(fileName, `\n${content}`)

    /**
     * Read and parse a JSON file.
     * On error, this method returns an empty object.
     * @param {string} fileName - Path to file.
     * @returns {Promise<{}>} - Object.
     */
    static loadJson = async (fileName) => {
        try {
            return JSON.parse(await FileSystem.readFile(fileName));
        } catch {
            return {}
        }
    }
}

/**
 * Collection of text-formatting helpers and pattern matchers.
 */
export const TextParser = class {

    static get DoiRE() {
        return /https?:\/\/(www\.|)?doi\.org\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/g
    }
    static get ScheduleRE(){
        return /Paper \d+ discussion/
    }

    /**
     * Remove excess whitespace; double-space, etc.
     * @param {string} s - string to search
     * @returns {string}
     */
    static spaceFix(s) {
        return (s || '').replace(/\s\s+/g, ' ').trim()
    }

    /**
     * Replace plaintext DOI URL with a hyperlink.
     * @param {string} plain - Plain text string to search.
     * @param {string} doi - DOI to match.
     */
    static hyperDOI(plain, doi) {
        const href = `<a href='${doi}' target='_blank'>${doi}</a>`
        return (plain || '').replace(doi, href)
    }

    static bibMatch(bib, ...keys) {
        if (!bib || !bib.length) return ""
        for (let i = 0; i < keys.length; i++) {
            const re = new RegExp
            (keys[i] + '=\\{([^}]+)}', 'i')
            const m = bib.match(re)
            if (m) return m[1];
        }
        return null
    }

    /**
     * Get paper title from mla-format reference
     * @param {string} bib: string
     */
    static title = (bib) =>
        TextParser.spaceFix(this.bibMatch(bib, 'title'))

    /**
     * Try to get conference name.
     * @param {string} bib
     */
    static conference = (bib) => {
        let x = this.bibMatch(bib, 'number', 'journal')
        if (!x || /^\d+$/.test(x))
            x = this.bibMatch(bib, 'journal')
        return x
    }

    /**
     * Try parse abstract text from crossref xml format.
     * @param {string} xml
     */
    static abstract(xml) {
        let aIdx = xml.indexOf("<jats:abstract")
        if (aIdx < 0) return null;
        const absETag = "</jats:abstract>"
        const absE = xml.indexOf(absETag) - 1
        const absS = aIdx + xml.substring(aIdx).indexOf(">") + 1
        return TextParser.spaceFix(
            xml.substring(absS, absE)
                .replace(/[^\S ]+/g, '')
                .replace(/<!\[CDATA\[(.*)]]>/gm,'')
                .replace(/<(\/?)jats:([^>]+)>/g, ''))
    }
}

/**
 *  Randomize array in-place using Durstenfeld shuffle algorithm
 *  credit: https://stackoverflow.com/a/12646864
 */
export const shuffle = function (array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}