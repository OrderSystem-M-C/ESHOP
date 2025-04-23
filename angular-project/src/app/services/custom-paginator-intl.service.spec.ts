import { TestBed } from '@angular/core/testing';

import { CustomPaginatorIntlService } from './custom-paginator-intl.service';

describe('CustomPaginatorIntlService', () => {
  let service: CustomPaginatorIntlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomPaginatorIntlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
