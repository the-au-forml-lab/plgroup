/**
 * Collection of helper methods, mostly for various I/O operations.
 */
import fs from 'fs'

/**
 * Read any file content as string.
 * @param fileName - Path to file.
 * @returns {Promise<string>} - File content as one string.
 */
export const readFile = async fileName =>
    !fs.existsSync(fileName) ? '' :
        ((await fs.promises.readFile(fileName)) || '').toString()

/**
 * Read any file content as lines on text.
 * @param fileName - Path to file.
 * @returns {Promise<*>} - String array of lines of text.
 */
export const readLines = async fileName =>
    (await readFile(fileName)).split("\n")

/**
 * Write some text to a file.
 * If file does not exist, it will be created.
 * @param {string} fileName - Path to file.
 * @param {string} content - Text to write.
 */
export const writeFile = (fileName, content) =>
    fs.writeFileSync(fileName, content,
        {encoding: 'utf8', flag: 'w'})

/**
 * Append a line of text to the end of an existing file.
 * @param {string} fileName - Path to file.
 * @param {string} content - Text to append.
 */
export const append = (fileName, content) =>
    fs.appendFileSync(fileName, `\n${content}`)

/**
 * Read and parse a JSON file.
 * On error, this method returns an empty object.
 * @param {string} fileName - Path to file.
 * @returns {Promise<{}>} - Object.
 */
export const loadJson = async (fileName) => {
    try {
        return JSON.parse(await readFile(fileName));
    } catch {
        return {}
    }
}