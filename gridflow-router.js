/*
 * GridFlow Router: carrier-agnostic manifest and failed-attempt verification.
 * This module is intentionally zero-dependency and works with GridFlow.decode().
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./gridflow-core"));
  } else {
    root.GridFlowRouter = factory(root.GridFlow);
  }
})(typeof self !== "undefined" ? self : this, function (Core) {
  "use strict";

  var CARRIERS = Object.freeze({
    delhivery: "Delhivery",
    shadowfax: "Shadowfax",
    xpressbees: "XpressBees",
    indiapost: "India Post"
  });

  function number(value, label) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new TypeError(label + " must be a finite number.");
    return parsed;
  }

  function decodeCell(digipin) {
    var decoded = Core.decode(digipin);
    var box = decoded.bbox;
    return {
      digipin: Core.format(digipin),
      lat: decoded.lat,
      lon: decoded.lon,
      bbox: {
        minLat: box[0],
        minLon: box[1],
        maxLat: box[2],
        maxLon: box[3]
      }
    };
  }

  function pointInBbox(lat, lon, bbox, toleranceMeters) {
    lat = number(lat, "Latitude");
    lon = number(lon, "Longitude");
    toleranceMeters = Math.max(0, Number(toleranceMeters) || 0);

    var latPad = toleranceMeters / 111000;
    var lonPad = latPad / Math.max(0.35, Math.cos(lat * Math.PI / 180));

    return lat >= bbox.minLat - latPad &&
      lat <= bbox.maxLat + latPad &&
      lon >= bbox.minLon - lonPad &&
      lon <= bbox.maxLon + lonPad;
  }

  function distanceMeters(lat1, lon1, lat2, lon2) {
    var radius = 6371000;
    var dLat = (number(lat2, "Latitude") - number(lat1, "Latitude")) * Math.PI / 180;
    var dLon = (number(lon2, "Longitude") - number(lon1, "Longitude")) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function createManifest(order) {
    var cell = decodeCell(order.digipin);
    var carrier = String(order.carrier || "").toLowerCase();
    return {
      orderId: String(order.orderId || ""),
      carrier: CARRIERS[carrier] || order.carrier || "Unassigned",
      customerName: order.customerName || "",
      address: order.address || "",
      digipin: cell.digipin,
      deliveryPoint: {
        lat: Number(cell.lat.toFixed(7)),
        lon: Number(cell.lon.toFixed(7)),
        bbox: cell.bbox
      },
      metadata: {
        standard: "DIGIPIN",
        source: "checkout",
        carrierAgnostic: true
      }
    };
  }

  function verifyFailedAttempt(input) {
    var cell = decodeCell(input.digipin);
    var riderLat = number(input.riderLat, "Rider latitude");
    var riderLon = number(input.riderLon, "Rider longitude");
    var tolerance = Number(input.toleranceMeters);
    if (!Number.isFinite(tolerance)) tolerance = 25;

    var inside = pointInBbox(riderLat, riderLon, cell.bbox, tolerance);
    var distance = distanceMeters(riderLat, riderLon, cell.lat, cell.lon);
    return {
      allowed: inside,
      decision: inside ? "ALLOW_NDR" : "BLOCK_NDR",
      reason: inside ?
        "Rider location is inside the DIGIPIN delivery fence." :
        "Rider location is outside the DIGIPIN delivery fence.",
      digipin: cell.digipin,
      rider: {
        lat: riderLat,
        lon: riderLon
      },
      deliveryPoint: {
        lat: cell.lat,
        lon: cell.lon,
        bbox: cell.bbox
      },
      distanceMeters: Math.round(distance),
      toleranceMeters: tolerance
    };
  }

  return Object.freeze({
    CARRIERS: CARRIERS,
    createManifest: createManifest,
    decodeCell: decodeCell,
    distanceMeters: distanceMeters,
    pointInBbox: pointInBbox,
    verifyFailedAttempt: verifyFailedAttempt
  });
});
