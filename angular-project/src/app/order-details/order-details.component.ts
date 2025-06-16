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
      const invoiceHTML = `<div style="width: 100%; margin: 10px auto; box-sizing: border-box; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333;">
  <div style="background-color: #f8f9fa; padding: 10px; text-align: center; border-bottom: 1px solid #e0e0e0;">
    <h2 style="margin-top: 14px;">Číslo objednávky: <strong>${this.order.orderId}</strong></h2>
  </div>
  <div style="padding: 20px;">
    <div style="margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white; border-bottom: 1px solid #0d6efd;">Dátum vystavenia faktúry</th>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.order.invoiceIssueDate}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white; border-bottom: 1px solid #0d6efd;">Číslo faktúry</th>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.order.invoiceNumber}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white;">Celkový počet produktov</th>
          <td style="padding: 10px;">${this.calculateTotalAmount()} ks</td>
        </tr>
         <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white;">Celková hmotnosť</th>
          <td style="padding: 10px;">${this.calculateTotalWeight()} kg</td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="margin-bottom: 10px; font-weight: bold;">Objednané produkty</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead style="background-color: #0d6efd; color: white;">
          <tr>
            <th style="padding: 10px; text-align: left;">Názov produktu</th>
            <th style="padding: 10px; text-align: center;">Cena/ks</th>
            <th style="padding: 10px; text-align: center;">Hmotnosť</th>
            <th style="padding: 10px; text-align: center;">Množstvo</th>
            <th style="padding: 10px; text-align: center;">Celkom (€)</th>
            <th style="padding: 10px; text-align: center;">Celkom (kg)</th>
          </tr>
        </thead>
        <tbody>
          ${this.selectedProducts.map(product => `
            <tr>
              <td style="padding: 10px; text-align: left; border-bottom: 1px solid #f0f0f0;">${product.productName}</td>
              <td style="padding: 10px; text-align: center; border-bottom: 1px solid #f0f0f0;">${product.productPrice}€</td>
              <td style="padding: 10px; text-align: center; border-bottom: 1px solid #f0f0f0;">${product.productWeight} kg</td>
              <td style="padding: 10px; text-align: center; border-bottom: 1px solid #f0f0f0;">${product.productAmount} ks</td>
              <td style="padding: 10px; text-align: center; border-bottom: 1px solid #f0f0f0;">${(product.productAmount * (product.productPrice - ((product.productPrice / 100) * this.order.discountAmount))).toFixed(2)}€</td>
              <td style="padding: 10px; text-align: center; border-bottom: 1px solid #f0f0f0;">${product.productWeight * product.productAmount} kg</td>
            </tr>
          `).join('')}
          <tr>
            <td style="padding: 10px; font-weight: bold; text-align: left;">CELKOM:</td>
            <td style="padding: 10px;"></td>
            <td style="padding: 10px;"></td>
            <td style="padding: 10px;"></td>
            <td style="padding: 10px; font-weight: bold; text-align: center;">
              ${this.order.discountAmount ? ((this.order.totalPrice - (this.order.totalPrice * this.order.discountAmount / 100)).toFixed(2) + '€ <span style="color: #6c757d;">(-' + this.order.discountAmount + '%)</span>') : (this.order.totalPrice.toFixed(2) + '€ <span style="color: #6c757d;">(-' + this.order.discountAmount + '%)</span>')}
            </td>
            <td style="padding: 10px; font-weight: bold; text-align: center;">
              ${this.calculateTotalWeight()} kg
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="margin-bottom: 10px; font-weight: bold;">Objednávateľ</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white; border-bottom: 1px solid #0d6efd;">Meno a priezvisko</th>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.order.customerName}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white; border-bottom: 1px solid #0d6efd;">Spoločnosť, IČO, DIČ, IČ DPH</th>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.order.company || 'Nie je zadané'}, ${this.order.ico || 'Nie je zadané'}, ${this.order.dic || 'Nie je zadané'}, ${this.order.icDph || 'Nie je zadané'}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white; border-bottom: 1px solid #0d6efd;">Adresa</th>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.order.address}, ${this.order.postalCode}, ${this.order.city}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white; border-bottom: 1px solid #0d6efd;">E-mail</th>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.order.email}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white;">Tel.č.</th>
          <td style="padding: 10px;">${this.order.phoneNumber}</td>
        </tr>
      </table>
    </div>

    <div>
      <h3 style="margin-bottom: 10px; font-weight: bold;">Fakturačné údaje</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white; border-bottom: 1px solid #0d6efd;">Meno a priezvisko</th>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.order.invoiceName}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white; border-bottom: 1px solid #0d6efd;">Spoločnosť, IČO, DIČ</th>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.order.invoiceCompany || 'Nie je zadané'}, ${this.order.invoiceICO || 'Nie je zadané'}, ${this.order.invoiceDIC || 'Nie je zadané'}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white; border-bottom: 1px solid #0d6efd;">E-mail</th>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.order.invoiceEmail}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white;">Tel.č.</th>
          <td style="padding: 10px;">${this.order.invoicePhoneNumber}</td>
        </tr>
      </table>
    </div>
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
  calculateTotalWeight(): number {
    return this.selectedProducts.reduce((sum, product) => sum + product.productWeight * product.productAmount, 0);
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
        this.orderService.getOrderProducts(this.order.id).subscribe((result) => {
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
interface OrderProductsDTO {
  
}
