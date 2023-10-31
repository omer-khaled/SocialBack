import path from 'path';
import {fileURLToPath} from 'url';

const rootPath = path.join(path.dirname(fileURLToPath(import.meta.url)),'..');

export default  rootPath;