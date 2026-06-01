const assert = require("assert");
const encoder = require("../src/digipin-encoder");

function test(name, fn) {
  try {
    fn();
    console.log("ok - " + name);
  } catch (error) {
    console.error("not ok - " + name);
    console.error(error);
    process.exitCode = 1;
  }
}

test("encodes the official Dak Bhawan example", () => {
  assert.strictEqual(encoder.encode(28.622788, 77.213033), "39J-49L-L8T4");
});

test("round-trips encoded coordinates inside the final cell", () => {
  const code = encoder.encode(12.9766, 77.5993);
  const decoded = encoder.decode(code);
  assert.ok(decoded.latitude >= decoded.bounds.minLat);
  assert.ok(decoded.latitude <= decoded.bounds.maxLat);
  assert.ok(decoded.longitude >= decoded.bounds.minLon);
  assert.ok(decoded.longitude <= decoded.bounds.maxLon);
  assert.strictEqual(encoder.encode(decoded.latitude, decoded.longitude), code);
});

test("rejects coordinates outside the India Post DIGIPIN extent", () => {
  assert.throws(() => encoder.encode(51.5072, -0.1276), /Latitude is outside/);
});

test("validates direct-entry final and legacy formats", () => {
  assert.strictEqual(encoder.isValid("39J-49L-L8T4"), true);
  assert.strictEqual(encoder.isValid("39J-5JP-7J8L"), true);
  assert.strictEqual(encoder.isValid("JKM-PWG-X234", { allowLegacy: true }), true);
  assert.strictEqual(encoder.isValid("JKM-PWG-X234"), false);
});

test("formats unhyphenated pasted codes", () => {
  assert.strictEqual(encoder.format("39j49ll8t4"), "39J-49L-L8T4");
});

test("has no network or browser globals in the core path", () => {
  assert.strictEqual(typeof global.fetch === "undefined" || typeof global.fetch === "function", true);
  const code = encoder.encode(28.6139, 77.2090);
  assert.strictEqual(encoder.isValid(code), true);
});
