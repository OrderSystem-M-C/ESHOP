import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef  } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrderService } from '../services/order.service';
import { OrderDTO } from '../order-form/order-form.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import * as html2pdf from 'html2pdf.js';
import { ProductDTO } from '../products-page/products-page.component';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [DatePipe, RouterLink, MatDialogModule, CommonModule],
  providers: [DatePipe],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css'
})
export class OrderDetailsComponent implements OnInit{
  orderId: number | null = null
  currentDate: string = '';

  order: OrderDTO;
  dialogRef!: MatDialogRef<any>; //akoby pristupujeme k otvorenemu dialogovemu oknu aby sme mohli s nim komunikovať => získať samotný výsledok

  isLoading: boolean = true;

  selectedProducts: ProductDTO[] = [];

  constructor(private dialog: MatDialog, private route: ActivatedRoute, private router: Router, private datePipe: DatePipe, private orderService: OrderService, private snackBar: MatSnackBar){} /* private dialog: MatDialog => na otvaranie dialogovych okien atd */

  editOrder(){
    this.router.navigate(['order-form', this.orderId]);
  }

  getInvoice(){
    if(this.order){
      const invoiceHTML = `<div style="width: 100%; box-sizing: border-box; padding: 20px">
  <div class="title-element" style="font-family: Arial, Helvetica, sans-serif; text-align: center;">
    <h2>Číslo objednávky: <strong>${this.orderId}</strong></h2>
  </div>
  <div class="first-table">
    <table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse; text-align: center;">
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Dátum</th>
        <td style="padding: 8px;">${this.currentDate}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Celkový počet produktov</th>
        <td style="padding: 8px;">${this.selectedProducts.reduce((sum, product) => sum + product.productAmount, 0)} ks</td>
      </tr>
    </table>
  </div>
  <div class="second-table" style="margin-top: 10px">
    <h3>Objednané produkty</h3>
    <table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse; text-align: center;">
      <tr style="background-color: #0d6efd; color: white;">
        <th style="padding: 8px;">Názov produktu</th>
        <th style="padding: 8px;">Cena/ks</th>
        <th style="padding: 8px;">Ks</th>
        <th style="padding: 8px;">Celkom</th>
      </tr>
      ${this.selectedProducts.map(product => 
        `<tr>
          <td style="padding: 8px;">${product.productName}</td>
          <td style="padding: 8px;">${(product.productPrice - ((product.productPrice / 100)) * this.order.discountAmount).toFixed(2)}€ (-${this.order.discountAmount}%)</td>
          <td style="padding: 8px;">${product.productAmount}x</td>
          <td style="padding: 8px;">${(product.productAmount * (product.productPrice - ((product.productPrice / 100) * this.order.discountAmount))).toFixed(2)}€</td>
        </tr>`
      ).join('')}
      <tr>
        <td style="font-weight: bold; padding: 8px;">CELKOM:</td>
        <td style="padding: 8px;"></td>
        <td style="padding: 8px;"></td>
        <td style="font-weight: bold; padding: 8px">
          ${this.order.discountAmount ? ((this.order.totalPrice - (this.order.totalPrice * this.order?.discountAmount / 100)).toFixed(2) + '€ (-' + this.order.discountAmount + '%)') : (this.order.totalPrice.toFixed(2) + '€')}
        </td>
      </tr>
    </table>
  </div>
  <div class="third-table" style="margin-top: 10px">
    <h3>Objednávateľ</h3>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Meno</th>
        <td style="padding: 8px;">${this.order.customerName}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Spoločnosť</th>
        <td style="padding: 8px;">${this.order.company || 'Nie je zadané'}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">IČO</th>
        <td style="padding: 8px;">${this.order.ico || 'Nie je zadané'}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">DIČ</th>
        <td style="padding: 8px;">${this.order.dic || 'Nie je zadané'}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">IČ DPH</th>
        <td style="padding: 8px;">${this.order.icDph || 'Nie je zadané'}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Adresa</th>
        <td style="padding: 8px;">${this.order.address}, ${this.order.postalCode}, ${this.order.city}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">E-mail</th>
        <td style="padding: 8px;">${this.order.email}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Tel.č.</th>
        <td style="padding: 8px;">${this.order.phoneNumber}</td>
      </tr>
    </table>
  </div>

  <!-- Fakturačné údaje -->
  <div class="invoice-table" style="margin-top: 10px;">
    <h3>Fakturačné údaje</h3>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Názov faktúry</th>
        <td style="padding: 8px;">${this.order.invoiceName}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Spoločnosť</th>
        <td style="padding: 8px;">${this.order.invoiceCompany || 'Nie je zadané'}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">IČO</th>
        <td style="padding: 8px;">${this.order.invoiceICO || 'Nie je zadané'}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">DIČ</th>
        <td style="padding: 8px;">${this.order.invoiceDIC || 'Nie je zadané'}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">E-mail</th>
        <td style="padding: 8px;">${this.order.invoiceEmail}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Tel.č.</th>
        <td style="padding: 8px;">${this.order.invoicePhoneNumber}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Dátum vystavenia faktúry</th>
        <td style="padding: 8px;">${this.order.invoiceIssueDate}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Dátum splatnosti</th>
        <td style="padding: 8px;">${this.order.invoiceDueDate}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Dátum doručenia faktúry</th>
        <td style="padding: 8px;">${this.order.invoiceDeliveryDate}</td>
      </tr>
    </table>
  </div>
</div>`


     const options = {
        margin: 5,
        filename: `Faktúra_č${this.orderId}.pdf`,
        html2canvas: { scale: 2 }
     };

     if(invoiceHTML){
        html2pdf().set(options).from(invoiceHTML).save();
        this.snackBar.open('Faktúra bola úspešne stiahnutá!', '', {duration: 2000});
     }
    }else{
      this.snackBar.open('Nastala chyba pri sťahovaní faktúry!', '', {duration: 2000});
    }
  }

  removeOrder(confirmDialog: TemplateRef<any>){ //to vkladame ten dialog aby sme mohli s ním narábať
    this.dialogRef = this.dialog.open(confirmDialog);  // Otvorí dialógové okno s potvrdením to áno/nie

    this.dialogRef.afterClosed().subscribe((result) => {
      if(result){
        this.isLoading = true;
        this.orderService.deleteOrder(this.order.id).subscribe((response: any) => {
          this.isLoading = false;
          this.router.navigate(['/orders-page']);
          this.snackBar.open('Objednávka bola úspešne odstránená!' ,'', {duration: 1000});
        }, (error) =>{
          this.isLoading = false
          console.error(error);
        })
      }else{
        this.snackBar.open('Vymazanie objednávky bolo zrušené.', '', { duration: 1000 });
      }
    })
  }
  calculateTotalAmount(): number {
    return this.selectedProducts.reduce((sum, product) => sum + product.productAmount, 0);
  }
  formatDate(dateString: string): string {
    return dateString ? dateString.split('-').reverse().join('.') : '';
  }

  ngOnInit(): void {
    const orderIdParam = this.route.snapshot.paramMap.get('orderId');
    this.orderId = orderIdParam ? parseInt(orderIdParam, 10): null;

    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');

    this.orderService.getOrderDetails(this.orderId).subscribe((result) => {
      this.order = result;
      if(this.order){
        this.orderService.getOrderProducts(this.order.orderId).subscribe((result) => {
          this.order.invoiceIssueDate = this.formatDate(this.order.invoiceIssueDate);
          this.order.invoiceDueDate = this.formatDate(this.order.invoiceDueDate);
          this.order.invoiceDeliveryDate = this.formatDate(this.order.invoiceDeliveryDate);
          this.selectedProducts = result;
          
          this.isLoading = false;
        }, (error) => {
          console.error("An error occurred while trying to get products.", error);
        })
      }
    }, (error) =>{
      console.error("An error occurred while trying to get order details", error);
    })
  }
}
