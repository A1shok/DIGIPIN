(function () {
  "use strict";

  var Core = window.GridFlow;
  var leafletPromise = null;
  var DEFAULT_DB = {
    v: 1,
    pins: {
      "110001": ["New Delhi GPO, Delhi", 28.622788, 77.213033, 28.595, 77.185, 28.65, 77.245, "dense"],
      "400001": ["Mumbai GPO, Maharashtra", 18.9388, 72.8354, 18.9, 72.795, 18.97, 72.87, "dense"],
      "560001": ["Bengaluru GPO, Karnataka", 12.9766, 77.5993, 12.94, 77.56, 13.01, 77.64, "dense"]
    }
  };

  var CSS = [
    ":host{all:initial;display:block;font-family:Inter,system-ui,-apple-system,'Segoe UI',sans-serif;color:#15202b}",
    "*,*::before,*::after{box-sizing:border-box}",
    ".card{border:1px solid #d6dee7;border-radius:8px;background:#fff;padding:16px;box-shadow:0 10px 26px rgba(15,23,42,.08);max-width:520px}",
    ".top{display:flex;gap:12px;align-items:flex-start}",
    ".badge{width:38px;height:38px;border-radius:8px;background:#116149;color:white;display:grid;place-items:center;font-weight:800}",
    "h2{margin:0 0 4px;font-size:18px;line-height:1.2;letter-spacing:0;color:#101828}",
    "p{margin:0;color:#526071;font-size:13px;line-height:1.45}",
    ".row{display:flex;gap:8px;margin-top:12px}.stack{display:flex;flex-direction:column;gap:8px;margin-top:12px}",
    "button{border:0;border-radius:8px;padding:12px 14px;min-height:44px;background:#116149;color:#fff;font:700 14px/1.1 inherit;cursor:pointer;transition:transform .16s ease,box-shadow .16s ease,background .16s ease}button:hover:not(:disabled){box-shadow:0 8px 20px rgba(17,97,73,.16);transform:translateY(-1px)}button:disabled{cursor:not-allowed;opacity:.58}",
    "button.alt{background:#f6faf8;color:#116149;border:1px solid #c9ddd5;box-shadow:none}",
    "button.link{background:transparent;border:0;color:#116149;min-height:auto;padding:8px 4px;box-shadow:none;text-decoration:underline;text-underline-offset:3px}",
    ".options{display:grid;gap:8px;margin-top:14px}.option{align-items:center;background:#fff;border:1px solid #d6dee7;border-radius:8px;color:#101828;display:grid;gap:4px;grid-template-columns:auto 1fr;padding:12px;text-align:left;width:100%;box-shadow:none}.option:hover:not(:disabled){border-color:#116149;background:#f6faf8}.option b{font-size:14px;line-height:1.2}.option span{color:#526071;font-size:12px;font-weight:600;line-height:1.35}.option .mark{align-items:center;background:#eef5f2;border:1px solid #c9ddd5;border-radius:999px;color:#116149;display:grid;font-size:12px;font-weight:900;height:24px;justify-content:center;width:24px}.option.primary{background:#116149;border-color:#116149;color:#fff}.option.primary span{color:#dff4ec}.option.primary .mark{background:#fff;color:#116149;border-color:#fff}",
    "input{width:100%;min-height:42px;border:1px solid #cbd5e1;border-radius:8px;padding:10px 11px;font:500 14px/1.2 inherit;background:#fff;color:#101828}",
    "input:focus{outline:2px solid #98d9c4;outline-offset:1px;border-color:#116149}",
    ".hidden{display:none!important}.status{margin-top:12px;color:#526071;font-size:13px;line-height:1.45}.ok{color:#0f766e;font-weight:750}.warn{color:#a15c00}.err{color:#b42318}",
    ".modal{position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.54);display:grid;place-items:center;padding:18px}",
    ".panel{width:min(94vw,480px);background:#fff;border-radius:8px;padding:16px;box-shadow:0 22px 60px rgba(0,0,0,.24)}",
    ".map{position:relative;width:100%;aspect-ratio:1;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;background:#f8fafc;background-image:linear-gradient(90deg,rgba(17,97,73,.15) 1px,transparent 1px),linear-gradient(rgba(17,97,73,.15) 1px,transparent 1px);background-size:10% 10%;touch-action:none;cursor:crosshair}",
    ".leafletMap{height:min(62vh,440px);aspect-ratio:auto;background:#e7eef2;background-image:none;cursor:grab}",
    ".leafletMap:active{cursor:grabbing}",
    ".leaflet-container{overflow:hidden;touch-action:none;font:12px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif}",
    ".leaflet-pane,.leaflet-tile,.leaflet-marker-icon,.leaflet-marker-shadow,.leaflet-tile-container,.leaflet-overlay-pane,.leaflet-shadow-pane,.leaflet-marker-pane,.leaflet-tooltip-pane,.leaflet-popup-pane,.leaflet-map-pane{position:absolute;left:0;top:0}",
    ".leaflet-map-pane{z-index:1}.leaflet-tile-pane{z-index:2}.leaflet-overlay-pane{z-index:4}.leaflet-shadow-pane{z-index:5}.leaflet-marker-pane{z-index:6}.leaflet-tooltip-pane{z-index:7}.leaflet-popup-pane{z-index:8}",
    ".leaflet-tile,.leaflet-marker-icon{user-select:none;-webkit-user-drag:none}.leaflet-container img{max-width:none!important;max-height:none!important}",
    ".leaflet-control{position:relative;z-index:800;pointer-events:auto}.leaflet-top,.leaflet-bottom{position:absolute;z-index:1000;pointer-events:none}.leaflet-top{top:10px}.leaflet-bottom{bottom:10px}.leaflet-left{left:10px}.leaflet-right{right:10px}.leaflet-control-zoom{border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;background:#fff}.leaflet-control-zoom a{display:block;width:30px;height:30px;text-align:center;line-height:30px;text-decoration:none;color:#111827;font-weight:800;background:#fff}.leaflet-control-attribution{background:rgba(255,255,255,.85);padding:2px 6px;border-radius:6px;color:#475569}",
    ".gfMarker{width:28px;height:28px;border-radius:999px;background:#e11d48;border:4px solid #fff;box-shadow:0 3px 12px rgba(15,23,42,.35);position:absolute}.gfMarker:after{content:'';position:absolute;left:8px;top:8px;width:4px;height:4px;border-radius:999px;background:#fff}",
    ".source{margin:10px 0 8px;padding:7px 9px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;color:#334155;font-size:12px;line-height:1.35}",
    ".mapHint{position:absolute;left:10px;right:10px;top:10px;z-index:2;border-radius:8px;background:rgba(255,255,255,.9);padding:8px 10px;font-size:12px;color:#334155;box-shadow:0 2px 10px rgba(15,23,42,.1);pointer-events:none}",
    ".cross{position:absolute;left:50%;top:50%;z-index:3;width:58px;height:58px;margin:-29px 0 0 -29px;border:2px solid rgba(225,29,72,.32);border-radius:999px;pointer-events:none}.cross:before,.cross:after{content:'';position:absolute;background:#e11d48;box-shadow:0 0 0 2px #fff}.cross:before{left:27px;top:3px;width:4px;height:52px}.cross:after{left:3px;top:27px;width:52px;height:4px}.cross i{position:absolute;left:23px;top:23px;width:12px;height:12px;border-radius:999px;background:#e11d48;border:2px solid #fff}",
    ".coord{font-size:12px;color:#526071;margin-top:8px}",
    "@media(max-width:760px){.row{flex-direction:column}.card{max-width:none}button{width:100%}.modal{place-items:end center;padding:12px}.panel{width:100%;max-height:92vh;overflow:auto}.leafletMap{height:min(58vh,420px)}}"
  ].join("");

  function qs(root, selector) { return root.querySelector(selector); }
  function pinOnly(value) { return String(value || "").replace(/\D/g, "").slice(0, 6); }
  function textOnly(value) { return String(value || "").trim().toLowerCase(); }
  function searchable(value) {
    return textOnly(value).replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function compactSearch(value) {
    return searchable(value).replace(/\s+/g, "");
  }
  function consonantKey(value) {
    return searchable(value).replace(/[aeiou]/g, "");
  }
  function wordIndex(haystack, needle) {
    return (" " + haystack + " ").indexOf(" " + needle + " ");
  }
  function fuzzyWordIndex(haystack, needle) {
    var hayWords = haystack.split(" ");
    var needleWords = needle.split(" ");

    for (var i = 0; i <= hayWords.length - needleWords.length; i += 1) {
      var matched = true;
      for (var j = 0; j < needleWords.length; j += 1) {
        var a = hayWords[i + j];
        var b = needleWords[j];
        if (a === b) continue;
        if (a.length >= 5 && b.length >= 5 && consonantKey(a) === consonantKey(b)) continue;
        matched = false;
        break;
      }
      if (matched) return i;
    }

    return -1;
  }
  function distanceKm(lat1, lon1, lat2, lon2) {
    var radius = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function setStatus(root, text, tone) {
    var node = qs(root, ".status");
    node.textContent = text;
    node.className = "status" + (tone ? " " + tone : "");
  }
  function storageKey(context) {
    var pin = pinOnly(context && context.pin);
    var core = searchable([context && context.address1, context && context.city, context && context.state].filter(Boolean).join(" "));
    core = core.split(" ").filter(function (token) {
      return token.length > 2 && !/^\d+$/.test(token) && !/^(?:and|the|near|road|street|line|cross|district|mandal|state)$/.test(token);
    }).slice(0, 10).join("-");
    return pin && core ? "gridflow:verified:" + pin + ":" + core : "";
  }
  function readVerified(context) {
    var key = storageKey(context);
    if (!key || !window.localStorage) return null;
    try {
      var row = JSON.parse(localStorage.getItem(key) || "null");
      if (!row || !Core.isDirectEntry(row.digipin)) return null;
      return row;
    } catch (error) {
      return null;
    }
  }
  function writeVerified(context, digipin, point, source) {
    var key = storageKey(context);
    if (!key || !window.localStorage) return;
    try {
      localStorage.setItem(key, JSON.stringify({
        digipin: digipin,
        lat: point && Number(point.lat),
        lon: point && Number(point.lon),
        label: searchable(context.address1).slice(0, 80),
        source: source || "confirmed",
        at: new Date().toISOString()
      }));
    } catch (error) {
      // Storage is optional; checkout must continue even if the browser blocks it.
    }
  }
  function dbEntryToObject(pin, row) {
    var bbox = { minLat: row[3], minLon: row[4], maxLat: row[5], maxLon: row[6] };
    return {
      pin: pin,
      label: row[0],
      lat: row[1],
      lon: row[2],
      bbox: bbox,
      searchBbox: deliverySearchBbox({ lat: row[1], lon: row[2], bbox: bbox }),
      dense: String(row[7] || "").indexOf("dense") !== -1
    };
  }
  function outlierSafeEntry(entry, db, pin) {
    var rows = db.localities && db.localities[pin];
    var usable = [];
    var latSum = 0;
    var lonSum = 0;
    var minLat = Infinity;
    var minLon = Infinity;
    var maxLat = -Infinity;
    var maxLon = -Infinity;
    var centerLat;
    var centerLon;
    var limitKm;

    if (!Array.isArray(rows) || rows.length < 2) {
      return entry;
    }

    centerLat = Number(entry.lat);
    centerLon = Number(entry.lon);
    limitKm = entry.dense ? 35 : 55;

    rows.forEach(function (row) {
      var lat = Number(row[1]);
      var lon = Number(row[2]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Core.inBounds(lat, lon)) return;
      if (distanceKm(centerLat, centerLon, lat, lon) > limitKm) return;
      usable.push(row);
      latSum += lat;
      lonSum += lon;
      minLat = Math.min(minLat, lat);
      minLon = Math.min(minLon, lon);
      maxLat = Math.max(maxLat, lat);
      maxLon = Math.max(maxLon, lon);
    });

    if (usable.length < 2) {
      return entry;
    }

    entry.lat = latSum / usable.length;
    entry.lon = lonSum / usable.length;
    entry.bbox = { minLat: minLat, minLon: minLon, maxLat: maxLat, maxLon: maxLon };
    entry.searchBbox = deliverySearchBbox(entry);
    entry.outlierSafe = true;
    return entry;
  }
  function getValueBySelectors(selectors) {
    for (var i = 0; i < selectors.length; i += 1) {
      var node = document.querySelector(selectors[i]);
      if (node && (node.value || node.textContent)) return String(node.value || node.textContent).trim();
    }
    return "";
  }
  function getValueByLabel(labelText) {
    var labels = document.querySelectorAll("label");
    var wanted = labelText.toLowerCase();
    for (var i = 0; i < labels.length; i += 1) {
      if (labels[i].textContent.toLowerCase().indexOf(wanted) === -1) continue;
      if (labels[i].htmlFor) {
        var linked = document.getElementById(labels[i].htmlFor);
        if (linked && linked.value) return String(linked.value).trim();
      }
      var input = labels[i].nextElementSibling;
      if (input && input.value) return String(input.value).trim();
    }
    return "";
  }
  function checkoutContext(host) {
    return {
      address1: getValueBySelectors([
        host.getAttribute("address-field"),
        "[name='shipping_address[address1]']",
        "[name='checkout[shipping_address][address1]']",
        "#address1",
        "#shipping_address_address1",
        "#checkout_shipping_address_address1"
      ].filter(Boolean)) || getValueByLabel("address line 1") || getValueByLabel("address"),
      pin: pinOnly(getValueBySelectors([
        host.getAttribute("pincode-field"),
        "[name='shipping_address[zip]']",
        "[name='checkout[shipping_address][zip]']",
        "[name='postcode']",
        "[name='pincode']",
        "[name='pin']",
        "#checkout_shipping_address_zip",
        "#shipping_address_zip",
        "#pincode",
        "#pin",
        "#zip"
      ].filter(Boolean)) || getValueByLabel("pin code") || getValueByLabel("pincode") || getValueByLabel("zip")),
      city: getValueBySelectors(["[name='shipping_address[city]']", "[name='checkout[shipping_address][city]']", "#city", "#shipping_city", "#checkout_shipping_address_city"]) || getValueByLabel("city"),
      state: getValueBySelectors(["[name='shipping_address[province]']", "[name='checkout[shipping_address][province]']", "#state", "#province", "#shipping_state", "#checkout_shipping_address_province"]) || getValueByLabel("state")
    };
  }
  function pinMatchesCheckout(entry, context) {
    var label = textOnly(entry.label);
    var state = textOnly(context.state);
    var stateOk = !state || label.indexOf(state) !== -1;
    return stateOk;
  }
  function localizedEntry(entry, db, pin, context) {
    var haystack = searchable([context.address1, context.city, context.state].filter(Boolean).join(" "));
    var compactHaystack = compactSearch([context.address1, context.city, context.state].filter(Boolean).join(" "));
    var primary = primaryAddressPhrase(context);
    var compactPrimary = compactSearch(primary);
    var rows = db.localities && db.localities[pin];
    var best = null;

    if (!haystack || !Array.isArray(rows)) {
      return entry;
    }

    for (var i = 0; i < rows.length; i += 1) {
      var name = searchable(rows[i][0]);
      var compactName = compactSearch(rows[i][0]);
      var exactPosition = name ? wordIndex(haystack, name) : -1;
      var fuzzyPosition = name ? fuzzyWordIndex(haystack, name) : -1;
      var compactPosition = compactName ? compactHaystack.indexOf(compactName) : -1;
      var position = exactPosition >= 0 ? exactPosition : (compactPosition >= 0 ? compactPosition : fuzzyPosition);
      var score;

      if (!name || position < 0) continue;

      score = (exactPosition >= 0 ? 100 : (compactPosition >= 0 ? 96 : 86)) + name.length - position * 2;
      if (!best || score > best.score) {
        best = { name: name, row: rows[i], score: score };
      }
    }

    if (!best) {
      return entry;
    }

    function fromLocality(source) {
      var lat = Number(source.row[1]);
      var lon = Number(source.row[2]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return entry;
      }
      return {
        pin: entry.pin,
        label: (source.row[3] || source.row[0]) + " | " + entry.label,
        lat: lat,
        lon: lon,
        bbox: entry.bbox,
        searchBbox: entry.searchBbox || deliverySearchBbox(entry),
        dense: entry.dense,
        matchedLocality: source.row[3] || source.row[0],
        source: source.fallback ? "supporting locality" : "locality"
      };
    }

    if (compactPrimary && compactSearch(best.name).indexOf(compactPrimary) === -1 && compactPrimary.indexOf(compactSearch(best.name)) === -1) {
      entry.supportingLocality = best.row[3] || best.row[0];
      entry.supportingLocalityEntry = fromLocality({ row: best.row, fallback: true });
      return entry;
    }

    return fromLocality({ row: best.row });
  }
  function entryFromLiveFix(entry, fix) {
    var latPad = Math.max(0.006, (Number(fix.accuracy) || 250) / 111000);
    var lonPad = Math.max(0.006, latPad / Math.max(0.35, Math.cos(fix.lat * Math.PI / 180)));
    return {
      pin: entry.pin,
      label: "Phone location (" + Math.round(fix.accuracy || 0) + "m accuracy) | " + entry.label,
      lat: fix.lat,
      lon: fix.lon,
      bbox: {
        minLat: Math.max(Core.BOUNDS.minLat, fix.lat - latPad),
        minLon: Math.max(Core.BOUNDS.minLon, fix.lon - lonPad),
        maxLat: Math.min(Core.BOUNDS.maxLat, fix.lat + latPad),
        maxLon: Math.min(Core.BOUNDS.maxLon, fix.lon + lonPad)
      },
      searchBbox: entry.searchBbox || deliverySearchBbox(entry),
      dense: entry.dense,
      matchedLocality: "your phone location",
      source: "phone",
      accuracyRadius: Number(fix.accuracy) || 0
    };
  }
  function entryFromGpsFix(fix) {
    var latPad = Math.max(0.006, (Number(fix.accuracy) || 250) / 111000);
    var lonPad = Math.max(0.006, latPad / Math.max(0.35, Math.cos(fix.lat * Math.PI / 180)));
    return {
      pin: "",
      label: "Phone location (" + Math.round(fix.accuracy || 0) + "m accuracy)",
      lat: fix.lat,
      lon: fix.lon,
      bbox: {
        minLat: Math.max(Core.BOUNDS.minLat, fix.lat - latPad),
        minLon: Math.max(Core.BOUNDS.minLon, fix.lon - lonPad),
        maxLat: Math.min(Core.BOUNDS.maxLat, fix.lat + latPad),
        maxLon: Math.min(Core.BOUNDS.maxLon, fix.lon + lonPad)
      },
      dense: true,
      matchedLocality: "your phone location",
      source: "phone accuracy fallback",
      accuracyRadius: Number(fix.accuracy) || 0
    };
  }
  function shouldUseLiveFix(entry, fix) {
    if (!fix || Date.now() - fix.at > 5 * 60 * 1000) return false;
    if (!Core.inBounds(fix.lat, fix.lon)) return false;
    var distance = distanceKm(fix.lat, fix.lon, entry.lat, entry.lon);
    var tolerance = Math.max(0.6, (Number(fix.accuracy) || 0) / 1000 + 0.5);
    return distance <= tolerance;
  }
  function addressQuery(context, pin) {
    return [context.address1, context.city, context.state, pin, "India"].filter(Boolean).join(", ");
  }
  function deliverySearchBbox(entry) {
    var bbox = entry && entry.bbox;
    var lat = Number(entry && entry.lat);
    var lon = Number(entry && entry.lon);
    var minLat = bbox ? Number(bbox.minLat) : lat;
    var minLon = bbox ? Number(bbox.minLon) : lon;
    var maxLat = bbox ? Number(bbox.maxLat) : lat;
    var maxLon = bbox ? Number(bbox.maxLon) : lon;
    var height;
    var width;
    var latPad;
    var lonPad;

    if (!Number.isFinite(minLat) || !Number.isFinite(minLon) || !Number.isFinite(maxLat) || !Number.isFinite(maxLon)) {
      return null;
    }

    height = Math.max(0, maxLat - minLat);
    width = Math.max(0, maxLon - minLon);
    latPad = Math.max(0.018, Math.min(0.045, height * 0.75));
    lonPad = Math.max(0.018, Math.min(0.045, width * 0.75));

    return {
      minLat: Math.max(Core.BOUNDS.minLat, minLat - latPad),
      minLon: Math.max(Core.BOUNDS.minLon, minLon - lonPad),
      maxLat: Math.min(Core.BOUNDS.maxLat, maxLat + latPad),
      maxLon: Math.min(Core.BOUNDS.maxLon, maxLon + lonPad)
    };
  }
  function pointInsideBbox(lat, lon, bbox) {
    if (!bbox) return false;
    return lat >= bbox.minLat && lat <= bbox.maxLat && lon >= bbox.minLon && lon <= bbox.maxLon;
  }
  function isWeakAddressPiece(phrase) {
    if (!phrase || phrase.length < 4) return true;
    if (/^(?:door|d no|house|flat|floor|line|cross|road|street|left|right|near|\d+[a-z]*)$/.test(phrase)) return true;
    if (/\d/.test(phrase)) {
      var withoutNumbers = phrase.split(" ").filter(function (token) {
        return !/\d/.test(token);
      }).join(" ");
      if (withoutNumbers.length < 8) return true;
    }
    return false;
  }
  function phraseAliases(phrase) {
    var compact = compactSearch(phrase);
    var out = [phrase];
    var suffixes = ["nagar", "colony", "puram", "peta", "palli", "palem", "gudem", "konda", "university", "college", "hospital"];

    suffixes.forEach(function (suffix) {
      if (compact.length > suffix.length + 2 && compact.slice(-suffix.length) === suffix) {
        out.push(compact.slice(0, -suffix.length) + " " + suffix);
      }
    });

    return out;
  }
  function phraseMatches(haystack, phrase) {
    var display = searchable(haystack);
    var compactDisplay = compactSearch(haystack);
    var normalized = searchable(phrase);
    var compactPhrase = compactSearch(phrase);
    return !!normalized && (display.indexOf(normalized) !== -1 || compactDisplay.indexOf(compactPhrase) !== -1);
  }
  function addressIntent(context) {
    var raw = String(context.address1 || "");
    var pieces = raw.split(/[,;|]/).map(function (part) {
      return searchable(part);
    }).filter(Boolean);
    var suffixes = {
      nagar: true,
      colony: true,
      puram: true,
      peta: true,
      pet: true,
      palli: true,
      palem: true,
      gudem: true,
      konda: true,
      wada: true,
      road: true,
      street: true,
      university: true,
      college: true,
      hospital: true,
      tower: true,
      apartment: true,
      apartments: true
    };
    var targets = [];
    var supporting = [];
    var seen = {};

    function add(list, phrase) {
      phrase = searchable(phrase);
      if (isWeakAddressPiece(phrase) || seen[phrase]) return;
      seen[phrase] = true;
      list.push(phrase);
    }

    for (var i = 0; i < pieces.length; i += 1) {
      add(targets.length ? supporting : targets, pieces[i]);
    }

    var words = searchable(raw).split(" ").filter(Boolean);
    for (var j = 0; j < words.length; j += 1) {
      if (suffixes[words[j]] && j > 0) {
        add(supporting, words[j - 1] + " " + words[j]);
      }
      if (j + 1 < words.length && suffixes[words[j + 1]]) {
        add(supporting, words[j] + " " + words[j + 1]);
      }
    }

    var primaryTarget = targets[0] || "";
    var rankedSupporting = targets.slice(1).concat(supporting).sort(function (a, b) {
      function quality(phrase) {
        var score = phrase.length;
        if (/(nagar|colony|puram|peta|palli|palem|gudem|konda|university|college|hospital|tower|apartment)/.test(phrase)) score += 40;
        if (/\d/.test(phrase)) score -= 12;
        return score;
      }
      return quality(b) - quality(a);
    });
    targets = primaryTarget ? [primaryTarget].concat(rankedSupporting) : rankedSupporting;

    var expanded = [];
    targets.forEach(function (phrase) {
      phraseAliases(phrase).forEach(function (alias) {
        if (!seen["alias:" + alias]) {
          seen["alias:" + alias] = true;
          expanded.push(alias);
        }
      });
    });

    return {
      primary: expanded[0] || "",
      targets: expanded,
      queries: expanded.map(function (phrase) {
        return [phrase, context.city, context.state, "India"].filter(Boolean).join(", ");
      })
    };
  }
  function addressPhrases(context) {
    return addressIntent(context).targets;
  }
  function primaryAddressPhrase(context) {
    return addressIntent(context).primary;
  }
  function geocodeScore(row, context, pin) {
    var intent = addressIntent(context);
    var display = searchable(row.display_name || "");
    var score = Number(row.importance || 0);
    var matched = 0;

    for (var p = 0; p < intent.targets.length; p += 1) {
      if (phraseMatches(row.display_name || "", intent.targets[p])) {
        score += p === 0 ? 180 : 100 - Math.min(50, p * 8);
        matched += 1;
      }
    }
    if (matched > 1) score += 35;
    if (pin && display.indexOf(pin) !== -1) score += 4;
    if (/^(amenity|building|tourism|office|shop|leisure)$/.test(String(row.class || ""))) score += 20;
    if (/^(university|college|school|hospital|residential|apartments|neighbourhood|suburb|quarter|yes)$/.test(String(row.type || ""))) score += 15;
    if (/boundary|administrative|county|state/i.test(String(row.class || "") + " " + String(row.type || ""))) score -= 16;

    return score;
  }
  function geocodeMatchesTypedAddress(row, context, pin, pinEntry) {
    var address = row.address || {};
    var resultPostcode = pinOnly(address.postcode || "");
    var lat = Number(row.lat);
    var lon = Number(row.lon);
    var intent = addressIntent(context);

    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Core.inBounds(lat, lon)) {
      return false;
    }
    if (pinEntry && !pointInsideBbox(lat, lon, pinEntry.searchBbox || deliverySearchBbox(pinEntry) || pinEntry.bbox)) {
      return false;
    }
    if (resultPostcode && pin && resultPostcode !== pin) {
      return false;
    }

    for (var p = 0; p < intent.targets.length; p += 1) {
      if (phraseMatches(row.display_name || "", intent.targets[p])) {
        return true;
      }
    }

    return false;
  }
  function uniqueQueries(context, pin) {
    var first = String(context.address1 || "").split(",")[0].trim();
    var intent = addressIntent(context);
    var queries = intent.queries.slice();
    queries = queries.concat([
      [context.address1, context.city, context.state, "India"].filter(Boolean).join(", "),
      [first, context.city, context.state, "India"].filter(Boolean).join(", ")
    ]);
    var seen = {};
    return queries.filter(function (query) {
      var key = searchable(query);
      if (!key || key.length < 8 || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }
  async function geocodeAddress(context, pin, pinEntry) {
    if (!window.fetch) {
      return Promise.resolve(null);
    }

    var queries = uniqueQueries(context, pin);
    var best = null;
    var searchBbox = pinEntry && (pinEntry.searchBbox || deliverySearchBbox(pinEntry));

    for (var q = 0; q < queries.length; q += 1) {
      try {
        var params = "format=json&limit=10&addressdetails=1&countrycodes=in&q=" + encodeURIComponent(queries[q]);
        if (searchBbox) {
          params += "&bounded=1&viewbox=" + [
            searchBbox.minLon,
            searchBbox.maxLat,
            searchBbox.maxLon,
            searchBbox.minLat
          ].join(",");
        }
        var res = await fetch("https://nominatim.openstreetmap.org/search?" + params, {
          cache: "force-cache"
        });
        var rows = res.ok ? await res.json() : null;
        if (!Array.isArray(rows)) continue;

        for (var i = 0; i < rows.length; i += 1) {
          var lat = Number(rows[i].lat);
          var lon = Number(rows[i].lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Core.inBounds(lat, lon)) continue;
          if (!geocodeMatchesTypedAddress(rows[i], context, pin, pinEntry)) continue;
          var score = geocodeScore(rows[i], context, pin);
          var primary = primaryAddressPhrase(context);
          var primaryMatch = primary && (searchable(rows[i].display_name || "").indexOf(primary) !== -1 || compactSearch(rows[i].display_name || "").indexOf(compactSearch(primary)) !== -1);
          if (!best || score > best.score) {
            best = {
              lat: lat,
              lon: lon,
              label: rows[i].display_name || queries[q],
              score: score,
              primaryMatch: !!primaryMatch
            };
          }
        }
      } catch (error) {
        return null;
      }
    }

    if (!best || best.score < 18) {
      return null;
    }

    return best;
  }
  function entryFromGeocode(entry, geocode) {
    var latPad = 0.012;
    var lonPad = latPad / Math.max(0.35, Math.cos(geocode.lat * Math.PI / 180));
    return {
      pin: entry.pin,
      label: "Address search: " + geocode.label,
      lat: geocode.lat,
      lon: geocode.lon,
      bbox: {
        minLat: Math.max(Core.BOUNDS.minLat, geocode.lat - latPad),
        minLon: Math.max(Core.BOUNDS.minLon, geocode.lon - lonPad),
        maxLat: Math.min(Core.BOUNDS.maxLat, geocode.lat + latPad),
        maxLon: Math.min(Core.BOUNDS.maxLon, geocode.lon + lonPad)
      },
      searchBbox: entry.searchBbox || deliverySearchBbox(entry),
      dense: entry.dense,
      matchedLocality: "typed address",
      source: "mapped address inside PIN",
      geocodeScore: geocode.score || 0,
      primaryMatch: !!geocode.primaryMatch
    };
  }
  function shouldUseGeocodeOverLocality(geocode, entry) {
    if (!geocode) return false;
    if (!entry.matchedLocality) return true;
    if (entry.matchedLocality === "your phone location") return false;
    if (geocode.primaryMatch) return true;
    return Number(geocode.score || 0) >= 95;
  }
  function loadWithTimeout(url) {
    if (!window.fetch) return Promise.resolve(DEFAULT_DB);
    return new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () {
        if (!done) resolve(DEFAULT_DB);
      }, 10000);
      fetch(url, { cache: "no-store" }).then(function (res) {
        return res.ok ? res.json() : DEFAULT_DB;
      }).then(function (json) {
        done = true;
        clearTimeout(timer);
        resolve(json);
      }).catch(function () {
        done = true;
        clearTimeout(timer);
        resolve(DEFAULT_DB);
      });
    });
  }
  function pinPackUrl(source, pin) {
    var clean = String(source || "").replace(/[?#].*$/, "");
    var query = String(source || "").match(/[?#].*$/);
    if (/\.json$/i.test(clean)) return source;
    return clean.replace(/\/$/, "") + "/" + pin.slice(0, 2) + ".json" + (query ? query[0] : "");
  }
  function targetFields(host) {
    return [
      host.getAttribute("target"),
      "[name='shipping_address[address2]']",
      "[name='checkout[shipping_address][address2]']",
      "#shipping_address_address2",
      "#checkout_shipping_address_address2",
      "[name='shipping_note']",
      "[name='note']",
      "[name='attributes[DIGIPIN]']"
    ].filter(Boolean);
  }
  function writeField(field, payload) {
    if (!field) return false;
    var current = field.value || field.textContent || "";
    var cleaned = current.replace(/^\[DIGIPIN:[^\]]+\](?:\s\|\s\[[^\]]*\])*(?:\s\|\s)?/i, "").trim();
    var next = payload + (cleaned ? " | " + cleaned : "");
    if ("value" in field) {
      field.value = next;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      field.textContent = next;
    }
    return true;
  }
  function inject(host, digipin, floor) {
    var payload = "[DIGIPIN: " + digipin + "]" + (floor ? " | [" + floor + "]" : "");
    var fields = targetFields(host);
    for (var i = 0; i < fields.length; i += 1) {
      if (writeField(document.querySelector(fields[i]), payload)) return fields[i];
    }
    var hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.name = "attributes[DIGIPIN]";
    hidden.value = payload;
    host.insertAdjacentElement("afterend", hidden);
    return hidden.name;
  }

  function loadLeaflet(root) {
    if (window.L) return Promise.resolve(window.L);
    if (leafletPromise) return leafletPromise;

    leafletPromise = new Promise(function (resolve, reject) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha256-p4NxAoJBhIINfQ3fTc9bm9pUrR3d8pN2aIn80wXb0XA=";
      link.crossOrigin = "";
      root.appendChild(link.cloneNode());
      document.head.appendChild(link);

      var script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      script.onload = function () { resolve(window.L); };
      script.onerror = function () { reject(new Error("Leaflet failed to load.")); };
      document.head.appendChild(script);
    });

    return leafletPromise;
  }

  function createLeafletMap(modal, entry, point) {
    return loadLeaflet(modal.getRootNode()).then(function (L) {
      var mapNode = qs(modal, ".map");
      var mapBbox = /^(mapped address inside PIN|phone)$/.test(entry.source || "") ? entry.bbox : (entry.searchBbox || entry.bbox);
      mapNode.classList.add("leafletMap");
      mapNode.innerHTML = "";

      var map = L.map(mapNode, {
        attributionControl: true,
        center: [point.lat, point.lon],
        maxBounds: [
          [mapBbox.minLat, mapBbox.minLon],
          [mapBbox.maxLat, mapBbox.maxLon]
        ],
        maxBoundsViscosity: 0.65,
        scrollWheelZoom: true,
        zoom: entry.matchedLocality === "your phone location" ? 18 : 17
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
      }).addTo(map);

      if (entry.accuracyRadius) {
        L.circle([point.lat, point.lon], {
          radius: entry.accuracyRadius,
          color: "#e11d48",
          fillColor: "#e11d48",
          fillOpacity: 0.12,
          opacity: 0.35,
          weight: 1
        }).addTo(map);
      }

      var marker = L.marker([point.lat, point.lon], {
        draggable: true,
        icon: L.divIcon({
          className: "gfMarker",
          html: "",
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(map);
      var bounds = L.latLngBounds(
        [mapBbox.minLat, mapBbox.minLon],
        [mapBbox.maxLat, mapBbox.maxLon]
      );

      if (entry.matchedLocality === "your phone location") {
        map.setView([point.lat, point.lon], 18, { animate: false });
      } else {
        map.fitBounds(bounds.pad(0.12));
        map.setView([point.lat, point.lon], 17, { animate: false });
      }
      setTimeout(function () { map.invalidateSize(false); map.setView([point.lat, point.lon], entry.matchedLocality === "your phone location" ? 18 : 17, { animate: false }); }, 80);
      setTimeout(function () { map.invalidateSize(false); map.setView([point.lat, point.lon], entry.matchedLocality === "your phone location" ? 18 : 17, { animate: false }); }, 350);

      function setPoint(latlng) {
        point.lat = latlng.lat;
        point.lon = latlng.lng;
        marker.setLatLng(latlng);
        qs(modal, ".coord").textContent = entry.label + " | " + point.lat.toFixed(6) + ", " + point.lon.toFixed(6);
      }

      marker.on("dragend", function () {
        setPoint(marker.getLatLng());
      });

      map.on("click", function (ev) {
        setPoint(ev.latlng);
      });

      qs(modal, ".coord").textContent = entry.label + " | " + point.lat.toFixed(6) + ", " + point.lon.toFixed(6);
      return map;
    });
  }

  function showMap(entry, done, mountRoot) {
    var modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = [
      "<div class='panel' role='dialog' aria-modal='true'>",
      "<h2>" + (entry.matchedLocality === "your phone location" ? "Refine your current rooftop" : "Select your delivery rooftop") + "</h2>",
      "<p>" + (entry.matchedLocality === "your phone location" ? "Your phone location is close, but not 4-meter precise. Click or drag the marker onto the exact roof." : "Click the map or drag the marker directly over your roof to secure pinpoint delivery.") + "</p>",
      "<div class='source'>Starting point: " + (entry.source || "PIN center") + (entry.matchedLocality ? " - " + entry.matchedLocality : "") + "</div>",
      "<div class='map'><div class='mapHint'>Loading OpenStreetMap. If it does not load, click or drag inside this offline square.</div><span class='cross'><i></i></span></div><div class='coord'></div>",
      "<div class='row'><button class='use' type='button'>Use selected point</button><button class='cancel alt' type='button'>Cancel</button></div>",
      "</div>"
    ].join("");
    var bbox = /^(mapped address inside PIN|phone)$/.test(entry.source || "") ? entry.bbox : (entry.searchBbox || entry.bbox);
    var point = { lat: entry.lat, lon: entry.lon };
    var map = qs(modal, ".map");
    function render() {
      qs(modal, ".coord").textContent = entry.label + " | " + point.lat.toFixed(6) + ", " + point.lon.toFixed(6);
    }
    function update(ev) {
      var rect = map.getBoundingClientRect();
      var x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      var y = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
      point.lon = bbox.minLon + x * (bbox.maxLon - bbox.minLon);
      point.lat = bbox.maxLat - y * (bbox.maxLat - bbox.minLat);
      render();
    }
    map.addEventListener("pointerdown", function (ev) {
      update(ev);
      map.setPointerCapture(ev.pointerId);
    });
    map.addEventListener("pointermove", function (ev) {
      if (ev.buttons) update(ev);
    });
    qs(modal, ".use").addEventListener("click", function () {
      modal.remove();
      done(point, entry);
    });
    qs(modal, ".cancel").addEventListener("click", function () { modal.remove(); });
    mountRoot.appendChild(modal);
    render();
    createLeafletMap(modal, entry, point).catch(function () {
      render();
    });
  }

  class GridFlowCheckout extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.db = DEFAULT_DB;
      this.dbReady = Promise.resolve(DEFAULT_DB);
      this.dbSource = "./pincode-packs";
      this.dbCache = {};
      this.lastFix = null;
      this.pendingDigipin = "";
    }
    connectedCallback() {
      if (!Core) {
        this.textContent = "GridFlow core failed to load.";
        return;
      }
      this.shadowRoot.innerHTML = [
        "<style>", CSS, "</style>",
        "<section class='card'><div class='top'><div class='badge'>GF</div><div>",
        "<h2>1-Click Pinpoint Delivery</h2>",
        "<p>Powered by India Post Digital Infrastructure. DIGIPIN is calculated locally, without paid map APIs.</p></div></div>",
        "<div class='options' role='group' aria-label='Delivery address choice'>",
        "<button class='option savedOption' type='button'><span class='mark'>1</span><span><b>Deliver to saved address</b><span class='savedHint'>Use a verified DIGIPIN from this checkout.</span></span></button>",
        "<button class='option gps' type='button'><span class='mark'>2</span><span><b>Use current location</b><span>Best when you are at the delivery place.</span></span></button>",
        "<button class='option away' type='button'><span class='mark'>3</span><span><b>Ship to another address</b><span>Use the typed address and choose the roof point.</span></span></button>",
        "</div>",
        "<div class='stack remote hidden'><input class='pin' inputmode='numeric' maxlength='6' placeholder='Enter delivery PIN code'><button class='choose alt' type='button'>Open roof picker</button></div>",
        "<div class='stack'><input class='direct' autocomplete='off' placeholder='Paste DIGIPIN if customer already has one'></div>",
        "<div class='stack floor'><input class='floorInput' placeholder='Flat / floor / tower / landmark'></div>",
        "<div class='status'>Ready to secure delivery metadata.</div></section>"
      ].join("");
      this.bind();
      this.dbSource = this.getAttribute("pincode-src") || "./pincode-packs";
      this.refreshSaved();
    }
    bind() {
      var root = this.shadowRoot;
      qs(root, ".gps").addEventListener("click", this.gps.bind(this));
      qs(root, ".away").addEventListener("click", this.showRemote.bind(this));
      qs(root, ".choose").addEventListener("click", this.choosePin.bind(this));
      qs(root, ".savedOption").addEventListener("click", this.useSaved.bind(this));
      qs(root, ".pin").addEventListener("input", function (ev) { ev.target.value = pinOnly(ev.target.value); });
      qs(root, ".direct").addEventListener("input", this.direct.bind(this));
      qs(root, ".floorInput").addEventListener("input", function (ev) {
        if (this.pendingDigipin) this.save(this.pendingDigipin, "Flat/floor added.", ev.target.value);
      }.bind(this));
    }
    refreshSaved() {
      var root = this.shadowRoot;
      var saved = readVerified(checkoutContext(this));
      this.savedRecord = saved;
      if (saved) {
        qs(root, ".savedOption").disabled = false;
        qs(root, ".savedOption").classList.add("primary");
        qs(root, ".savedHint").textContent = "DIGIPIN " + saved.digipin + " is ready.";
      } else {
        qs(root, ".savedOption").disabled = true;
        qs(root, ".savedOption").classList.remove("primary");
        qs(root, ".savedHint").textContent = "No verified DIGIPIN saved yet.";
      }
    }
    useSaved() {
      var saved = this.savedRecord || readVerified(checkoutContext(this));
      if (!saved) {
        this.refreshSaved();
        setStatus(this.shadowRoot, "No saved DIGIPIN found for this checkout address.", "warn");
        return;
      }
      this.save(saved.digipin, "Saved verified delivery point reused.");
    }
    pinDb(pin) {
      var prefix = pin.slice(0, 2);
      var source = this.dbSource;
      var cacheKey = /\.json(?:[?#]|$)/i.test(source) ? "full" : prefix;
      if (!this.dbCache[cacheKey]) {
        this.dbCache[cacheKey] = loadWithTimeout(pinPackUrl(source, pin)).then(function (db) {
          this.db = db;
          return db;
        }.bind(this));
      }
      return this.dbCache[cacheKey];
    }
    showRemote(message) {
      qs(this.shadowRoot, ".remote").classList.remove("hidden");
      var checkoutPin = checkoutContext(this).pin;
      var pinInput = qs(this.shadowRoot, ".pin");
      if (checkoutPin && !pinInput.value) pinInput.value = checkoutPin;
      setStatus(this.shadowRoot, message || "Enter the delivery PIN code, then place the roof crosshair.", "warn");
    }
    gps() {
      var root = this.shadowRoot;
      if (!navigator.geolocation) {
        this.showRemote("Location is unavailable. Use delivery PIN code instead.");
        return;
      }
      setStatus(root, "Requesting high-accuracy location...");
      navigator.geolocation.getCurrentPosition(function (pos) {
        var c = pos.coords;
        var accuracy = Math.round(Number(c.accuracy) || 0);
        var code;
        this.lastFix = {
          lat: c.latitude,
          lon: c.longitude,
          accuracy: accuracy,
          at: Date.now()
        };
        try {
          code = Core.encode(c.latitude, c.longitude);
        } catch (error) {
          this.showRemote("Location could not be used for India delivery. Enter the delivery PIN code.");
          return;
        }
        if (accuracy <= 8) {
          this.save(code, "Rooftop locked. No delivery phone calls required.");
        } else {
          var entry = entryFromGpsFix(this.lastFix);
          setStatus(root, "Location captured with " + accuracy + "m accuracy. Confirm the roof point before saving DIGIPIN.", "warn");
          showMap(entry, function (point) {
            if (!Core.inBounds(point.lat, point.lon)) {
              setStatus(root, "Selected point is outside the national DIGIPIN bounds. Choose another point.", "err");
              return;
            }
            var confirmedCode = Core.encode(point.lat, point.lon);
            writeVerified(checkoutContext(this), confirmedCode, point, "gps-refined");
            this.save(confirmedCode, "Roof point confirmed after GPS refinement.");
            this.refreshSaved();
          }.bind(this), root);
        }
      }.bind(this), function () {
        this.showRemote("Location permission was blocked. Enter the delivery PIN code.");
      }.bind(this), { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 });
    }
    async choosePin() {
      var pin = pinOnly(qs(this.shadowRoot, ".pin").value);
      if (pin.length !== 6) {
        setStatus(this.shadowRoot, "Enter a valid 6-digit delivery PIN code.", "err");
        return;
      }
      var db = await this.pinDb(pin);
      var row = db.pins && db.pins[pin];
      if (!row) {
        setStatus(this.shadowRoot, "PIN " + pin + " is not in this demo cache. Replace pincode-centroids.json with the full production cache.", "err");
        return;
      }
      var context = checkoutContext(this);
      var entry = localizedEntry(outlierSafeEntry(dbEntryToObject(pin, row), db, pin), db, pin, context);
      if (db.v < 2 || !db.localities) {
        setStatus(this.shadowRoot, "The old PIN database is still loaded, so only broad PIN centers are available. Re-upload pincode-centroids.json and hard refresh.", "err");
        return;
      }
      if (!pinMatchesCheckout(entry, context)) {
        setStatus(this.shadowRoot, "PIN " + pin + " maps to " + entry.label + ", but checkout address says " + [context.city, context.state].filter(Boolean).join(", ") + ". Correct the delivery PIN code before opening the picker.", "err");
        return;
      }
      if (shouldUseLiveFix(entry, this.lastFix)) {
        entry = entryFromLiveFix(entry, this.lastFix);
      }
      if (entry.matchedLocality !== "your phone location") {
        var geocoded = await geocodeAddress(context, pin, entry);
        if (shouldUseGeocodeOverLocality(geocoded, entry)) {
          entry = entryFromGeocode(entry, geocoded);
        } else if (entry.supportingLocalityEntry) {
          entry = entry.supportingLocalityEntry;
        }
      }
      if (!entry.matchedLocality && !entry.source) {
        entry.source = "PIN area fallback";
        entry.matchedLocality = primaryAddressPhrase(context) ? "exact address not found in map data" : "";
      }
      showMap(entry, function (point, entry) {
        if (!Core.inBounds(point.lat, point.lon)) {
          setStatus(this.shadowRoot, "Selected point is outside the national DIGIPIN bounds. Choose another point.", "err");
          return;
        }
        var code = Core.encode(point.lat, point.lon);
        writeVerified(checkoutContext(this), code, point, entry.source || "roof-picker");
        this.save(code, (entry.matchedLocality ? "Roof picker opened near " + entry.matchedLocality + "." : "Roof crosshair locked from delivery PIN " + pin + "."));
        this.refreshSaved();
      }.bind(this), this.shadowRoot);
    }
    direct(ev) {
      var formatted;
      try {
        formatted = Core.format(ev.target.value);
      } catch (error) {
        setStatus(this.shadowRoot, "Paste DIGIPIN as XXX-XXX-XXXX.");
        return;
      }
      if (!Core.isDirectEntry(formatted)) {
        setStatus(this.shadowRoot, "That DIGIPIN format is not valid.", "err");
        return;
      }
      writeVerified(checkoutContext(this), formatted, null, "direct-entry");
      this.save(formatted, "DIGIPIN accepted directly.");
      this.refreshSaved();
    }
    save(code, message, floor) {
      var target = inject(this, code, floor || qs(this.shadowRoot, ".floorInput").value.trim());
      this.dispatchEvent(new CustomEvent("gridflow:resolved", { bubbles: true, detail: { digipin: code, target: target } }));
      setStatus(this.shadowRoot, message + " Saved " + code + " into checkout metadata.", message.indexOf("accuracy") >= 0 || message.indexOf("multi-story") >= 0 ? "warn" : "ok");
    }
  }

  if (!customElements.get("gridflow-checkout")) {
    customElements.define("gridflow-checkout", GridFlowCheckout);
  }
})();
