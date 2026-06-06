/**
 * DIGIPIN Geospatial Encoder/Decoder Library
 * 100% offline, zero-dependency client-side implementation.
 * Maps coordinates to India's 4m x 4m hierarchical grid cells.
 */

export const BOUNDS = { minLat: 2.5, maxLat: 38.5, minLon: 63.5, maxLon: 99.5 };

const DIGIPIN_GRID = [
    ['F', 'C', '9', '8'],
    ['J', '3', '2', '7'],
    ['K', '4', '5', '6'],
    ['L', 'M', 'P', 'T'],
];

const CHAR_TO_COORD = {};
for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
        CHAR_TO_COORD[DIGIPIN_GRID[r][c]] = { row: r, col: c };
    }
}

// Regex matching official DIGIPIN string formats
// Supports official format (3-3-4 alphanumeric with hyphen)
// Official character set: 2-9, C, F, J, K, L, M, P, T (case-insensitive)
export const DIGIPIN_REGEX = /^[2-9CFJKLMPT]{3}-[2-9CFJKLMPT]{3}-[2-9CFJKLMPT]{4}$/i;

// Bypassing regex as requested in prompt: ^[2-9JKMPWGX]{3}-[2-9JKMPWGX]{3}-[2-9JKMPWGX]{4}$
export const BYPASS_REGEX = /^[2-9JKMPWGX]{3}-[2-9JKMPWGX]{3}-[2-9JKMPWGX]{4}$/i;

/**
 * Validate that coordinates are numeric and lie within India Post bounds
 */
export function validateCoordinates(lat, lon) {
    if (typeof lat !== 'number' || isNaN(lat) || typeof lon !== 'number' || isNaN(lon)) {
        throw new Error('Coordinates must be numeric values.');
    }
    if (lat < BOUNDS.minLat || lat > BOUNDS.maxLat || lon < BOUNDS.minLon || lon > BOUNDS.maxLon) {
        throw new Error(`Coordinates fall outside the valid India Post bounding box (Lat [2.5, 38.5], Lon [63.5, 99.5]). Found: Lat ${lat}, Lon ${lon}`);
    }
}

/**
 * Encode latitude & longitude into 10-character DIGIPIN format.
 * Options:
 *   - format: 'hyphenated' (default, e.g. XXX-XXX-XXXX) or 'compact' (e.g. XXXXXXXXXX)
 */
export function encode(lat, lon, options = {}) {
    const { format = 'hyphenated' } = options;
    validateCoordinates(lat, lon);
    
    let minLat = BOUNDS.minLat;
    let maxLat = BOUNDS.maxLat;
    let minLon = BOUNDS.minLon;
    let maxLon = BOUNDS.maxLon;
    
    let code = '';
    
    for (let level = 1; level <= 10; level++) {
        const latStep = (maxLat - minLat) / 4;
        const lonStep = (maxLon - minLon) / 4;
        
        let row = 3 - Math.floor((lat - minLat) / latStep);
        let col = Math.floor((lon - minLon) / lonStep);
        
        row = Math.min(3, Math.max(0, row));
        col = Math.min(3, Math.max(0, col));
        
        code += DIGIPIN_GRID[row][col];
        
        maxLat = minLat + latStep * (4 - row);
        minLat = minLat + latStep * (3 - row);
        minLon = minLon + lonStep * col;
        maxLon = minLon + lonStep;
    }
    
    if (format === 'compact') {
        return code;
    }
    return `${code.slice(0, 3)}-${code.slice(3, 6)}-${code.slice(6)}`;
}

/**
 * Decode a DIGIPIN string back into geographic coordinates (centroid and bounding box bounds).
 */
export function decode(pin) {
    if (typeof pin !== 'string') {
        throw new Error('DIGIPIN must be a string.');
    }
    
    const cleaned = pin.replace(/-/g, '').trim().toUpperCase();
    if (cleaned.length !== 10) {
        throw new Error(`Invalid DIGIPIN length: expected 10 alphanumeric characters. Received length ${cleaned.length}`);
    }
    
    let minLat = BOUNDS.minLat;
    let maxLat = BOUNDS.maxLat;
    let minLon = BOUNDS.minLon;
    let maxLon = BOUNDS.maxLon;
    
    for (const char of cleaned) {
        const coord = CHAR_TO_COORD[char];
        if (!coord) {
            throw new Error(`Invalid character in DIGIPIN code: "${char}"`);
        }
        
        const latStep = (maxLat - minLat) / 4;
        const lonStep = (maxLon - minLon) / 4;
        
        const newMaxLat = minLat + latStep * (4 - coord.row);
        const newMinLat = minLat + latStep * (3 - coord.row);
        const newMinLon = minLon + lonStep * coord.col;
        const newMaxLon = newMinLon + lonStep;
        
        minLat = newMinLat;
        maxLat = newMaxLat;
        minLon = newMinLon;
        maxLon = newMaxLon;
    }
    
    return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLon + maxLon) / 2,
        bounds: { minLat, maxLat, minLon, maxLon }
    };
}

/**
 * Return true if pin conforms to standard or bypass DIGIPIN format.
 */
export function isValidDigipin(pin) {
    if (typeof pin !== 'string') return false;
    const clean = pin.trim();
    return DIGIPIN_REGEX.test(clean) || BYPASS_REGEX.test(clean);
}

// Global scope registration for browser script tags
if (typeof window !== 'undefined') {
    window.DigipinEncoder = {
        BOUNDS,
        encode,
        decode,
        isValidDigipin,
        DIGIPIN_REGEX,
        BYPASS_REGEX,
        validateCoordinates
    };
}
