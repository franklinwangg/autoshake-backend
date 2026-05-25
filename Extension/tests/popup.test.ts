import { describe, expect, it } from 'vitest';
import { ExtractJobField, getFieldFromObject } from '../popupUtils';
import type { GraphqlResponse } from '../types';

// ============ getFieldFromObject Tests ============
describe('getFieldFromObject_givenSingleLevelPath_returnsValue', () => {
  it('returns value at single-level path', () => {
    const obj: { name: string; age: number } = { name: 'John', age: 30 };
    expect(getFieldFromObject(obj, ['name'])).toBe('John');
  });
});

describe('getFieldFromObject_givenNestedPath_returnsValue', () => {
  it('returns value at nested path', () => {
    const obj: { job: { employer: { name: string } } } = { job: { employer: { name: 'Apple' } } };
    expect(getFieldFromObject(obj, ['job', 'employer', 'name'])).toBe('Apple');
  });
});

describe('getFieldFromObject_givenMissingField_returnsNull', () => {
  it('returns null for missing field', () => {
    const obj: { name: string } = { name: 'John' };
    expect(getFieldFromObject(obj, ['age'])).toBeNull();
  });
});

describe('getFieldFromObject_givenIncompletePath_returnsNull', () => {
  it('returns null for incomplete nested path', () => {
    const obj: { job: { title: string } } = { job: { title: 'Engineer' } };
    expect(getFieldFromObject(obj, ['job', 'employer', 'name'])).toBeNull();
  });
});

describe('getFieldFromObject_givenPathHitsNonObject_returnsNull', () => {
  it('returns null when path hits non-object', () => {
    const obj: { job: string } = { job: 'Engineer' };
    expect(getFieldFromObject(obj, ['job', 'employer', 'name'])).toBeNull();
  });
});

describe('getFieldFromObject_givenNullObject_returnsNull', () => {
  it('handles null object gracefully', () => {
    expect(getFieldFromObject(null, ['name'])).toBeNull();
  });
});

describe('getFieldFromObject_givenUndefinedObject_returnsNull', () => {
  it('handles undefined gracefully', () => {
    expect(getFieldFromObject(undefined, ['name'])).toBeNull();
  });
});

describe('getFieldFromObject_givenEmptyKeyPath_returnsValue', () => {
  it('returns value at empty array path element', () => {
    const obj: Record<string, string> = { '': 'value' };
    expect(getFieldFromObject(obj, [''])).toBe('value');
  });
});

// ============ ExtractJobField Tests ============
const mockResponse = (data: unknown): GraphqlResponse => ({
  url: 'https://app.joinhandshake.com/graphql',
  data: JSON.stringify(data),
  timestamp: new Date().toISOString(),
});

describe('ExtractJobField_givenValidResponse_returnsJobTitle', () => {
  it('extracts job title from first response', () => {
    const responses: GraphqlResponse[] = [
      mockResponse({
        data: { job: { title: 'Software Engineer' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('Software Engineer');
  });
});

describe('ExtractJobField_givenNestedEmployerData_returnsEmployerName', () => {
  it('extracts nested employer name', () => {
    const responses: GraphqlResponse[] = [
      mockResponse({
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
      mockResponse({
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
      mockResponse({
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
      mockResponse({
        data: { job: { title: 'String data' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('String data');
  });
});

describe('ExtractJobField_givenEmptyStringField_returnsNull', () => {
  it('returns null when field is empty string', () => {
    const responses: GraphqlResponse[] = [
      mockResponse({
        data: { job: { title: '   ' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBeNull();
  });
});

describe('ExtractJobField_givenWhitespaceField_preservesWhitespace', () => {
  it('trims whitespace from returned values', () => {
    const responses: GraphqlResponse[] = [
      mockResponse({
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
      mockResponse({
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
      mockResponse({
        data: { job: { title: 'First Job' } },
      }),
      mockResponse({
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
      mockResponse({
        data: { job: { title: 'Valid Job' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('Valid Job');
  });
});

describe('ExtractJobField_givenMultipleTopLevelObjects_searchesAll', () => {
  it('searches through multiple top-level object values', () => {
    const responses: GraphqlResponse[] = [
      mockResponse({
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
      mockResponse({
        data: { job: { title: 'Some Job' } },
      }),
    ];
    expect(ExtractJobField(responses, [])).toBeNull();
  });
});

describe('ExtractJobField_givenDeeplyNestedPath_returnsValue', () => {
  it('handles deeply nested paths', () => {
    const responses: GraphqlResponse[] = [
      mockResponse({
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
      mockResponse({
        data: {
          job: { title: { nested: 'object' } },
        },
      }),
      mockResponse({
        data: { job: { title: 'Valid String Title' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('Valid String Title');
  });
});
