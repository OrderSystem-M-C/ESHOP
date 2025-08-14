import { TestBed } from '@angular/core/testing';
import { CustomPaginatorIntl } from './custom-paginator-intl.service';

describe('CustomPaginatorIntlService', () => {
  let service: CustomPaginatorIntl;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomPaginatorIntl);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
