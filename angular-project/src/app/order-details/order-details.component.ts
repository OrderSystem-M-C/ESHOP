import { DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef  } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrderService } from '../services/order.service';
import { OrderDTO } from '../order-form/order-form.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [DatePipe, RouterLink, MatDialogModule],
  providers: [DatePipe],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css'
})
export class OrderDetailsComponent implements OnInit{
  orderId: number | null = null
  currentDate: string = '';

  order: OrderDTO;
  dialogRef!: MatDialogRef<any>; //akoby pristupujeme k otvorenemu dialogovemu oknu aby sme mohli s nim komunikovať => získať samotný výsledok

  constructor(private dialog: MatDialog, private route: ActivatedRoute, private router: Router, private datePipe: DatePipe, private orderService: OrderService, private snackBar: MatSnackBar){} /* private dialog: MatDialog => na otvaranie dialogovych okien atd */

  removeOrder(confirmDialog: TemplateRef<any>){
    this.dialogRef = this.dialog.open(confirmDialog);  // Otvorí dialógové okno s potvrdením to áno/nie

    this.dialogRef.afterClosed().subscribe((result) => {
      if(result){
        this.orderService.deleteOrder(this.order.id).subscribe((response: any) => {
          this.router.navigate(['/orders-page']);
          this.snackBar.open('Objednávka bola úspešne odstránená!' ,'', {duration: 1000});
        }, (error) =>{
          console.error(error);
        })
      }else{
        this.snackBar.open('Vymazanie objednávky bolo zrušené.', '', { duration: 1000 });
      }
    })
  }

  ngOnInit(): void {
    const orderIdParam = this.route.snapshot.paramMap.get('orderId');
    this.orderId = orderIdParam ? parseInt(orderIdParam, 10): null;

    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');

    this.orderService.getOrderDetails(this.orderId).subscribe((result) => {
      this.order = result;
    }, (error) =>{
      console.error("An error occurred while trying to get order details", error);
    })
  }
}
