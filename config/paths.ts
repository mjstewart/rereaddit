import * as path from 'path';

// Go up 1 as we are in config folder
export const PROJECT_ROOT = path.resolve(__dirname, '../');

/**
 * Since the real webpack config is within a config folder, __dirname does
 * not refer to the project root, so this function adds the supplied
 * pathSegment based on project root by going up using 2 dots ..
 *
 * @param pathSegment
 */
const resolvePath = (pathSegment: string) => path.resolve(PROJECT_ROOT, pathSegment);

export const SRC = resolvePath('src');
export const DIST = resolvePath('dist');
export const JS = resolvePath('src/js');
export const STYLES = resolvePath('src/styles');
export const VIEWS = resolvePath('src/views');
