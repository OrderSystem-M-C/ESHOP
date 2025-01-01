import { DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef  } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrderService } from '../services/order.service';
import { OrderDTO } from '../order-form/order-form.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import * as html2pdf from 'html2pdf.js';

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

  isLoading: boolean = true;

  constructor(private dialog: MatDialog, private route: ActivatedRoute, private router: Router, private datePipe: DatePipe, private orderService: OrderService, private snackBar: MatSnackBar){} /* private dialog: MatDialog => na otvaranie dialogovych okien atd */

  getInvoice(){
    if(this.order){
      const invoiceHTML = `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 800px; margin: auto;">
    <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; color: #333;">Faktúra</h1>
        <p style="margin: 0; font-size: 14px; color: #666;">Číslo faktúry: ${this.order.invoiceNumber}</p>
        <p style="margin: 0; font-size: 14px; color: #666;">Dátum vystavenia: ${this.order.invoiceIssueDate}</p>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div style="flex: 1; padding-right: 20px; border-right: 1px solid #ddd;">
            <h3 style="margin-bottom: 10px; color: #555;">Údaje objednávateľa</h3>
            <p><strong>Meno a priezvisko:</strong> ${this.order.customerName}</p>
            <p><strong>Firma:</strong> ${this.order.company}</p>
            <p><strong>IČO (v prípade firmy):</strong> ${this.order.ico}</p>
            <p><strong>DIČ (v prípade firmy):</strong> ${this.order.dic}</p>
            <p><strong>IČ DPH (v prípade firmy):</strong> ${this.order.icDph}</p>
            <p><strong>Adresa:</strong> ${this.order.address}</p>
            <p><strong>Mesto:</strong> ${this.order.city}</p>
            <p><strong>PSČ:</strong> ${this.order.postalCode}</p>
            <p><strong>E-mail:</strong> ${this.order.email}</p>
            <p><strong>Telefónne číslo:</strong> ${this.order.phoneNumber}</p>
        </div>
        <div style="flex: 1; padding-left: 20px;">
            <h3 style="margin-bottom: 10px; color: #555;">Fakturačné údaje</h3>
            <p><strong>Číslo faktúry:</strong> ${this.order.invoiceNumber}</p>
            <p><strong>Variabilný symbol:</strong> ${this.order.variableSymbol}</p>
            <p><strong>Typ dokladu:</strong> Faktúra</p>
            <p><strong>Dátum splatnosti:</strong> ${this.order.invoiceDueDate}</p>
            <p><strong>Dátum dodania:</strong> ${this.order.invoiceDeliveryDate}</p>
            <p><strong>Meno a priezvisko:</strong> ${this.order.invoiceName}</p>
            <p><strong>Firma:</strong> ${this.order.invoiceCompany}</p>
            <p><strong>IČO (v prípade firmy):</strong> ${this.order.invoiceICO}</p>
            <p><strong>DIČ (v prípade firmy):</strong> ${this.order.invoiceDIC}</p>
            <p><strong>E-mail:</strong> ${this.order.invoiceEmail}</p>
            <p><strong>Telefónne číslo:</strong> ${this.order.invoicePhoneNumber}</p>
        </div>
    </div>
    <div style="margin-bottom: 20px;">
        <h3 style="margin-bottom: 10px; color: #555;">Položky na faktúre</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
                <tr style="background-color: #f8f8f8; border-bottom: 2px solid #ddd;">
                    <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Položka</th>
                    <th style="text-align: center; padding: 8px; border: 1px solid #ddd;">Množstvo</th>
                    <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Cena za kus</th>
                    <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Celkom</th>
                </tr>
            </thead>
            <tbody>
                <!-- Repeat for each item -->
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">{{ polozkaNazov }}</td>
                    <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">{{ polozkaMnozstvo }}</td>
                    <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">{{ polozkaCena }}</td>
                    <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">{{ polozkaCelkom }}</td>
                </tr>
            </tbody>
        </table>
    </div>
    <div style="margin-bottom: 20px;">
        <p><strong>Dátum objednávky:</strong> ${this.order.orderDate}</p>
        <p><strong>Spôsob doručenia:</strong> ${this.order.deliveryOption}</p>
        <p><strong>Spôsob platby:</strong> ${this.order.paymentOption}</p>
    </div>
    <div style="text-align: right; margin-bottom: 20px;">
        <p><strong>Medzisúčet:</strong> 0€</p>
        <p><strong>Zľava (-${this.order.discountAmount}%):</strong></p>
        <h2 style="margin: 0; color: #333;">Celková suma: 0€</h2>
    </div>
    <div style="border-top: 1px solid #ddd; padding-top: 10px; color: #666; font-size: 12px;">
        <p><strong>Poznámka: ${this.order.note}</strong></p>
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
      this.isLoading = false;
    }, (error) =>{
      console.error("An error occurred while trying to get order details", error);
    })
  }
}
