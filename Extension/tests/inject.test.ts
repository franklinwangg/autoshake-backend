import { describe, expect, it } from 'vitest';
import { FindJobIdInObject, NormalizeId, IsObject } from '../inject';

const sampleJobGraphQL: { data: { job: { id: string; __typename: string } } } = {
  data: {
    job: {
      id: '11054220',
      __typename: 'Job',
    },
  },
};

describe('FindJobIdInObject_givenSampleGraphQL_returnsId', () => {
  it('returns 11054220 for the sample GraphQL payload', () => {
    expect(FindJobIdInObject(sampleJobGraphQL.data)).toBe('11054220');
  });
});

// ============ NormalizeId Tests ============
describe('NormalizeId_givenValidNumericString_returnsString', () => {
  it('returns the numeric string as-is', () => {
    expect(NormalizeId('12345')).toBe('12345');
  });
});

describe('NormalizeId_givenValidNumber_returnsStringNumber', () => {
  it('converts integer to string', () => {
    expect(NormalizeId(12345)).toBe('12345');
  });
});

describe('NormalizeId_givenNullInput_returnsNull', () => {
  it('returns null for null', () => {
    expect(NormalizeId(null)).toBeNull();
  });
});

describe('NormalizeId_givenUndefinedInput_returnsNull', () => {
  it('returns null for undefined', () => {
    expect(NormalizeId(undefined)).toBeNull();
  });
});

describe('NormalizeId_givenNonNumericString_returnsNull', () => {
  it('returns null for strings with letters', () => {
    expect(NormalizeId('abc123')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(NormalizeId('')).toBeNull();
  });
});

describe('NormalizeId_givenFloatingPointNumber_returnsNull', () => {
  it('returns null for decimal numbers', () => {
    expect(NormalizeId(123.45)).toBeNull();
  });
});

describe('NormalizeId_givenObjectOrArray_returnsNull', () => {
  it('returns null for objects', () => {
    expect(NormalizeId({})).toBeNull();
  });

  it('returns null for arrays', () => {
    expect(NormalizeId([])).toBeNull();
  });
});

// ============ IsObject Tests ============
describe('IsObject_givenValidObject_returnsTrue', () => {
  it('returns true for plain objects', () => {
    expect(IsObject({})).toBe(true);
  });

  it('returns true for objects with properties', () => {
    expect(IsObject({ a: 1 })).toBe(true);
  });

  it('returns true for arrays', () => {
    expect(IsObject([])).toBe(true);
  });
});

describe('IsObject_givenNullInput_returnsFalse', () => {
  it('returns false for null', () => {
    expect(IsObject(null)).toBe(false);
  });
});

describe('IsObject_givenPrimitiveValues_returnsFalse', () => {
  it('returns false for strings', () => {
    expect(IsObject('string')).toBe(false);
  });

  it('returns false for numbers', () => {
    expect(IsObject(123)).toBe(false);
  });

  it('returns false for booleans', () => {
    expect(IsObject(true)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(IsObject(undefined)).toBe(false);
  });
});

// ============ FindJobIdInObject Tests ============
describe('FindJobIdInObject_givenNullInput_returnsNull', () => {
  it('returns null for null', () => {
    expect(FindJobIdInObject(null)).toBeNull();
  });
});

describe('FindJobIdInObject_givenUndefinedInput_returnsNull', () => {
  it('returns null for undefined', () => {
    expect(FindJobIdInObject(undefined)).toBeNull();
  });
});

describe('FindJobIdInObject_givenPrimitiveValue_returnsNull', () => {
  it('returns null for string', () => {
    expect(FindJobIdInObject('not an object')).toBeNull();
  });

  it('returns null for number', () => {
    expect(FindJobIdInObject(123)).toBeNull();
  });

  it('returns null for boolean', () => {
    expect(FindJobIdInObject(true)).toBeNull();
  });
});

describe('FindJobIdInObject_givenEmptyObject_returnsNull', () => {
  it('returns null for empty object', () => {
    expect(FindJobIdInObject({})).toBeNull();
  });
});

describe('FindJobIdInObject_givenEmptyArray_returnsNull', () => {
  it('returns null for empty array', () => {
    expect(FindJobIdInObject([])).toBeNull();
  });
});

describe('FindJobIdInObject_givenObjectWithoutJobId_returnsNull', () => {
  it('returns null when no ID fields present', () => {
    expect(FindJobIdInObject({ name: 'John', title: 'Engineer' })).toBeNull();
  });

  it('returns null when job object has no ID', () => {
    expect(FindJobIdInObject({ job: { title: 'Engineer' } })).toBeNull();
  });
});

describe('FindJobIdInObject_givenInvalidIdValue_returnsNull', () => {
  it('returns null for non-numeric string ID', () => {
    expect(FindJobIdInObject({ jobId: 'not-a-number' })).toBeNull();
  });

  it('returns null for null ID', () => {
    expect(FindJobIdInObject({ jobId: null })).toBeNull();
  });

  it('returns null for undefined ID', () => {
    expect(FindJobIdInObject({ jobId: undefined })).toBeNull();
  });
});

describe('FindJobIdInObject_givenArrayOfInvalidObjects_returnsNull', () => {
  it('returns null when array contains no valid job IDs', () => {
    expect(FindJobIdInObject([
      { name: 'Job 1' },
      { title: 'Engineer' },
      { id: 'not-numeric' },
    ])).toBeNull();
  });
});
