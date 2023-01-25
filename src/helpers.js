/**
 * Collection of helper methods, mostly for I/O.
 */

import fs from 'fs'

/**
 * Read file as string.
 * @param fileName - name of file
 * @returns {Promise<string>} - file content as string
 */
export const readFile = async fileName =>
    !fs.existsSync(fileName) ? '' :
        ((await fs.promises.readFile(fileName)) || '').toString()

/**
 * Read lines of text from file.
 * @param fileName - name of file
 * @returns {Promise<*>} - string array of text
 */
export const readLines = async fileName =>
    (await readFile(fileName)).split("\n")

/**
 * Write to file.
 * @param {string} fileName - name of file
 * @param {string} content - text to write
 */
export const writeFile = (fileName, content) =>
    fs.writeFileSync(fileName, content,
        {encoding: 'utf8', flag: 'w'})

/**
 * Append a line of text to existing file.
 * @param {string} fileName - name of file
 * @param {string} content - text to append
 */
export const appendLine = (fileName, content) =>
    fs.appendFileSync(fileName, `\n${content}`)

/**
 * Read a JSON file. If read fails it returns an empty object.
 * @param {string} fileName - name of file
 * @returns {Promise<{}>} - JSON object
 */
export const loadJson = async (fileName) => {
    try {
        return JSON.parse(await readFile(fileName));
    } catch {
        return {}
    }
}