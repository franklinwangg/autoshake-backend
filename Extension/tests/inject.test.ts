import { describe, expect, it } from 'vitest';
import { findJobIdInObject, normalizeId, isObject } from '../inject';

const sampleJobGraphQL: { data: { job: { id: string; __typename: string } } } = {
  data: {
    job: {
      id: '11054220',
      __typename: 'Job',
    },
  },
};

describe('findJobIdInObject_givenSampleGraphQL_returnsId', () => {
  it('returns 11054220 for the sample GraphQL payload', () => {
    expect(findJobIdInObject(sampleJobGraphQL.data)).toBe('11054220');
  });
});

// ============ normalizeId Tests ============
describe('normalizeId_givenValidNumericString_returnsString', () => {
  it('returns the numeric string as-is', () => {
    expect(normalizeId('12345')).toBe('12345');
  });
});

describe('normalizeId_givenValidNumber_returnsStringNumber', () => {
  it('converts integer to string', () => {
    expect(normalizeId(12345)).toBe('12345');
  });
});

describe('normalizeId_givenNullInput_returnsNull', () => {
  it('returns null for null', () => {
    expect(normalizeId(null)).toBeNull();
  });
});

describe('normalizeId_givenUndefinedInput_returnsNull', () => {
  it('returns null for undefined', () => {
    expect(normalizeId(undefined)).toBeNull();
  });
});

describe('normalizeId_givenNonNumericString_returnsNull', () => {
  it('returns null for strings with letters', () => {
    expect(normalizeId('abc123')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(normalizeId('')).toBeNull();
  });
});

describe('normalizeId_givenFloatingPointNumber_returnsNull', () => {
  it('returns null for decimal numbers', () => {
    expect(normalizeId(123.45)).toBeNull();
  });
});

describe('normalizeId_givenObjectOrArray_returnsNull', () => {
  it('returns null for objects', () => {
    expect(normalizeId({})).toBeNull();
  });

  it('returns null for arrays', () => {
    expect(normalizeId([])).toBeNull();
  });
});

// ============ isObject Tests ============
describe('isObject_givenValidObject_returnsTrue', () => {
  it('returns true for plain objects', () => {
    expect(isObject({})).toBe(true);
  });

  it('returns true for objects with properties', () => {
    expect(isObject({ a: 1 })).toBe(true);
  });

  it('returns true for arrays', () => {
    expect(isObject([])).toBe(true);
  });
});

describe('isObject_givenNullInput_returnsFalse', () => {
  it('returns false for null', () => {
    expect(isObject(null)).toBe(false);
  });
});

describe('isObject_givenPrimitiveValues_returnsFalse', () => {
  it('returns false for strings', () => {
    expect(isObject('string')).toBe(false);
  });

  it('returns false for numbers', () => {
    expect(isObject(123)).toBe(false);
  });

  it('returns false for booleans', () => {
    expect(isObject(true)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isObject(undefined)).toBe(false);
  });
});

// ============ findJobIdInObject Tests ============
describe('findJobIdInObject_givenNullInput_returnsNull', () => {
  it('returns null for null', () => {
    expect(findJobIdInObject(null)).toBeNull();
  });
});

describe('findJobIdInObject_givenUndefinedInput_returnsNull', () => {
  it('returns null for undefined', () => {
    expect(findJobIdInObject(undefined)).toBeNull();
  });
});

describe('findJobIdInObject_givenPrimitiveValue_returnsNull', () => {
  it('returns null for string', () => {
    expect(findJobIdInObject('not an object')).toBeNull();
  });

  it('returns null for number', () => {
    expect(findJobIdInObject(123)).toBeNull();
  });

  it('returns null for boolean', () => {
    expect(findJobIdInObject(true)).toBeNull();
  });
});

describe('findJobIdInObject_givenEmptyObject_returnsNull', () => {
  it('returns null for empty object', () => {
    expect(findJobIdInObject({})).toBeNull();
  });
});

describe('findJobIdInObject_givenEmptyArray_returnsNull', () => {
  it('returns null for empty array', () => {
    expect(findJobIdInObject([])).toBeNull();
  });
});

describe('findJobIdInObject_givenObjectWithoutJobId_returnsNull', () => {
  it('returns null when no ID fields present', () => {
    expect(findJobIdInObject({ name: 'John', title: 'Engineer' })).toBeNull();
  });

  it('returns null when job object has no ID', () => {
    expect(findJobIdInObject({ job: { title: 'Engineer' } })).toBeNull();
  });
});

describe('findJobIdInObject_givenInvalidIdValue_returnsNull', () => {
  it('returns null for non-numeric string ID', () => {
    expect(findJobIdInObject({ jobId: 'not-a-number' })).toBeNull();
  });

  it('returns null for null ID', () => {
    expect(findJobIdInObject({ jobId: null })).toBeNull();
  });

  it('returns null for undefined ID', () => {
    expect(findJobIdInObject({ jobId: undefined })).toBeNull();
  });
});

describe('findJobIdInObject_givenArrayOfInvalidObjects_returnsNull', () => {
  it('returns null when array contains no valid job IDs', () => {
    expect(findJobIdInObject([
      { name: 'Job 1' },
      { title: 'Engineer' },
      { id: 'not-numeric' },
    ])).toBeNull();
  });
});
