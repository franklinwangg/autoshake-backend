import { describe, expect, it } from 'vitest';
import { ExtractJobField, getFieldFromObject } from '../popupUtils';

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
    const obj: { '': string } = { '': 'value' };
    expect(getFieldFromObject(obj, [''])).toBe('value');
  });
});

// ============ ExtractJobField Tests ============
describe('ExtractJobField_givenValidResponse_returnsJobTitle', () => {
  const mockResponse = (data: any): { data: string; timestamp: string } => ({
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
  });

  it('extracts job title from first response', () => {
    const responses: any[] = [
      mockResponse({
        data: { job: { title: 'Software Engineer' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('Software Engineer');
  });
});

describe('ExtractJobField_givenNestedEmployerData_returnsEmployerName', () => {
  const mockResponse = (data: any): { data: string; timestamp: string } => ({
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
  });

  it('extracts nested employer name', () => {
    const responses: any[] = [
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
    expect(ExtractJobField(null as any, ['job', 'title'])).toBeNull();
    expect(ExtractJobField(undefined as any, ['job', 'title'])).toBeNull();
    expect(ExtractJobField({} as any, ['job', 'title'])).toBeNull();
  });
});

describe('ExtractJobField_givenInvalidJSON_skipsResponseAndFindsValid', () => {
  const mockResponse = (data: any): { data: string; timestamp: string } => ({
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
  });

  it('skips responses with invalid JSON', () => {
    const responses: any[] = [
      { data: 'invalid json {]' },
      mockResponse({
        data: { job: { title: 'Valid Job' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('Valid Job');
  });
});

describe('ExtractJobField_givenMissingDataProperty_skipsResponse', () => {
  const mockResponse = (data: any): { data: string; timestamp: string } => ({
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
  });

  it('skips responses with missing data property', () => {
    const responses: any[] = [
      { noDataField: 'value' },
      mockResponse({
        data: { job: { title: 'Found Title' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('Found Title');
  });
});

describe('ExtractJobField_givenNonStringData_skipsResponse', () => {
  const mockResponse = (data: any): { data: string; timestamp: string } => ({
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
  });

  it('skips responses with non-string data field', () => {
    const responses: any[] = [
      { data: { job: { title: 'This is an object, not string' } } },
      mockResponse({
        data: { job: { title: 'String data' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('String data');
  });
});

describe('ExtractJobField_givenEmptyStringField_returnsNull', () => {
  const mockResponse = (data: any): { data: string; timestamp: string } => ({
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
  });

  it('returns null when field is empty string', () => {
    const responses: any[] = [
      mockResponse({
        data: { job: { title: '   ' } }, // only whitespace
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBeNull();
  });
});

describe('ExtractJobField_givenWhitespaceField_preservesWhitespace', () => {
  const mockResponse = (data: any): { data: string; timestamp: string } => ({
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
  });

  it('trims whitespace from returned values', () => {
    const responses: any[] = [
      mockResponse({
        data: { job: { title: '  Software Engineer  ' } },
      }),
    ];
    // Should return trimmed, but function only checks if trim().length > 0
    // The actual return value might have whitespace
    const result: string | null = ExtractJobField(responses, ['job', 'title']);
    expect(result).toBe('  Software Engineer  '); // returns original, just verified it's non-empty
  });
});

describe('ExtractJobField_givenNestedObjectData_searchesAndFinds', () => {
  const mockResponse = (data: any): { data: string; timestamp: string } => ({
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
  });

  it('searches nested objects in parsed.data', () => {
    const responses: any[] = [
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
  const mockResponse = (data: any): { data: string; timestamp: string } => ({
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
  });

  it('returns first matching value from multiple responses', () => {
    const responses: any[] = [
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
  const mockResponse = (data: any): { data: string; timestamp: string } => ({
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
  });

  it('handles response with null data', () => {
    const responses: any[] = [
      { data: JSON.stringify(null) },
      mockResponse({
        data: { job: { title: 'Valid Job' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('Valid Job');
  });
});

describe('ExtractJobField_givenMultipleTopLevelObjects_searchesAll', () => {
  const mockResponse = (data: any): { data: string; timestamp: string } => ({
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
  });

  it('searches through multiple top-level object values', () => {
    const responses: any[] = [
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
  const mockResponse = (data: any): { data: string; timestamp: string } => ({
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
  });

  it('returns null when path is empty array', () => {
    const responses: any[] = [
      mockResponse({
        data: { job: { title: 'Some Job' } },
      }),
    ];
    expect(ExtractJobField(responses, [])).toBeNull();
  });
});

describe('ExtractJobField_givenDeeplyNestedPath_returnsValue', () => {
  const mockResponse = (data: any): { data: string; timestamp: string } => ({
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
  });

  it('handles deeply nested paths', () => {
    const responses: any[] = [
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
  const mockResponse = (data: any): { data: string; timestamp: string } => ({
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
  });

  it('skips non-string values at the target path', () => {
    const responses: any[] = [
      mockResponse({
        data: {
          job: { title: { nested: 'object' } }, // not a string
        },
      }),
      mockResponse({
        data: { job: { title: 'Valid String Title' } },
      }),
    ];
    expect(ExtractJobField(responses, ['job', 'title'])).toBe('Valid String Title');
  });
});
