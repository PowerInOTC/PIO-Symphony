/*import RfqChecker, { ErrorObject } from './RfqChecker';
import { RfqResponse } from '@pionerfriends/api-client';

describe('RfqChecker', () => {
  let rfqChecker: RfqChecker;
  let rfqResponse: RfqResponse;

  beforeEach(() => {
    rfqResponse = {
      // Populate the rfqResponse object with necessary data
      // ...
    };
    rfqChecker = new RfqChecker(rfqResponse);
  });

  describe('checkImA', () => {
    it('should add an error if lImA is less than the configured value', () => {
      rfqChecker['configRfqL'] = { imA: 0.1 };
      rfqResponse.lImA = '0.05';
      rfqChecker['checkImA']();
      expect(rfqChecker['errors']).toContainEqual({
        field: 'lImA',
        value: '0.05',
      });
    });

    it('should add an error if sImA is less than the configured value', () => {
      rfqChecker['configRfqS'] = { imA: 0.1 };
      rfqResponse.sImA = '0.05';
      rfqChecker['checkImA']();
      expect(rfqChecker['errors']).toContainEqual({
        field: 'sImA',
        value: '0.05',
      });
    });

    it('should not add an error if lImA and sImA are greater than or equal to the configured values', () => {
      rfqChecker['configRfqL'] = { imA: 0.1 };
      rfqChecker['configRfqS'] = { imA: 0.1 };
      rfqResponse.lImA = '0.15';
      rfqResponse.sImA = '0.15';
      rfqChecker['checkImA']();
      expect(rfqChecker['errors']).toHaveLength(0);
    });
  });

  describe('checkImB', () => {
    // Similar tests as checkImA
    // ...
  });

  describe('checkDfA', () => {
    it('should add an error if lDfA is less than the configured value', () => {
      rfqChecker['configRfqL'] = { dfA: 0.1 };
      rfqResponse.lDfA = '0.05';
      rfqChecker['checkDfA']();
      expect(rfqChecker['errors']).toContainEqual({
        field: 'lDfA',
        value: '0.05',
      });
    });

    it('should add an error if sDfA is less than the configured value', () => {
      rfqChecker['configRfqS'] = { dfA: 0.1 };
      rfqResponse.sDfA = '0.05';
      rfqChecker['checkDfA']();
      expect(rfqChecker['errors']).toContainEqual({
        field: 'sDfA',
        value: '0.05',
      });
    });

    it('should not add an error if lDfA and sDfA are greater than or equal to the configured values', () => {
      rfqChecker['configRfqL'] = { dfA: 0.1 };
      rfqChecker['configRfqS'] = { dfA: 0.1 };
      rfqResponse.lDfA = '0.15';
      rfqResponse.sDfA = '0.15';
      rfqChecker['checkDfA']();
      expect(rfqChecker['errors']).toHaveLength(0);
    });
  });

  describe('checkDfB', () => {
    // Similar tests as checkDfA
    // ...
  });
});
*/
