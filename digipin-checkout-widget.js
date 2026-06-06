/**
 * DIGIPIN Checkout Middleware Widget
 * Implements the Tri-Path Location Router & E-commerce Field Injection.
 */

import { encode, decode, isValidDigipin, BOUNDS } from './digipin-encoder.js';

// Hardcoded fallback PIN database for 100% offline usage
const OFFLINE_PIN_MOCK = {
  "110001": {
    "name": "Connaught Place, New Delhi",
    "lat": 28.6304,
    "lon": 77.2177,
    "bbox": { "minLat": 28.615, "maxLat": 28.645, "minLon": 77.200, "maxLon": 77.235 }
  },
  "201301": {
    "name": "Sector 1 & Noida Office, Noida",
    "lat": 28.5918,
    "lon": 77.3058,
    "bbox": { "minLat": 28.570, "maxLat": 28.610, "minLon": 77.280, "maxLon": 77.330 }
  },
  "122002": {
    "name": "DLF Phase 1-3, Gurugram",
    "lat": 28.4795,
    "lon": 77.0906,
    "bbox": { "minLat": 28.450, "maxLat": 28.510, "minLon": 77.060, "maxLon": 77.120 }
  },
  "400001": {
    "name": "Fort / Colaba, Mumbai",
    "lat": 18.9388,
    "lon": 72.8354,
    "bbox": { "minLat": 18.910, "maxLat": 18.960, "minLon": 72.810, "maxLon": 72.855 }
  },
  "400050": {
    "name": "Bandra West, Mumbai",
    "lat": 19.0544,
    "lon": 72.8402,
    "bbox": { "minLat": 19.030, "maxLat": 19.075, "minLon": 72.820, "maxLon": 72.860 }
  },
  "560001": {
    "name": "MG Road / GPO, Bengaluru",
    "lat": 12.9756,
    "lon": 77.6068,
    "bbox": { "minLat": 12.955, "maxLat": 12.995, "minLon": 77.585, "maxLon": 77.625 }
  },
  "560034": {
    "name": "Koramangala, Bengaluru",
    "lat": 12.9338,
    "lon": 77.6244,
    "bbox": { "minLat": 12.915, "maxLat": 12.950, "minLon": 77.605, "maxLon": 77.645 }
  },
  "600001": {
    "name": "George Town, Chennai",
    "lat": 13.0940,
    "lon": 80.2882,
    "bbox": { "minLat": 13.075, "maxLat": 13.110, "minLon": 80.265, "maxLon": 80.305 }
  },
  "500081": {
    "name": "Madhapur / HITEC City, Hyderabad",
    "lat": 17.4483,
    "lon": 78.3741,
    "bbox": { "minLat": 17.420, "maxLat": 17.470, "minLon": 78.345, "maxLon": 78.400 }
  },
  "700091": {
    "name": "Salt Lake Sector V, Kolkata",
    "lat": 22.5735,
    "lon": 88.4331,
    "bbox": { "minLat": 22.550, "maxLat": 22.595, "minLon": 88.410, "maxLon": 88.455 }
  },
  "411007": {
    "name": "Aundh / University, Pune",
    "lat": 18.5580,
    "lon": 73.8075,
    "bbox": { "minLat": 18.535, "maxLat": 18.575, "minLon": 73.785, "maxLon": 73.830 }
  }
};

export class DigipinWidget {
  constructor(options = {}) {
    this.containerId = options.containerId || 'digipin-checkout-root';
    this.container = document.getElementById(this.containerId);
    this.theme = options.theme || 'light'; // 'light', 'dark', or 'adaptive'
    
    // Inject fields configuration
    this.injectionMode = options.injectionMode || 'both'; // 'address2', 'notes', or 'both'
    
    // Offline / Simulator Options
    this.offlineSimulator = false; 
    
    this.pincodeDb = OFFLINE_PIN_MOCK;
    this.securedCode = null;
    this.state = 'idle'; // idle, capturing_gps, gps_failed, map_active, secured, error
    this.selectedCoords = null;
    this.leafletLoaded = false;
    this.map = null;
    this.marker = null;
    
    this.init();
  }

  async init() {
    if (!this.container) {
      console.warn(`DigipinWidget: Container with ID "${this.containerId}" not found. Trying to auto-inject on DOMContentLoaded.`);
      return;
    }
    
    // Load local pin code database if available (asynchronously)
    try {
      const response = await fetch('./pincode-db.json');
      if (response.ok) {
        const data = await response.json();
        this.pincodeDb = { ...OFFLINE_PIN_MOCK, ...data };
      }
    } catch (e) {
      console.log("DigipinWidget: Failed to fetch external pincode-db.json, using compiled offline mock fallback.");
    }
    
    this.render();
  }

  // Set simulation of offline mode (blocks Leaflet script loading)
  setOfflineSimulation(enabled) {
    this.offlineSimulator = enabled;
  }

  // Load Leaflet map scripts dynamically
  loadLeaflet() {
    return new Promise((resolve, reject) => {
      if (this.offlineSimulator) {
        reject(new Error("Offline Mode Simulated: Leaflet CDN blocked."));
        return;
      }
      
      if (window.L) {
        this.leafletLoaded = true;
        resolve();
        return;
      }

      // Check if Leaflet stylesheet is already loaded
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      
      script.onload = () => {
        this.leafletLoaded = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error("Leaflet script failed to load."));
      };

      document.body.appendChild(script);
    });
  }

  // Render the Widget UI
  render() {
    const isDark = this.theme === 'dark' || (this.theme === 'adaptive' ? 'adaptive-dark' : '');
    
    this.container.innerHTML = `
      <div class="digipin-widget-container ${isDark}">
        <div class="digipin-header">
          <div class="digipin-title-group">
            <div class="digipin-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              1-Click Pinpoint Delivery
            </div>
            <div class="digipin-subtitle">Official India Post DPI Framework</div>
          </div>
          <!-- Tiny India Post Flag Accent -->
          <div style="display: flex; flex-direction: column; width: 28px; height: 18px; border: 1px solid #cbd5e1;">
            <div style="flex:1; background:#FF9933;"></div>
            <div style="flex:1; background:#FFFFFF; display:flex; justify-content:center; align-items:center;">
              <div style="width:4px; height:4px; border-radius:50%; border:1px solid #000080;"></div>
            </div>
            <div style="flex:1; background:#128807;"></div>
          </div>
        </div>
        
        <div class="digipin-content" id="digipin-content-body">
          <!-- State dependent contents will go here -->
        </div>
      </div>
    `;
    
    this.updateWidgetState();
  }

  updateWidgetState() {
    const body = this.container.querySelector('#digipin-content-body');
    if (!body) return;

    if (this.state === 'secured') {
      body.innerHTML = `
        <div class="digipin-secured-badge">
          <div class="digipin-secured-info">
            <svg class="digipin-secured-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="digipin-secured-text">
              <span class="digipin-secured-title">Pinpoint Location Secured</span>
              <span class="digipin-secured-code" id="digipin-badge-code">${this.securedCode}</span>
            </div>
          </div>
          <button class="digipin-secured-reset" id="digipin-reset-btn">Reset</button>
        </div>
      `;
      
      this.container.querySelector('#digipin-reset-btn').addEventListener('click', () => {
        this.clearSecured();
      });
      return;
    }

    // Default Checkout Form State (idle, gps_failed, or error)
    body.innerHTML = `
      <button class="digipin-btn digipin-btn-primary" id="digipin-gps-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
        </svg>
        Secure 4-Meter Delivery Accuracy
      </button>

      <div class="digipin-divider">OR</div>

      <div class="digipin-input-group">
        <label class="digipin-input-label">Away from home? Find your neighborhood</label>
        <div class="digipin-input-row">
          <input type="text" maxlength="6" pattern="^[0-9]{6}$" class="digipin-input" id="digipin-pin-input" placeholder="Enter traditional 6-digit PIN code">
          <button class="digipin-btn digipin-btn-secondary" style="width: auto; padding: 0 14px;" id="digipin-pin-btn">Search</button>
        </div>
      </div>

      <div class="digipin-divider">OR</div>

      <div class="digipin-input-group">
        <label class="digipin-input-label">Have a DIGIPIN? Paste it here</label>
        <input type="text" class="digipin-input" id="digipin-direct-input" placeholder="e.g. 39J-5JP-7J8L">
      </div>
      
      <div id="digipin-feedback-container"></div>
    `;

    // Bind event listeners
    this.container.querySelector('#digipin-gps-btn').addEventListener('click', () => this.handlePathA());
    this.container.querySelector('#digipin-pin-btn').addEventListener('click', () => this.handlePathB());
    this.container.querySelector('#digipin-pin-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handlePathB();
    });
    this.container.querySelector('#digipin-direct-input').addEventListener('input', (e) => this.handlePathC(e.target.value));

    // Show warning/error feedback if we transitioned from a failed state
    if (this.state === 'gps_failed') {
      this.showFeedback('Geolocation accuracy is too low or access was denied. Please enter your 6-digit PIN code below to select your roof on the map.', 'warning');
    } else if (this.state === 'error') {
      this.showFeedback('An error occurred. Please verify your inputs and try again.', 'error');
    }
  }

  showFeedback(message, type = 'info') {
    const feedbackContainer = this.container.querySelector('#digipin-feedback-container');
    if (!feedbackContainer) return;
    
    let icon = '';
    if (type === 'success') {
      icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === 'error' || type === 'warning') {
      icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
      icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    feedbackContainer.innerHTML = `
      <div class="digipin-feedback digipin-feedback-${type}">
        ${icon}
        <span>${message}</span>
      </div>
    `;
  }

  // PATH A: Geolocation GPS
  handlePathA() {
    const btn = this.container.querySelector('#digipin-gps-btn');
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="animate-spin" style="animation: spin 1s linear infinite; width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Locating...
    `;

    // Set inline rotation keyframes in document if they don't exist
    if (!document.getElementById('digipin-spin-keyframes')) {
      const style = document.createElement('style');
      style.id = 'digipin-spin-keyframes';
      style.innerHTML = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }

    if (!navigator.geolocation) {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
      this.state = 'gps_failed';
      this.updateWidgetState();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`GPS Location: Lat ${latitude}, Lon ${longitude}, Accuracy ${accuracy}m`);

        // Check if accuracy is high (< 10 meters)
        if (accuracy <= 10) {
          try {
            const digipin = encode(latitude, longitude);
            this.setSecuredCode(digipin);
          } catch (e) {
            console.error("GPS Bounds Encoding Error: ", e);
            btn.innerHTML = originalHtml;
            btn.disabled = false;
            this.showFeedback("Your GPS location appears to be outside India Post's bounding box.", "error");
          }
        } else {
          // Accuracy too low, soft fallback to Path B
          btn.innerHTML = originalHtml;
          btn.disabled = false;
          this.state = 'gps_failed';
          this.updateWidgetState();
        }
      },
      (error) => {
        console.warn("GPS Geolocation failed or denied: ", error);
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        this.state = 'gps_failed';
        this.updateWidgetState();
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    );
  }

  // PATH B: Traditional PIN Fallback
  async handlePathB() {
    const input = this.container.querySelector('#digipin-pin-input');
    const pinCode = input.value.trim();

    if (!/^[0-9]{6}$/.test(pinCode)) {
      input.classList.add('is-invalid');
      this.showFeedback("Please enter a valid 6-digit numerical PIN code.", "error");
      return;
    }
    input.classList.remove('is-invalid');

    const pinData = this.pincodeDb[pinCode];
    if (!pinData) {
      this.showFeedback("PIN code not found in offline local directory. Try '201301' or '110001' for testing.", "warning");
      return;
    }

    // Centroid found. Load map modal!
    this.showMapModal(pinData, pinCode);
  }

  // PATH C: Direct Entry
  handlePathC(value) {
    const input = this.container.querySelector('#digipin-direct-input');
    const cleanValue = value.trim();
    
    if (cleanValue === '') {
      input.classList.remove('is-invalid');
      return;
    }

    if (isValidDigipin(cleanValue)) {
      input.classList.remove('is-invalid');
      // Set the code directly!
      this.setSecuredCode(cleanValue.toUpperCase());
    } else {
      input.classList.add('is-invalid');
      this.showFeedback("Invalid DIGIPIN format. Expected: e.g. 39J-5JP-7J8L", "error");
    }
  }

  // Show Leaflet Map popup modal
  async showMapModal(pinData, pinCode) {
    // Create Modal Element in body
    const modal = document.createElement('div');
    modal.className = 'digipin-map-modal';
    modal.id = 'digipin-map-overlay';
    
    modal.innerHTML = `
      <div class="digipin-map-card">
        <div class="digipin-map-header">
          <h3 class="digipin-map-title">
            <span>Rooftop Delivery Pinpoint</span>
            <button class="digipin-map-close" id="digipin-modal-close-btn">&times;</button>
          </h3>
          <span class="digipin-map-prompt">Centering on: <strong>${pinData.name} (${pinCode})</strong></span>
        </div>
        <div class="digipin-map-body">
          <div class="digipin-map-element" id="leaflet-map-container"></div>
          <div id="digipin-offline-map-fallback" style="display:none; position:absolute; top:0; left:0; right:0; bottom:0; background:#f8fafc; z-index:10000; padding:24px; text-align:center; flex-direction:column; justify-content:center; align-items:center; gap:16px;">
            <p style="font-weight:600; color:var(--digipin-danger); margin:0;">Offline Map Mode</p>
            <p style="font-size:12px; color:var(--digipin-text-muted); max-width:400px; margin:0;">The interactive mapping server cannot be reached. To secure pinpoint accuracy, manually confirm coordinates centered in this PIN code neighborhood:</p>
            <div style="display:flex; gap:12px; font-family:monospace; font-size:14px; background:#f1f5f9; padding:8px 12px; border-radius:6px;">
              <span>Lat: ${pinData.lat.toFixed(4)}</span>
              <span>Lon: ${pinData.lon.toFixed(4)}</span>
            </div>
            <button class="digipin-btn digipin-btn-primary" id="offline-map-bypass-btn" style="max-width:200px;">Confirm Centroid Location</button>
          </div>
        </div>
        <div class="digipin-map-footer">
          <span style="font-size:11px; color:var(--digipin-text-muted); align-self:center; flex:2;">
            Click or drag the marker to your rooftop. Secure 4-meter accuracy.
          </span>
          <button class="digipin-btn digipin-btn-secondary" id="digipin-modal-cancel">Cancel</button>
          <button class="digipin-btn digipin-btn-primary" id="digipin-modal-submit" disabled>Confirm Location</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#digipin-modal-close-btn');
    const cancelBtn = modal.querySelector('#digipin-modal-cancel');
    const submitBtn = modal.querySelector('#digipin-modal-submit');
    const offlineBypassBtn = modal.querySelector('#offline-map-bypass-btn');
    
    const closeModal = () => {
      if (this.map) {
        this.map.remove();
        this.map = null;
      }
      modal.remove();
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Attempt to load Leaflet and initialize map
    try {
      await this.loadLeaflet();
      
      const mapContainer = modal.querySelector('#leaflet-map-container');
      const lat = pinData.lat;
      const lon = pinData.lon;
      
      // Initialize Leaflet Map
      this.map = L.map(mapContainer).setView([lat, lon], 17);
      
      // Load OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);
      
      // Create drag-and-drop marker
      this.marker = L.marker([lat, lon], {
        draggable: true,
        autoPan: true
      }).addTo(this.map);
      
      this.selectedCoords = { lat, lon };
      submitBtn.disabled = false; // Coordinates set, submit enabled

      // Update coordinates on dragend
      this.marker.on('dragend', (e) => {
        const markerPos = this.marker.getLatLng();
        this.selectedCoords = { lat: markerPos.lat, lon: markerPos.lng };
        console.log("Marker dragged to: ", this.selectedCoords);
      });

      // Update coordinates on map click
      this.map.on('click', (e) => {
        const clickedPos = e.latlng;
        this.marker.setLatLng(clickedPos);
        this.selectedCoords = { lat: clickedPos.lat, lon: clickedPos.lng };
        console.log("Map clicked at: ", this.selectedCoords);
      });

    } catch (e) {
      console.warn("Leaflet Map Load Failed: ", e);
      // Map loading failed (e.g. no internet/offline simulation). Show offline fallback.
      modal.querySelector('#digipin-offline-map-fallback').style.display = 'flex';
      
      // Allow confirming centroid directly without interactive map
      offlineBypassBtn.addEventListener('click', () => {
        const digipin = encode(pinData.lat, pinData.lon);
        this.setSecuredCode(digipin);
        closeModal();
      });
    }

    submitBtn.addEventListener('click', () => {
      if (this.selectedCoords) {
        try {
          const digipin = encode(this.selectedCoords.lat, this.selectedCoords.lon);
          this.setSecuredCode(digipin);
          closeModal();
        } catch (err) {
          console.error("Map Pin Out of Bounds: ", err);
          alert("Selected location is outside the valid India Post coordinates box.");
        }
      }
    });
  }

  // State Updates: Secured DIGIPIN
  setSecuredCode(code) {
    this.securedCode = code;
    this.state = 'secured';
    this.render();
    this.injectIntoCheckoutFields(code);
  }

  clearSecured() {
    this.securedCode = null;
    this.state = 'idle';
    this.render();
    this.injectIntoCheckoutFields('');
  }

  // Shopify/WooCommerce Shipping Fields Auto-Injection & DOM Synced Events
  injectIntoCheckoutFields(code) {
    const valueToInject = code ? `DIGIPIN: ${code}` : '';
    
    // Comprehensive selector list for Address Line 2
    const address2Selectors = [
      'input[name="checkout[shipping_address][address2]"]', // Shopify checkout address2
      '#checkout_shipping_address_address2',               // Shopify address2 alternative
      '#shipping_address_2',                                 // WooCommerce shipping address 2
      '#billing_address_2',                                  // WooCommerce billing address 2
      'input[autocomplete="address-line2"]',                 // Autocomplete Address Line 2
      'input[name="address2"]',                              // Generic WooCommerce/Shopify address2
      'input[placeholder*="Apartment"], input[placeholder*="Suite"], input[placeholder*="Suite, unit, etc."]'
    ];

    // Comprehensive selector list for Shipping Notes / Order Comments
    const notesSelectors = [
      '#order_comments',                                     // WooCommerce order notes
      'textarea[name="order_comments"]',                     // WooCommerce order notes alternative
      'textarea[name="checkout[note]"]',                     // Shopify cart note / shipping note
      '[name="checkout[note]"]',                             // Shopify checkout note
      'textarea[id="checkout_note"]',                        // Shopify alternative
      '#note'                                                // Generic order note
    ];

    let injectedAny = false;

    // 1. Inject into Address Line 2 (if enabled)
    if (this.injectionMode === 'address2' || this.injectionMode === 'both') {
      for (const selector of address2Selectors) {
        const el = document.querySelector(selector);
        if (el) {
          this.updateValueProgrammatically(el, valueToInject, true);
          injectedAny = true;
        }
      }
    }

    // 2. Inject into Shipping Notes (if enabled)
    if (this.injectionMode === 'notes' || this.injectionMode === 'both') {
      for (const selector of notesSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          this.updateValueProgrammatically(el, valueToInject, false);
          injectedAny = true;
        }
      }
    }

    if (injectedAny) {
      console.log(`DigipinWidget: Injected "${valueToInject}" successfully into checkout form fields.`);
    } else {
      console.log(`DigipinWidget: E-commerce fields not found on this page. Appending DIGIPIN payload to window metadata.`);
    }
    
    // Save to window metadata to ensure e-commerce checkouts can pick it up via API
    window.digipinCheckoutMetadata = {
      digipin: code,
      injected: injectedAny,
      timestamp: new Date().toISOString()
    };
  }

  // Update input/textarea programmatically and trigger UI Framework change detectors
  updateValueProgrammatically(element, val, isAddress2Field) {
    const existing = element.value;
    
    if (!val) {
      // CLEAR mode: Remove any existing DIGIPIN pattern from the input
      if (existing.includes('DIGIPIN:')) {
        const cleaned = existing.replace(/DIGIPIN:\s*[2-9JKMPWGXCF-Tcf-t]{3}-[2-9JKMPWGXCF-Tcf-t]{3}-[2-9JKMPWGXCF-Tcf-t]{4}(,\s*)?/, '');
        element.value = cleaned;
      }
    } else {
      // SET mode
      if (existing.includes('DIGIPIN:')) {
        // Regex to replace existing DIGIPIN pattern cleanly
        const regex = /DIGIPIN:\s*[2-9JKMPWGXCF-Tcf-t]{3}-[2-9JKMPWGXCF-Tcf-t]{3}-[2-9JKMPWGXCF-Tcf-t]{4}/g;
        element.value = existing.replace(regex, val);
      } else {
        // Prepend DIGIPIN and separate with a comma if existing text exists
        if (existing.trim().length > 0) {
          element.value = `${val}, ${existing}`;
        } else {
          element.value = val;
        }
      }
    }

    // Dispatch DOM events so React / Vue / Shopify theme frameworks notice the change
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

// Auto-initialize if DOM element exists and data-auto-init is set
document.addEventListener('DOMContentLoaded', () => {
  const mountEl = document.getElementById('digipin-checkout-root');
  if (mountEl && mountEl.dataset.autoInit !== 'false') {
    window.digipinWidget = new DigipinWidget({
      theme: mountEl.dataset.theme || 'light',
      injectionMode: mountEl.dataset.injectionMode || 'both'
    });
  }
});
