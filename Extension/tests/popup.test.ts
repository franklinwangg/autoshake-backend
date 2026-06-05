import { describe, expect, it } from 'vitest';
import { ExtractJobField, GetFieldFromObject, FindJobIdInObject, NormalizeId, IsObject } from '../scripts/popupUtils';
import type { GraphqlResponse } from '../scripts/types';

// ============ GetFieldFromObject Tests ============
describe('GetFieldFromObject_givenSingleLevelPath_returnsValue', () => {
  it('returns value at single-level path', () => {
    const obj: { name: string; age: number } = { name: 'John', age: 30 };
    expect(GetFieldFromObject(obj, ['name'])).toBe('John');
  });
});

describe('GetFieldFromObject_givenNestedPath_returnsValue', () => {
  it('returns value at nested path', () => {
    const obj: { job: { employer: { name: string } } } = { job: { employer: { name: 'Apple' } } };
    expect(GetFieldFromObject(obj, ['job', 'employer', 'name'])).toBe('Apple');
  });
});

describe('GetFieldFromObject_givenMissingField_returnsNull', () => {
  it('returns null for missing field', () => {
    const obj: { name: string } = { name: 'John' };
    expect(GetFieldFromObject(obj, ['age'])).toBeNull();
  });
});

describe('GetFieldFromObject_givenIncompletePath_returnsNull', () => {
  it('returns null for incomplete nested path', () => {
    const obj: { job: { title: string } } = { job: { title: 'Engineer' } };
    expect(GetFieldFromObject(obj, ['job', 'employer', 'name'])).toBeNull();
  });
});

describe('GetFieldFromObject_givenPathHitsNonObject_returnsNull', () => {
  it('returns null when path hits non-object', () => {
    const obj: { job: string } = { job: 'Engineer' };
    expect(GetFieldFromObject(obj, ['job', 'employer', 'name'])).toBeNull();
  });
});

describe('GetFieldFromObject_givenNullObject_returnsNull', () => {
  it('handles null object gracefully', () => {
    expect(GetFieldFromObject(null, ['name'])).toBeNull();
  });
});

describe('GetFieldFromObject_givenUndefinedObject_returnsNull', () => {
  it('handles undefined gracefully', () => {
    expect(GetFieldFromObject(undefined, ['name'])).toBeNull();
  });
});

describe('GetFieldFromObject_givenEmptyKeyPath_returnsValue', () => {
  it('returns value at empty array path element', () => {
    const obj: Record<string, string> = { '': 'value' };
    expect(GetFieldFromObject(obj, [''])).toBe('value');
  });
});

// ============ ExtractJobField Tests ============
const MockResponse = (data: unknown): GraphqlResponse => ({
  url: 'https://app.joinhandshake.com/graphql',
  data: JSON.stringify(data),
  timestamp: new Date().toISOString(),
});

describe('ExtractJobField_givenValidResponse_returnsJobTitle', () => {
  it('extracts job title from first response', () => {
    const responses: GraphqlResponse[] = [
      MockResponse({
        data: { job: { title: 'Software Engineer' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('Software Engineer');
  });
});

describe('ExtractJobField_givenNestedEmployerData_returnsEmployerName', () => {
  it('extracts nested employer name', () => {
    const responses: GraphqlResponse[] = [
      MockResponse({
        data: { job: { employer: { name: 'Google' } } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'employer', 'name'])).toBe('Google');
  });
});

describe('ExtractJobField_givenEmptyResponses_returnsNull', () => {
  it('returns null for empty responses array', () => {
    expect(ExtractJobField([], ['job', 'title'])).toBeNull();
  });
});

describe('ExtractJobField_givenNonArrayInput_returnsNull', () => {
  it('returns null when input is not an array', () => {
    expect(ExtractJobField(null as unknown as GraphqlResponse[], ['job', 'title'])).toBeNull();
    expect(ExtractJobField(undefined as unknown as GraphqlResponse[], ['job', 'title'])).toBeNull();
    expect(ExtractJobField({} as unknown as GraphqlResponse[], ['job', 'title'])).toBeNull();
  });
});

describe('ExtractJobField_givenInvalidJSON_skipsResponseAndFindsValid', () => {
  it('skips responses with invalid JSON', () => {
    const responses: GraphqlResponse[] = [
      { data: 'invalid json {]', url: '', timestamp: new Date().toISOString() },
      MockResponse({
        data: { job: { title: 'Valid Job' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('Valid Job');
  });
});

describe('ExtractJobField_givenMissingDataProperty_skipsResponse', () => {
  it('skips responses with missing data property', () => {
    const responses: GraphqlResponse[] = [
      { noDataField: 'value', url: '', data: '', timestamp: new Date().toISOString() } as unknown as GraphqlResponse,
      MockResponse({
        data: { job: { title: 'Found Title' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('Found Title');
  });
});

describe('ExtractJobField_givenNonStringData_skipsResponse', () => {
  it('skips responses with non-string data field', () => {
    const responses: GraphqlResponse[] = [
      { data: { job: { title: 'This is an object, not string' } } as unknown as string, url: '', timestamp: new Date().toISOString() },
      MockResponse({
        data: { job: { title: 'String data' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('String data');
  });
});

describe('ExtractJobField_givenEmptyStringField_returnsNull', () => {
  it('returns null when field is empty string', () => {
    const responses: GraphqlResponse[] = [
      MockResponse({
        data: { job: { title: '   ' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBeNull();
  });
});

describe('ExtractJobField_givenWhitespaceField_preservesWhitespace', () => {
  it('trims whitespace from returned values', () => {
    const responses: GraphqlResponse[] = [
      MockResponse({
        data: { job: { title: '  Software Engineer  ' } },
      }),
    ];
    const result: string | null = ExtractJobField(responses, ['job', 'title']);
    expect(result).toBe('  Software Engineer  ');
  });
});

describe('ExtractJobField_givenNestedObjectData_searchesAndFinds', () => {
  it('searches nested objects in parsed.data', () => {
    const responses: GraphqlResponse[] = [
      MockResponse({
        data: {
          someKey: {
            job: { title: 'Found in nested object' },
          },
        },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('Found in nested object');
  });
});

describe('ExtractJobField_givenMultipleResponses_returnsFirstMatch', () => {
  it('returns first matching value from multiple responses', () => {
    const responses: GraphqlResponse[] = [
      MockResponse({
        data: { job: { title: 'First Job' } },
      }),
      MockResponse({
        data: { job: { title: 'Second Job' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('First Job');
  });
});

describe('ExtractJobField_givenNullDataInResponse_skipsAndFinds', () => {
  it('handles response with null data', () => {
    const responses: GraphqlResponse[] = [
      { data: JSON.stringify(null), url: '', timestamp: new Date().toISOString() },
      MockResponse({
        data: { job: { title: 'Valid Job' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('Valid Job');
  });
});

describe('ExtractJobField_givenMultipleTopLevelObjects_searchesAll', () => {
  it('searches through multiple top-level object values', () => {
    const responses: GraphqlResponse[] = [
      MockResponse({
        data: {
          getJob: { job: { title: 'Job Title A' } },
          getUserData: { employee: 'John' },
        },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('Job Title A');
  });
});

describe('ExtractJobField_givenEmptyPath_returnsNull', () => {
  it('returns null when path is empty array', () => {
    const responses: GraphqlResponse[] = [
      MockResponse({
        data: { job: { title: 'Some Job' } },
      }),
    ];
    expect(ExtractJobField(responses, [])).toBeNull();
  });
});

describe('ExtractJobField_givenDeeplyNestedPath_returnsValue', () => {
  it('handles deeply nested paths', () => {
    const responses: GraphqlResponse[] = [
      MockResponse({
        data: {
          job: {
            employer: {
              address: {
                country: {
                  name: 'United States',
                },
              },
            },
          },
        },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'employer', 'address', 'country', 'name'])).toBe(
      'United States'
    );
  });
});

describe('ExtractJobField_givenNonStringValueAtPath_skipsAndFinds', () => {
  it('skips non-string values at the target path', () => {
    const responses: GraphqlResponse[] = [
      MockResponse({
        data: {
          job: { title: { nested: 'object' } },
        },
      }),
      MockResponse({
        data: { job: { title: 'Valid String Title' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('Valid String Title');
  });
});

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
