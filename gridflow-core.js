/*
 * GridFlow core: zero-dependency India Post DIGIPIN math and validators.
 * Generated DIGIPINs use the official Department of Posts final grid.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.GridFlow = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var GRID = "FC98J327K456LMPT";
  var BOUNDS = Object.freeze({ minLat: 2.5, maxLat: 38.5, minLon: 63.5, maxLon: 99.5 });
  var OFFICIAL_RE = /^[23456789CFJKLMPT]{3}-[23456789CFJKLMPT]{3}-[23456789CFJKLMPT]{4}$/;
  var STRICT_DIRECT_RE = /^[2-9JKMPWGX]{3}-[2-9JKMPWGX]{3}-[2-9JKMPWGX]{4}$/;

  function number(value, label) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new TypeError(label + " must be a finite number.");
    return parsed;
  }

  function inBounds(lat, lon) {
    return lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat && lon >= BOUNDS.minLon && lon <= BOUNDS.maxLon;
  }

  function encode(lat, lon) {
    lat = number(lat, "Latitude");
    lon = number(lon, "Longitude");
    if (!inBounds(lat, lon)) throw new RangeError("Coordinate is outside the India DIGIPIN bounds.");

    var minLat = BOUNDS.minLat;
    var maxLat = BOUNDS.maxLat;
    var minLon = BOUNDS.minLon;
    var maxLon = BOUNDS.maxLon;
    var out = "";

    for (var i = 1; i <= 10; i += 1) {
      var latStep = (maxLat - minLat) * 0.25;
      var lonStep = (maxLon - minLon) * 0.25;
      var row = Math.max(0, Math.min(3, Math.floor((maxLat - lat) / latStep)));
      var col = Math.max(0, Math.min(3, Math.floor((lon - minLon) / lonStep)));

      out += GRID.charAt(row * 4 + col);
      if (i === 3 || i === 6) out += "-";

      var nextMaxLat = maxLat - row * latStep;
      var nextMinLon = minLon + col * lonStep;
      minLat = nextMaxLat - latStep;
      maxLat = nextMaxLat;
      minLon = nextMinLon;
      maxLon = nextMinLon + lonStep;
    }
    return out;
  }

  function normalize(code) {
    return String(code || "").trim().toUpperCase().replace(/\s+/g, "");
  }

  function format(code) {
    var raw = normalize(code).replace(/-/g, "");
    if (raw.length !== 10) throw new Error("DIGIPIN must contain 10 symbols.");
    return raw.slice(0, 3) + "-" + raw.slice(3, 6) + "-" + raw.slice(6);
  }

  function isDirectEntry(code) {
    var formatted;
    try {
      formatted = format(code);
    } catch (error) {
      return false;
    }
    return OFFICIAL_RE.test(formatted) || STRICT_DIRECT_RE.test(formatted);
  }

  function decode(code) {
    var raw = format(code).replace(/-/g, "");
    var minLat = BOUNDS.minLat;
    var maxLat = BOUNDS.maxLat;
    var minLon = BOUNDS.minLon;
    var maxLon = BOUNDS.maxLon;

    for (var i = 0; i < raw.length; i += 1) {
      var index = GRID.indexOf(raw.charAt(i));
      if (index < 0) throw new Error("Invalid official DIGIPIN symbol.");

      var row = Math.floor(index / 4);
      var col = index % 4;
      var latStep = (maxLat - minLat) * 0.25;
      var lonStep = (maxLon - minLon) * 0.25;
      var nextMaxLat = maxLat - row * latStep;
      var nextMinLon = minLon + col * lonStep;

      minLat = nextMaxLat - latStep;
      maxLat = nextMaxLat;
      minLon = nextMinLon;
      maxLon = nextMinLon + lonStep;
    }

    return {
      lat: (minLat + maxLat) / 2,
      lon: (minLon + maxLon) / 2,
      bbox: [minLat, minLon, maxLat, maxLon]
    };
  }

  function encodeTimed(lat, lon) {
    var start = performance && performance.now ? performance.now() : Date.now();
    var digipin = encode(lat, lon);
    var end = performance && performance.now ? performance.now() : Date.now();
    return { digipin: digipin, ms: end - start };
  }

  return Object.freeze({
    BOUNDS: BOUNDS,
    OFFICIAL_RE: OFFICIAL_RE,
    STRICT_DIRECT_RE: STRICT_DIRECT_RE,
    decode: decode,
    encode: encode,
    encodeTimed: encodeTimed,
    format: format,
    inBounds: inBounds,
    isDirectEntry: isDirectEntry,
    normalize: normalize
  });
});
