/*
 * India Post DIGIPIN encoder/decoder.
 *
 * Source of algorithm: Department of Posts DIGIPIN Technical Document,
 * Annexure programming code. This implementation keeps the same 4x4
 * anti-clockwise spiral labelling grid and boundary box, without alerts or DOM
 * side effects, so it is safe inside checkout pages and tests.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.DigiPinEncoder = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var GRID = [
    ["F", "C", "9", "8"],
    ["J", "3", "2", "7"],
    ["K", "4", "5", "6"],
    ["L", "M", "P", "T"]
  ];

  var BOUNDS = Object.freeze({
    minLat: 2.5,
    maxLat: 38.5,
    minLon: 63.5,
    maxLon: 99.5
  });

  var FINAL_DIGIPIN_RE = /^[23456789CFJKLMPT]{3}-[23456789CFJKLMPT]{3}-[23456789CFJKLMPT]{4}$/;
  var LEGACY_DIRECT_ENTRY_RE = /^[2-9JKMPWGX]{3}-[2-9JKMPWGX]{3}-[2-9JKMPWGX]{4}$/;

  function assertFiniteNumber(value, name) {
    var numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      throw new TypeError(name + " must be a finite number.");
    }
    return numeric;
  }

  function assertInBounds(lat, lon) {
    if (lat < BOUNDS.minLat || lat > BOUNDS.maxLat) {
      throw new RangeError("Latitude is outside the DIGIPIN India bounding box.");
    }
    if (lon < BOUNDS.minLon || lon > BOUNDS.maxLon) {
      throw new RangeError("Longitude is outside the DIGIPIN India bounding box.");
    }
  }

  function clampGridIndex(index) {
    return Math.max(0, Math.min(3, index));
  }

  function encode(lat, lon) {
    lat = assertFiniteNumber(lat, "Latitude");
    lon = assertFiniteNumber(lon, "Longitude");
    assertInBounds(lat, lon);

    var minLat = BOUNDS.minLat;
    var maxLat = BOUNDS.maxLat;
    var minLon = BOUNDS.minLon;
    var maxLon = BOUNDS.maxLon;
    var code = "";

    for (var level = 1; level <= 10; level += 1) {
      var latStep = (maxLat - minLat) / 4;
      var lonStep = (maxLon - minLon) / 4;

      var row = clampGridIndex(Math.floor((maxLat - lat) / latStep));
      var column = clampGridIndex(Math.floor((lon - minLon) / lonStep));

      code += GRID[row][column];

      if (level === 3 || level === 6) {
        code += "-";
      }

      var nextMaxLat = maxLat - row * latStep;
      var nextMinLat = nextMaxLat - latStep;
      var nextMinLon = minLon + column * lonStep;
      var nextMaxLon = nextMinLon + lonStep;

      minLat = nextMinLat;
      maxLat = nextMaxLat;
      minLon = nextMinLon;
      maxLon = nextMaxLon;
    }

    return code;
  }

  function normalize(code) {
    return String(code || "").trim().toUpperCase().replace(/\s+/g, "");
  }

  function format(code) {
    var raw = normalize(code).replace(/-/g, "");
    if (raw.length !== 10) {
      throw new Error("DIGIPIN must contain exactly 10 symbols.");
    }
    return raw.slice(0, 3) + "-" + raw.slice(3, 6) + "-" + raw.slice(6);
  }

  function isValid(code, options) {
    var formatted;
    options = options || {};

    try {
      formatted = format(code);
    } catch (error) {
      return false;
    }

    if (FINAL_DIGIPIN_RE.test(formatted)) {
      return true;
    }

    return options.allowLegacy === true && LEGACY_DIRECT_ENTRY_RE.test(formatted);
  }

  function decode(code) {
    var raw = format(code).replace(/-/g, "");
    var minLat = BOUNDS.minLat;
    var maxLat = BOUNDS.maxLat;
    var minLon = BOUNDS.minLon;
    var maxLon = BOUNDS.maxLon;

    for (var level = 0; level < raw.length; level += 1) {
      var symbol = raw.charAt(level);
      var row = -1;
      var column = -1;

      for (var r = 0; r < 4; r += 1) {
        for (var c = 0; c < 4; c += 1) {
          if (GRID[r][c] === symbol) {
            row = r;
            column = c;
            break;
          }
        }
        if (row !== -1) {
          break;
        }
      }

      if (row === -1) {
        throw new Error("Invalid DIGIPIN symbol: " + symbol);
      }

      var latStep = (maxLat - minLat) / 4;
      var lonStep = (maxLon - minLon) / 4;
      var nextMaxLat = maxLat - row * latStep;
      var nextMinLat = nextMaxLat - latStep;
      var nextMinLon = minLon + column * lonStep;
      var nextMaxLon = nextMinLon + lonStep;

      minLat = nextMinLat;
      maxLat = nextMaxLat;
      minLon = nextMinLon;
      maxLon = nextMaxLon;
    }

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      bounds: {
        minLat: minLat,
        maxLat: maxLat,
        minLon: minLon,
        maxLon: maxLon
      }
    };
  }

  return Object.freeze({
    BOUNDS: BOUNDS,
    GRID: GRID.map(function (row) { return row.slice(); }),
    FINAL_DIGIPIN_RE: FINAL_DIGIPIN_RE,
    LEGACY_DIRECT_ENTRY_RE: LEGACY_DIRECT_ENTRY_RE,
    decode: decode,
    encode: encode,
    format: format,
    isValid: isValid,
    normalize: normalize
  });
});
