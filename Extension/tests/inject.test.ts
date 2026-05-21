import { describe, expect, it } from 'vitest';
import { findJobIdInObject } from '../inject';

const sampleJobGraphQL = {
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
