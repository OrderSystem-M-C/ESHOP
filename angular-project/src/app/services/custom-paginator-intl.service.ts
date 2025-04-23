import { Injectable, OnDestroy } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Subject } from 'rxjs';

@Injectable()
export class CustomPaginatorIntl implements MatPaginatorIntl, OnDestroy {
  changes = new Subject<void>();
  firstPageLabel = 'Prvá stránka';
  itemsPerPageLabel = 'Počet položiek na stránku:';
  lastPageLabel = 'Posledná stránka';
  nextPageLabel = 'Ďalšia stránka';
  previousPageLabel = 'Predchádzajúca stránka';

  getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return `0 z ${length}`;
    }
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ?
      Math.min(startIndex + pageSize, length) :
      startIndex + pageSize;
    return `${startIndex + 1} – ${endIndex} z ${length}`;
  };

  ngOnDestroy() {
    this.changes.complete();
  }
}
