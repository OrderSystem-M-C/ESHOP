import { Component, OnInit } from '@angular/core';
import { OrderStatusDTO } from '../order-form/order-form.component';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { OrderService } from '../services/order.service';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { CustomPaginatorIntl } from '../services/custom-paginator-intl.service';

@Component({
  selector: 'app-manage-statuses-dialog',
  standalone: true,
  imports: [ ReactiveFormsModule, CommonModule, MatPaginator ],
  providers: [ { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }],
  templateUrl: './manage-statuses-dialog.component.html',
  styleUrl: './manage-statuses-dialog.component.css'
})
export class ManageStatusesDialogComponent implements OnInit {
  statuses: OrderStatusDTO[] = [];
  
  statusForm = new FormGroup({
    statusName: new FormControl('', [ Validators.required ]),
    statusColor: new FormControl('#cccccc', [Validators.required])
  });

  editingOrderStatusId: number | null = null;

  totalItems: number = 0;
  pageIndex: number = 0;
  pageSize: number = 6;

  constructor(private dialogRef: MatDialogRef<ManageStatusesDialogComponent>, private orderService: OrderService, private snackBar: MatSnackBar){}

  get paginatedStatuses(): OrderStatusDTO[] {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    return this.statuses.slice(start, end);
  }

  onPageChange(pageEvent: PageEvent) {
    this.pageSize = pageEvent.pageSize;
    this.pageIndex = pageEvent.pageIndex;
  }

  submitForm(): void {

  }

  loadOrderStatuses(): void {
    this.orderService.getOrderStatuses().subscribe({
      next: (response) => {
        this.statuses = response;
        this.totalItems = response.length;
      },
      error: (err) => console.error(err)
    })
  }

  closeDialog() {
    this.dialogRef.close(true);
    this.snackBar.open('Spravovanie stavov bolo zrušené!', '', { duration: 2000 });
  }

  ngOnInit(): void {
    this.loadOrderStatuses();
  }
}
