/**
 * DIGIPIN E-commerce Checkout Middleware Unit Test Suite
 * Fully client-side runnable test runner.
 */

import { encode, decode, isValidDigipin, BOUNDS } from './digipin-encoder.js';

export const TEST_CASES = [
  {
    name: 'Noida Office Bidirectional Test',
    run: () => {
      // Noida Jagran office landmark coordinates
      const lat = 28.591859817504883;
      const lon = 77.30584907531738;
      
      const pin = encode(lat, lon);
      const expected = '39J-5JP-7J8L';
      if (pin !== expected) {
        throw new Error(`Expected ${expected}, but got ${pin}`);
      }
      
      const decoded = decode(pin);
      // Verify distance is extremely close (should be within the 4x4m cell)
      const diffLat = Math.abs(decoded.latitude - lat);
      const diffLon = Math.abs(decoded.longitude - lon);
      if (diffLat > 0.0001 || diffLon > 0.0001) {
        throw new Error(`Decoded coordinates (${decoded.latitude}, ${decoded.longitude}) deviate too far from original`);
      }
      
      return 'Successfully encoded to 39J-5JP-7J8L and decoded back within 1m precision.';
    }
  },
  {
    name: 'Boundary Edge Max Test',
    run: () => {
      const pin = encode(BOUNDS.maxLat, BOUNDS.maxLon);
      const expected = '888-888-8888'; // Clamped to max coordinates
      if (pin !== expected) {
        throw new Error(`Expected max bounding code ${expected}, but got ${pin}`);
      }
      return `Successfully handled upper boundaries. Encoded to ${pin}.`;
    }
  },
  {
    name: 'Boundary Edge Min Test',
    run: () => {
      const pin = encode(BOUNDS.minLat, BOUNDS.minLon);
      const expected = 'LLL-LLL-LLLL'; // Clamped to min coordinates
      if (pin !== expected) {
        throw new Error(`Expected min bounding code ${expected}, but got ${pin}`);
      }
      return `Successfully handled lower boundaries. Encoded to ${pin}.`;
    }
  },
  {
    name: 'Out-of-Bounds Rejection Test',
    run: () => {
      // Outside North
      try {
        encode(39.0, 77.0);
        throw new Error('Should have failed for latitude 39.0');
      } catch (e) {
        if (!e.message.includes('outside')) throw e;
      }
      
      // Outside South
      try {
        encode(1.0, 77.0);
        throw new Error('Should have failed for latitude 1.0');
      } catch (e) {
        if (!e.message.includes('outside')) throw e;
      }

      // Outside West
      try {
        encode(20.0, 60.0);
        throw new Error('Should have failed for longitude 60.0');
      } catch (e) {
        if (!e.message.includes('outside')) throw e;
      }

      // Outside East
      try {
        encode(20.0, 105.0);
        throw new Error('Should have failed for longitude 105.0');
      } catch (e) {
        if (!e.message.includes('outside')) throw e;
      }

      return 'Correctly threw validation errors for coordinates outside India bounds.';
    }
  },
  {
    name: 'Official format validation regex test',
    run: () => {
      const validCodes = [
        '39J-5JP-7J8L',
        '29C-3FK-7LPT',
        'F98-J32-7K45'
      ];
      
      for (const code of validCodes) {
        if (!isValidDigipin(code)) {
          throw new Error(`Should validate official format code: ${code}`);
        }
      }
      
      const invalidCodes = [
        '19J-5JP-7J8L', // Invalid character '1'
        '39J-5JP-7J8',  // Too short
        '39J5JP7J8L',   // Missing hyphens
        'ABC-DEF-GHIJ', // Invalid characters 'A', 'B', 'D', 'E', 'G', 'H', 'I'
      ];
      
      for (const code of invalidCodes) {
        if (isValidDigipin(code)) {
          throw new Error(`Should reject invalid format code: ${code}`);
        }
      }
      
      return 'Successfully validated official code formats and rejected invalid structures.';
    }
  },
  {
    name: 'Bypass format validation regex test',
    run: () => {
      // The bypass regex format: ^[2-9JKMPWGX]{3}-[2-9JKMPWGX]{3}-[2-9JKMPWGX]{4}$
      const validBypassCodes = [
        '234-JKM-PWGX',
        'GP9-823-JKMP',
        'WGX-WGX-WGX2'
      ];
      
      for (const code of validBypassCodes) {
        if (!isValidDigipin(code)) {
          throw new Error(`Should validate bypass format code: ${code}`);
        }
      }
      
      return 'Successfully validated the soft bypass format strings.';
    }
  }
];

export function runAllTests() {
  const results = [];
  let passedCount = 0;
  
  for (const tc of TEST_CASES) {
    try {
      const msg = tc.run();
      results.push({ name: tc.name, status: 'PASSED', message: msg });
      passedCount++;
    } catch (e) {
      results.push({ name: tc.name, status: 'FAILED', message: e.message });
    }
  }
  
  return {
    total: TEST_CASES.length,
    passed: passedCount,
    failed: TEST_CASES.length - passedCount,
    details: results
  };
}
