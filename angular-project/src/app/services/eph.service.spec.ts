import { TestBed } from '@angular/core/testing';

import { EphService } from './eph.service';

describe('EphService', () => {
  let service: EphService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EphService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
