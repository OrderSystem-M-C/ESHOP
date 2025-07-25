import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, OnInit, TemplateRef  } from '@angular/core';
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
  @Input() order: OrderDTO | null = null;
  @Input() previewOrderId: number | null = null;
  orderId: number | null = null
  currentDate: string = '';

  dialogRef!: MatDialogRef<any>; //akoby pristupujeme k otvorenemu dialogovemu oknu aby sme mohli s nim komunikovať => získať samotný výsledok

  isLoading: boolean = true;

  selectedProducts: ProductDTO[] = [];

  constructor(private dialog: MatDialog, private route: ActivatedRoute, private router: Router, private datePipe: DatePipe, private orderService: OrderService, private snackBar: MatSnackBar){} /* private dialog: MatDialog => na otvaranie dialogovych okien atd */

  editOrder(){
    if(this.previewOrderId != null) {
      return;
    }
    this.router.navigate(['order-form', this.orderId]);
  }
  returnHome(){
    if(this.previewOrderId != null) {
      return;
    }
    this.router.navigate(['/orders-page']);
  }

  async getInvoice(){
    const hasCompanyData = this.order.company || this.order.ico || this.order.dic;
    const hasInvoiceCompanyData = this.order.invoiceCompany || this.order.invoiceICO || this.order.invoiceDIC;

    const hasInvoiceData = this.order.invoiceName || this.order.invoiceEmail || this.order.invoicePhoneNumber || hasInvoiceCompanyData;

    const loadingSnack = this.snackBar.open('Sťahuje sa faktúra...', '', { duration: undefined });

    const companyRowHTML = hasCompanyData ? `
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #f8f9fa;">
          Spoločnosť, IČO, DIČ, IČ DPH
        </th>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">
          ${this.order.company || 'Nie je zadané'}, 
          ${this.order.ico || 'Nie je zadané'}, 
          ${this.order.dic || 'Nie je zadané'}, 
          ${this.order.icDph || 'Nie je zadané'}
        </td>
      </tr>
` : '';

    const invoiceCompanyRowHTML = hasInvoiceCompanyData ? `
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #f8f9fa;">
          Spoločnosť, IČO, DIČ, IČ DPH
        </th>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">
          ${this.order.invoiceCompany || 'Nie je zadané'}, 
          ${this.order.invoiceICO || 'Nie je zadané'}, 
          ${this.order.invoiceDIC || 'Nie je zadané'}
        </td>
      </tr>
` : '';

    const invoiceSectionHTML = hasInvoiceData ? `
      <div>
        <h3 style="margin-bottom: 10px; font-weight: bold;">Fakturačné údaje</h3>
        <table style="width: 100%; border: 1px solid #e0e0e0;">
          <tr>
            <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">Meno a priezvisko</th>
            <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${this.order.invoiceName}</td>
          </tr>
          ${invoiceCompanyRowHTML}
          <tr>
            <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">E-mail</th>
            <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${this.order.invoiceEmail}</td>
          </tr>
          <tr>
            <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">Tel.č.</th>
            <td style="padding: 8px;">${this.order.invoicePhoneNumber}</td>
          </tr>
        </table>
      </div>
    ` : '';

    if(this.order){
      const invoiceHTML = `<div style="width: 100%; margin: 10px auto; box-sizing: border-box; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333;">
  <div style="background-color: #e4e4e4ff; padding: 8px; text-align: center; border-bottom: 1px solid #e0e0e0;">
    <h2 style="margin-top: 14px;">Číslo objednávky: <strong>${this.order.orderId}</strong></h2>
  </div>
  <div style="padding: 20px;">
    <div style="margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0; width: 40%;">Dátum vystavenia faktúry</th>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${this.order.invoiceIssueDate}</td>
        </tr>
        <tr>
          <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0;">Číslo faktúry</th>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${this.order.invoiceNumber}</td>
        </tr>
        <tr>
          <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0;">Celkový počet produktov</th>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${this.calculateTotalAmount()} ks</td>
        </tr>
         <tr>
          <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0;">Celková hmotnosť</th>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">1 kg</td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="margin-bottom: 10px; font-weight: bold;">Objednané produkty</h3>
      <table style="width: 100%; border: 1px solid #e0e0e0;">
        <thead style="background-color: #e4e4e4ff;">
          <tr>
            <th style="padding: 8px; text-align: left;">Názov produktu</th>
            <th style="padding: 8px; text-align: center; text-wrap: nowrap;">Cena/ks</th>
            <th style="padding: 8px; text-align: center;">Množstvo</th>
            <th style="padding: 8px; text-align: center; text-wrap: nowrap;">Celkom (€)</th>
          </tr>
        </thead>
        <tbody>
          ${this.selectedProducts.map(product => `
          <tr>
            <td style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0;">${product.productName}</td>
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e0e0e0;">${product.productPrice} €</td>
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e0e0e0;">${product.productAmount} ks</td>
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e0e0e0;">
              ${product.productPrice * product.productAmount} €
            </td>
          </tr>
          `).join('')}
          <tr>
            <td colspan="2" style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0;">Zvolený spôsob dopravy</td>
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e0e0e0;">Poštovné (${this.order.deliveryOption}):</td>
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e0e0e0;">${this.order.deliveryCost.toFixed(2)} €</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0;">Zvolený spôsob platby</td>
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e0e0e0;">Poplatok za platbu (${this.order.paymentOption}):</td>
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e0e0e0;">${this.order.paymentCost.toFixed(2)} €</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px; text-align: left;">Celková cena objednávky</td>
            <td style="padding: 8px; text-align: center; font-weight: bold;">CELKOM:</td>
            <td style="padding: 8px; text-align: center; font-weight: bold;">
              ${
                this.order.discountAmount > 0
                  ? (this.order.totalPrice.toFixed(2) + ' € <span style="color: #6c757d;">(zľava: -' + (this.order.discountAmount || 0) + '%)</span>')
                  : (this.order.totalPrice.toFixed(2) + ' €')
              }
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="margin-bottom: 10px; font-weight: bold;">Objednávateľ</h3>
      <table style="width: 100%; border: 1px solid #e0e0e0;">
        <tr>
          <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">Meno a priezvisko</th>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${this.order.customerName}</td>
        </tr>
        ${companyRowHTML}
        <tr>
          <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">Adresa</th>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${this.order.address}, ${this.order.postalCode}, ${this.order.city}</td>
        </tr>
        <tr>
          <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">E-mail</th>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${this.order.email}</td>
        </tr>
        <tr>
          <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">Tel.č.</th>
          <td style="padding: 8px;">${this.order.phoneNumber}</td>
        </tr>
      </table>
    </div>

    ${invoiceSectionHTML}
  </div>
</div>
`

     const options = {
        margin: [5, 5, 5, 5],
        filename: `Faktúra_č${this.orderId}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: {unit: 'mm', format: 'a4', orientation: 'portrait'}
     };

     if(invoiceHTML){
        await html2pdf().set(options).from(invoiceHTML).save();
        loadingSnack.dismiss();
        this.snackBar.open('Faktúra bola úspešne stiahnutá!', '', {duration: 2000});
     }
    }else{
      loadingSnack.dismiss();
      this.snackBar.open('Nastala chyba pri sťahovaní faktúry!', '', {duration: 2000});
    }
  }

  removeOrder(confirmDialog: TemplateRef<any>){ //to vkladame ten dialog aby sme mohli s ním narábať
    if(this.previewOrderId != null) {
      return;
    }
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
    this.orderId = orderIdParam ? parseInt(orderIdParam, 10): this.previewOrderId;

    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');

    this.orderService.getOrderDetails(this.orderId).subscribe((result) => {
      this.order = result;
      if(this.order){
        this.orderService.getOrderProducts(this.order.id).subscribe((result) => {
          this.order.invoiceIssueDate = this.formatDate(this.order.invoiceIssueDate);
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