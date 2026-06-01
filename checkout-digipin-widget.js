(function () {
  "use strict";

  var Encoder = window.DigiPinEncoder;
  var PINCODE_FALLBACK = {
    "110001": {
      label: "New Delhi GPO, Delhi",
      centroid: { lat: 28.622788, lon: 77.213033 },
      bbox: { minLat: 28.595, maxLat: 28.65, minLon: 77.185, maxLon: 77.245 }
    },
    "400001": {
      label: "Mumbai GPO, Maharashtra",
      centroid: { lat: 18.9388, lon: 72.8354 },
      bbox: { minLat: 18.9, maxLat: 18.97, minLon: 72.795, maxLon: 72.87 }
    },
    "560001": {
      label: "Bengaluru GPO, Karnataka",
      centroid: { lat: 12.9766, lon: 77.5993 },
      bbox: { minLat: 12.94, maxLat: 13.01, minLon: 77.56, maxLon: 77.64 }
    }
  };

  var CSS = [
    ":host{all:initial;display:block;color:#17202a;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}",
    "*,*::before,*::after{box-sizing:border-box}",
    ".box{border:1px solid #d7dde5;border-radius:8px;background:#fff;box-shadow:0 8px 24px rgba(15,23,42,.08);padding:16px;max-width:520px}",
    ".head{display:flex;gap:12px;align-items:flex-start;margin-bottom:14px}",
    ".mark{width:38px;height:38px;border-radius:8px;background:#0f766e;color:#fff;display:grid;place-items:center;font-weight:800;font-size:18px;flex:0 0 auto}",
    "h2{font-size:18px;line-height:1.2;margin:0 0 4px;font-weight:750;color:#111827;letter-spacing:0}",
    "p{font-size:13px;line-height:1.45;margin:0;color:#526071}",
    ".row{display:flex;gap:8px;align-items:center;margin-top:12px}",
    ".row.stack{align-items:stretch;flex-direction:column}",
    "button{appearance:none;border:0;border-radius:8px;background:#0f766e;color:#fff;font:700 14px/1.1 inherit;padding:12px 14px;cursor:pointer;min-height:44px}",
    "button.secondary{background:#eef4f3;color:#0f5f58;border:1px solid #c8dedb}",
    "button:disabled{cursor:wait;opacity:.72}",
    "input{width:100%;min-height:42px;border:1px solid #cbd5e1;border-radius:8px;padding:10px 11px;font:500 14px/1.2 inherit;color:#111827;background:#fff}",
    "input:focus{outline:2px solid #99d6ce;outline-offset:1px;border-color:#0f766e}",
    ".status{margin-top:12px;font-size:13px;line-height:1.45;color:#526071}",
    ".ok{color:#0f766e;font-weight:700}",
    ".error{color:#b42318}",
    ".hidden{display:none!important}",
    ".digipin{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:800;letter-spacing:.04em}",
    ".modal{position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.52);display:grid;place-items:center;padding:20px}",
    ".panel{width:min(92vw,460px);background:#fff;border-radius:8px;padding:16px;box-shadow:0 20px 60px rgba(0,0,0,.24)}",
    ".map{position:relative;width:100%;aspect-ratio:1;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;background:linear-gradient(90deg,rgba(15,118,110,.14) 1px,transparent 1px),linear-gradient(rgba(15,118,110,.14) 1px,transparent 1px),#f8fafc;background-size:10% 10%}",
    ".map::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at center,rgba(15,118,110,.18),transparent 36%)}",
    ".pin{position:absolute;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:999px;background:#e11d48;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.32)}",
    ".coords{font-size:12px;margin-top:8px;color:#526071}",
    "@media (max-width:420px){.box{padding:14px}.row{flex-direction:column;align-items:stretch}button{width:100%}}"
  ].join("");

  function qs(root, selector) {
    return root.querySelector(selector);
  }

  function setText(root, selector, text, className) {
    var node = qs(root, selector);
    node.textContent = text;
    node.className = "status" + (className ? " " + className : "");
  }

  function normalizePin(pin) {
    return String(pin || "").replace(/\D/g, "").slice(0, 6);
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error("Timed out"));
      }, ms);

      promise.then(function (value) {
        clearTimeout(timer);
        resolve(value);
      }, function (error) {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  function appendDigipinValue(field, digipin) {
    if (!field) {
      return false;
    }

    var prefix = "DIGIPIN: " + digipin;
    var current = field.value || field.textContent || "";
    var cleaned = current.replace(/(?:^|\n)DIGIPIN:\s*[A-Z0-9-]+/i, "").trim();
    var next = cleaned ? prefix + "\n" + cleaned : prefix;

    if ("value" in field) {
      field.value = next;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      field.textContent = next;
    }
    return true;
  }

  function injectIntoCheckout(digipin, host) {
    var selectors = [
      host.getAttribute("target"),
      "[name='attributes[DIGIPIN]']",
      "[name='checkout[attributes][DIGIPIN]']",
      "[name='shipping_address[address2]']",
      "[name='checkout[shipping_address][address2]']",
      "#shipping_address_address2",
      "#checkout_shipping_address_address2",
      "[name='note']",
      "[name='order[note]']"
    ].filter(Boolean);

    for (var i = 0; i < selectors.length; i += 1) {
      var field = document.querySelector(selectors[i]);
      if (appendDigipinValue(field, digipin)) {
        return selectors[i];
      }
    }

    var hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.name = "attributes[DIGIPIN]";
    hidden.value = digipin;
    host.insertAdjacentElement("afterend", hidden);
    return "attributes[DIGIPIN]";
  }

  function renderTemplate(shadow) {
    shadow.innerHTML = [
      "<style>", CSS, "</style>",
      "<section class='box' part='box'>",
      "<div class='head'><div class='mark'>DP</div><div>",
      "<h2>1-Click Pinpoint Delivery</h2>",
      "<p>Uses the official India Post DIGIPIN DPI grid locally on this device. No paid mapping API is needed for the code conversion.</p>",
      "</div></div>",
      "<div class='row'><button class='locate' type='button'>Secure 4-Meter Delivery Accuracy</button></div>",
      "<div class='row stack fallback hidden'>",
      "<input class='pincode' inputmode='numeric' maxlength='6' autocomplete='postal-code' placeholder='Enter traditional 6-digit PIN code'>",
      "<button class='pinLookup secondary' type='button'>Choose roof point</button>",
      "</div>",
      "<div class='row stack'>",
      "<input class='direct' autocomplete='off' placeholder='Have a DIGIPIN? Paste it here'>",
      "</div>",
      "<div class='status'>Ready to capture the delivery point.</div>",
      "</section>"
    ].join("");
  }

  function createPicker(entry, onChoose) {
    var modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = [
      "<div class='panel' role='dialog' aria-modal='true'>",
      "<h2>You are shopping away from home</h2>",
      "<p>Please drop a pin exactly on your roof to secure pinpoint delivery.</p>",
      "<div class='map' tabindex='0'><span class='pin'></span></div>",
      "<div class='coords'></div>",
      "<div class='row'><button class='use' type='button'>Use this point</button><button class='cancel secondary' type='button'>Cancel</button></div>",
      "</div>"
    ].join("");

    var bbox = entry.bbox;
    var selected = {
      lat: entry.centroid.lat,
      lon: entry.centroid.lon
    };

    function renderPoint() {
      var x = ((selected.lon - bbox.minLon) / (bbox.maxLon - bbox.minLon)) * 100;
      var y = ((bbox.maxLat - selected.lat) / (bbox.maxLat - bbox.minLat)) * 100;
      qs(modal, ".pin").style.left = x + "%";
      qs(modal, ".pin").style.top = y + "%";
      qs(modal, ".coords").textContent = entry.label + " | " + selected.lat.toFixed(6) + ", " + selected.lon.toFixed(6);
    }

    function updateFromEvent(event) {
      var rect = qs(modal, ".map").getBoundingClientRect();
      var x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      var y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      selected.lon = bbox.minLon + x * (bbox.maxLon - bbox.minLon);
      selected.lat = bbox.maxLat - y * (bbox.maxLat - bbox.minLat);
      renderPoint();
    }

    qs(modal, ".map").addEventListener("click", updateFromEvent);
    qs(modal, ".use").addEventListener("click", function () {
      modal.remove();
      onChoose(selected);
    });
    qs(modal, ".cancel").addEventListener("click", function () {
      modal.remove();
    });

    document.body.appendChild(modal);
    renderPoint();
  }

  class DigipinCheckout extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.pincodeDb = PINCODE_FALLBACK;
      this.loadingDb = null;
    }

    connectedCallback() {
      if (!Encoder) {
        this.textContent = "DIGIPIN encoder was not loaded.";
        return;
      }

      renderTemplate(this.shadowRoot);
      this.bindEvents();
      this.loadPincodeDb();
    }

    bindEvents() {
      var root = this.shadowRoot;
      qs(root, ".locate").addEventListener("click", this.handleLocate.bind(this));
      qs(root, ".pinLookup").addEventListener("click", this.handlePinLookup.bind(this));
      qs(root, ".pincode").addEventListener("input", function (event) {
        event.target.value = normalizePin(event.target.value);
      });
      qs(root, ".direct").addEventListener("input", this.handleDirectEntry.bind(this));
    }

    revealFallback(message) {
      qs(this.shadowRoot, ".fallback").classList.remove("hidden");
      setText(this.shadowRoot, ".status", message || "Enter your 6-digit PIN code to choose the roof point.");
    }

    async loadPincodeDb() {
      var src = this.getAttribute("pincode-src") || "data/pincode-db.json";
      if (!window.fetch) {
        return this.pincodeDb;
      }

      try {
        this.loadingDb = withTimeout(fetch(src, { cache: "force-cache" }).then(function (res) {
          if (!res.ok) {
            throw new Error("PIN database unavailable.");
          }
          return res.json();
        }), 1200);
        this.pincodeDb = await this.loadingDb;
      } catch (error) {
        this.pincodeDb = PINCODE_FALLBACK;
      }
      return this.pincodeDb;
    }

    handleLocate() {
      var root = this.shadowRoot;
      var button = qs(root, ".locate");

      if (!navigator.geolocation) {
        this.revealFallback("Location access is not available here. Use your 6-digit PIN code instead.");
        return;
      }

      button.disabled = true;
      setText(root, ".status", "Requesting secure device location...");

      navigator.geolocation.getCurrentPosition(function (position) {
        button.disabled = false;
        var coords = position.coords;
        var accuracy = Math.round(Number(coords.accuracy) || 0);
        var digipin;

        try {
          digipin = Encoder.encode(coords.latitude, coords.longitude);
        } catch (error) {
          this.revealFallback("Chrome returned a location outside the India DIGIPIN area. Use your 6-digit PIN code instead.");
          return;
        }

        if (accuracy <= 10) {
          this.applyDigipin(digipin, "GPS accuracy " + accuracy + "m.");
          return;
        }

        qs(this.shadowRoot, ".fallback").classList.remove("hidden");
        this.applyDigipin(digipin, "Location captured with " + accuracy + "m accuracy. For roof-level precision, use the PIN-code picker below.");
      }.bind(this), function () {
        button.disabled = false;
        this.revealFallback("Location permission was blocked. Enter your traditional 6-digit PIN code.");
      }.bind(this), {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 9000
      });
    }

    async handlePinLookup() {
      var pin = normalizePin(qs(this.shadowRoot, ".pincode").value);
      if (pin.length !== 6) {
        setText(this.shadowRoot, ".status", "Enter a valid 6-digit PIN code.", "error");
        return;
      }

      var db = await (this.loadingDb || Promise.resolve(this.pincodeDb));
      var entry = db[pin];
      if (!entry) {
        setText(this.shadowRoot, ".status", "This demo database does not include PIN " + pin + ". Swap in the full offline JSON for production.", "error");
        return;
      }

      createPicker(entry, function (point) {
        this.applyDigipin(Encoder.encode(point.lat, point.lon), "Roof point selected from PIN " + pin + ".");
      }.bind(this));
    }

    handleDirectEntry(event) {
      var value = Encoder.normalize(event.target.value);
      var formatted;

      try {
        formatted = Encoder.format(value);
      } catch (error) {
        setText(this.shadowRoot, ".status", "Paste a DIGIPIN in ABC-DEF-GHIJ format.");
        return;
      }

      if (Encoder.isValid(formatted, { allowLegacy: true })) {
        this.applyDigipin(formatted, "DIGIPIN accepted directly.");
      } else {
        setText(this.shadowRoot, ".status", "That DIGIPIN format is not valid.", "error");
      }
    }

    applyDigipin(digipin, context) {
      var target = injectIntoCheckout(digipin, this);
      this.dispatchEvent(new CustomEvent("digipin:resolved", {
        bubbles: true,
        detail: { digipin: digipin, target: target }
      }));
      setText(this.shadowRoot, ".status", context + " Saved as " + digipin + " into checkout metadata.", "ok");
    }
  }

  if (!customElements.get("digipin-checkout")) {
    customElements.define("digipin-checkout", DigipinCheckout);
  }
})();
