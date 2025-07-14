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
    statusColor: new FormControl('', [Validators.required])
  });

  editingOrderStatusId: number | null = null;

  totalItems: number = 0;
  pageIndex: number = 0;
  pageSize: number = 6;

  isLoading: boolean = true;

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

  loadOrderStatuses(): void {
    this.orderService.getOrderStatuses().subscribe({
      next: (response) => {
        this.statuses = response;
        this.totalItems = response.length;
        this.isLoading = false;
      },
      error: (err) => console.error(err)
    })
  }
  addOrderStatus(): void {
    if(this.statusForm.valid){
      this.isLoading = true;
      const status: OrderStatusDTO = {
        statusName: this.statusForm.value.statusName,
        statusColor: this.statusForm.value.statusColor
      }
      if (this.editingOrderStatusId !== null) {
        status.statusId = this.editingOrderStatusId;
        this.orderService.updateOrderStatus(status).subscribe({
          next: () => {
            this.snackBar.open("Stav objednávky bol úspešne upravený!", "", { duration: 2000 });
            this.statusForm.reset();
            this.editingOrderStatusId = null;
            this.loadOrderStatuses();
          },
          error: (err) => console.error(err)
        });
      } else {
        this.orderService.addOrderStatus(status).subscribe({
          next: () => {
            this.snackBar.open("Stav objednávky bol úspešne pridaný!", "", { duration: 2000 });
            this.statusForm.reset();
            this.loadOrderStatuses();
          },
          error: (err) => console.error(err)
        });
      }
    }else{
      this.snackBar.open("Zadané údaje nie sú správne alebo polia označené hviezdičkou boli vynechané!", "", { duration: 3000 });
      Object.values(this.statusForm.controls).forEach(control => control.markAsTouched());
    }
  }
  deleteOrderStatus(statusId: number): void {
    this.isLoading = true;
    this.orderService.deleteOrderStatus(statusId).subscribe({
      next: () => {
        this.snackBar.open("Stav objednávky bol úspešne vymazaný!", "", { duration: 2000 });
        this.loadOrderStatuses();
      },
      error: (err) => console.error(err)
    })
  }
  editOrderStatus(status: OrderStatusDTO): void {
    this.statusForm.patchValue({
      statusName: status.statusName,
      statusColor: status.statusColor
    });
    this.editingOrderStatusId = status.statusId;
    if (status.statusName === 'Nezpracované - nová objednávka') {
      this.statusForm.get('statusName')?.disable();
    } else {
      this.statusForm.get('statusName')?.enable();
    }
  }

  closeDialog() {
    this.dialogRef.close(true);
    this.snackBar.open('Spravovanie stavov bolo zrušené!', '', { duration: 2000 });
  }

  ngOnInit(): void {
    this.loadOrderStatuses();
  }
}
