import path from 'path';
import fs from 'fs';

const DATA_DIR = 'data';

/**
 * Reads object/array from a JSON file.
 * @param fileName Plain name of the file (no path). File extension not required. For example: 'users'
 * @return {any} Data from file as js type.
 */
function read(fileName) {
    const filePath = getDataFilePath(fileName)
    return JSON.parse(fs.readFileSync(filePath, {encoding:'utf8'}));
}

/**
 * Write a javascript data object to a JSON file.
 * @param fileName Plain name of the file (no path). File extension not required. For example: 'users'
 * @param data The object or array to write to the file.
 */
function write(fileName, data) {
    const filePath = getDataFilePath(fileName)
    return fs.writeFileSync(filePath, JSON.stringify(data, null, 2), {encoding:'utf8'});
}

function getDataFilePath(fileName){
    if (!fileName.endsWith('.json')){
        fileName += '.json'
    }
    const filePath = path.join(process.cwd(), DATA_DIR, fileName);
    if (!fs.existsSync(filePath)){
        throw new Error(`The file "${filePath}" does not exist, please make sure your working directory is the project root directory.`)
    }
    return filePath;
}

export {read, write};



