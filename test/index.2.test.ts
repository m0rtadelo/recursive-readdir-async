import assert from 'assert';
import * as rra from '../src/index';

jest.mock('fs', () => {
  const origin = jest.requireActual('fs');
  return {
    __esModule: true,
    ...origin,
    realpath: (path:any, cb:any) => {
      throw new Error('boom');
    },
  };
});

describe('load', function() {
  describe('error control', function() {
    it('controlled error for exceptions - part 3: file system fatality', async function() {
      let isOk = false;
      try {
        const res = await rra.list('./test');
        if (res.error) {
          isOk = true;
        };
        assert.equal(isOk, true, 'unexpected behavior (no json with error)');
      } catch (error) {
        isOk = false;
      }
      assert.equal(isOk, true, 'unexpected behavior (error or no json with error)');
    });
  });
});
