import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Form, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import * as html2pdf from 'html2pdf.js';
import { OrderService } from '../services/order.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [DatePipe, CommonModule, FormsModule, ReactiveFormsModule, MatSnackBarModule, NgClass],
  providers: [DatePipe, OrderService],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.css'
})
export class OrderFormComponent implements OnInit {
  currentDate: string;

  userMessage: string = '';
  charactersCount: number = 0;

  orderId = Math.floor(100000 + Math.random() * 900000);
  existingOrderId: number | null = null;

  invoiceCreated: boolean = false;

  isLoading: boolean = false;

  isEditMode: boolean = false;

  constructor(private datePipe: DatePipe,private route: ActivatedRoute, public orderService: OrderService, private router: Router, private snackBar: MatSnackBar){}

  orderForm = new FormGroup({
    customerName: new FormControl('', Validators.required),
    company: new FormControl(''),
    ico: new FormControl(''),
    dic: new FormControl(''),
    icDph: new FormControl('', [
      control => {
        const value = control.value;

        if(!value){
          return null;
        }
        return /^[1-9]\d*$/.test(value) ? null : { invalidIcDph: true };
      }
    ]),
    address: new FormControl('', Validators.required),
    city: new FormControl('', Validators.required),
    postalCode: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
    email: new FormControl('', [Validators.required, this.emailValidator]),
    phoneNumber: new FormControl('', [Validators.required, this.phoneValidator]),
    note: new FormControl(''),
    deliveryOption: new FormControl('', Validators.required),
    paymentOption: new FormControl('', Validators.required),
    discountAmount: new FormControl(null, Validators.pattern('^[0-9]*$')),
    orderStatus: new FormControl('nezpracovane-nova-objednavka')
  });

  invoiceForm = new FormGroup({
    invoiceNumber: new FormControl(`${this.orderId}`, Validators.required),
    invoiceVariable: new FormControl(`${this.orderId}`, Validators.required),
    invoiceIssueDate: new FormControl('', Validators.required),
    invoiceDueDate: new FormControl('', Validators.required),
    invoiceDeliveryDate: new FormControl('', Validators.required),
    invoiceName: new FormControl('', Validators.required),
    invoiceCompany: new FormControl(''),
    invoiceICO: new FormControl(''),
    invoiceDIC: new FormControl(''),
    invoiceEmail: new FormControl('', [Validators.required, this.emailValidator]),
    invoicePhoneNumber: new FormControl('', [Validators.required, this.phoneValidator]),
  })

  createOrderDTO(): OrderDTO{
    return {
      orderId: this.isEditMode ? this.existingOrderId : this.orderId,
      customerName: this.orderForm.value.customerName,
      company: this.orderForm.value.company || '',
      ico: this.orderForm.value.ico || '',
      dic: this.orderForm.value.dic || '',
      icDph: this.orderForm.value.icDph || '',
      address: this.orderForm.value.address,
      city: this.orderForm.value.city,
      postalCode: this.orderForm.value.postalCode,
      email: this.orderForm.value.email,
      phoneNumber: this.orderForm.value.phoneNumber,
      note: this.orderForm.value.note || '',
      deliveryOption: this.orderForm.value.deliveryOption,
      paymentOption: this.orderForm.value.paymentOption,
      discountAmount: this.orderForm.value.discountAmount || 0,
      orderStatus: this.orderForm.value.orderStatus,
      ...(this.isEditMode ? {} : {orderDate: this.currentDate}),
      invoiceNumber: this.invoiceForm.value.invoiceNumber,
      variableSymbol: this.invoiceForm.value.invoiceVariable,
      invoiceIssueDate: this.invoiceForm.value.invoiceIssueDate,
      invoiceDueDate: this.invoiceForm.value.invoiceDueDate,
      invoiceDeliveryDate: this.invoiceForm.value.invoiceDeliveryDate,
      invoiceName: this.invoiceForm.value.invoiceName,
      invoiceCompany: this.invoiceForm.value.invoiceCompany || '',
      invoiceICO: this.invoiceForm.value.invoiceICO || '',
      invoiceDIC: this.invoiceForm.value.invoiceDIC || '',
      invoiceEmail: this.invoiceForm.value.invoiceEmail,
      invoicePhoneNumber: this.invoiceForm.value.invoicePhoneNumber,
    }
  }

  updateOrder(){
    if(this.orderForm.valid && this.invoiceForm.valid){
      if(this.orderForm.pristine){
        this.snackBar.open('Nebola vykonaná žiadna zmena v objednávke!', '', {duration: 1000});
      }else{
        let order = this.createOrderDTO();

      this.isLoading = this.invoiceCreated = true;

      this.orderService.updateOrder(this.existingOrderId, order).subscribe((response) => {
        console.log(response);

        this.snackBar.open('Objednávka bola úspešne upravená!', '', {duration: 1000});
        this.router.navigate(['/orders-page']);

        this.isLoading = false;
      }, (error) => {
        console.error("An error occurred while trying to update order", error);
        this.isLoading = false;
      });
      }
    }else if(this.orderForm.invalid || this.invoiceForm.invalid){
      this.snackBar.open('Zadané údaje nie sú správne alebo polia označené hviezdičkou boli vynechané!', '', {duration: 2000});
      this.validateAllFormFields(this.orderForm);
      this.validateAllFormFields(this.invoiceForm);
    }
  }

  loadOrder(orderId: number){
    this.orderService.getOrderDetails(orderId).subscribe((order) => {
      this.orderForm.patchValue(order); //patchValue robi ze vyplni hodnoty objednavky

      this.invoiceForm.patchValue({
        invoiceNumber: order.invoiceNumber,
        invoiceVariable: order.variableSymbol,
        invoiceIssueDate: order.invoiceIssueDate,
        invoiceDueDate: order.invoiceDueDate,
        invoiceDeliveryDate: order.invoiceDeliveryDate,
        invoiceName: order.invoiceName,
        invoiceCompany: order.invoiceCompany,
        invoiceICO: order.invoiceICO,
        invoiceDIC: order.invoiceDIC,
        invoiceEmail: order.invoiceEmail,
        invoicePhoneNumber: order.invoicePhoneNumber,
      });
    })
  }

  onCompanyChange(event: Event, formType: 'order' | 'invoice'){
    const inputElement = event.target as HTMLInputElement;
    const companyValue = inputElement.value;

    const form = formType === 'order' ? this.orderForm : this.invoiceForm;
    const icoControlName = formType === 'order' ? 'ico' : 'invoiceICO';
    const dicControlName = formType === 'order' ? 'dic': 'invoiceDIC';

    const icoControl = this.getFormControl(form, icoControlName);
    const dicControl = this.getFormControl(form, dicControlName);

    if(icoControl && dicControl){
      if(companyValue && companyValue.trim().length > 0){
        icoControl.setValidators([Validators.required, Validators.pattern(/^\d+$/)]);
        dicControl.setValidators([Validators.required, Validators.pattern(/^\d+$/)]);
      }else{
        icoControl.clearValidators();
        dicControl.clearValidators();
      }
      icoControl.updateValueAndValidity({ emitEvent: false });
      dicControl.updateValueAndValidity({ emitEvent: false });
    }else{
      console.error('Nastala chyba');
    }
  }

  private getFormControl(form: FormGroup, controlName: string | null) : FormControl {
    if(!controlName){
      return null;
    }
    return form.get(controlName) as FormControl;
  }

  update(){
    this.charactersCount = this.userMessage.length;
  }
  
  submitOrder(){
    if(this.orderForm.valid && this.invoiceForm.valid){
      let order = this.createOrderDTO();

      this.isLoading = true;

      this.orderService.createOrder(order).subscribe((response: OrderDTO) => {
        if(response){
          this.isLoading = false;
          if(!this.invoiceCreated){
            this.createInvoice();
            this.router.navigate(['/orders-page']);
          }else{
            this.snackBar.open('Objednávka bola úspešne vytvorená!', '', {duration: 1000});
            this.router.navigate(['/orders-page']);
          }
        }
      }, (error) => {
        console.error("An error occurred while trying to create order", error)
      });
    }else if(this.orderForm.invalid || this.invoiceForm.invalid){
      this.validateAllFormFields(this.orderForm);
      this.validateAllFormFields(this.invoiceForm);
      this.snackBar.open('Zadané údaje nie sú správne alebo polia označené hviezdičkou boli vynechané!', '', {duration: 2000});
    }
  }

  validateAllFormFields(formGroup: FormGroup){
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if(control?.invalid){
        control.markAsTouched(); 
      }
    })
  }

  emailValidator(control: FormControl) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    if (control.value && !emailRegex.test(control.value)) {
      return { invalidEmail: true };
    }
    return null;
  }
  phoneValidator(control: FormControl){
    const phoneRegex = /^(0(?:2[0-9]{2}|[9][0-9]{2}))\s?([0-9]{3})\s?([0-9]{3})$|^(0[1-9][0-9]{8})$/;
    if(control.value && !phoneRegex.test(control.value)){
      return { invalidPhone: true };
    }
    return null
  }

  createInvoice(){
    if(this.invoiceForm.valid){
      const invoiceHTML = `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 800px; margin: auto;">
    <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; color: #333;">Faktúra</h1>
        <p style="margin: 0; font-size: 14px; color: #666;">Číslo faktúry: ${this.invoiceForm.value.invoiceNumber}</p>
        <p style="margin: 0; font-size: 14px; color: #666;">Dátum vystavenia: ${this.invoiceForm.value.invoiceIssueDate}</p>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div style="flex: 1; padding-right: 20px; border-right: 1px solid #ddd;">
            <h3 style="margin-bottom: 10px; color: #555;">Údaje objednávateľa</h3>
            <p><strong>Meno a priezvisko:</strong> ${this.orderForm.value.customerName}</p>
            <p><strong>Firma:</strong> ${this.orderForm.value.company}</p>
            <p><strong>IČO (v prípade firmy):</strong> ${this.orderForm.value.ico}</p>
            <p><strong>DIČ (v prípade firmy):</strong> ${this.orderForm.value.dic}</p>
            <p><strong>IČ DPH (v prípade firmy):</strong> ${this.orderForm.value.icDph}</p>
            <p><strong>Adresa:</strong> ${this.orderForm.value.address}</p>
            <p><strong>Mesto:</strong> ${this.orderForm.value.city}</p>
            <p><strong>PSČ:</strong> ${this.orderForm.value.postalCode}</p>
            <p><strong>E-mail:</strong> ${this.orderForm.value.email}</p>
            <p><strong>Telefónne číslo:</strong> ${this.orderForm.value.phoneNumber}</p>
        </div>
        <div style="flex: 1; padding-left: 20px;">
            <h3 style="margin-bottom: 10px; color: #555;">Fakturačné údaje</h3>
            <p><strong>Číslo faktúry:</strong> ${this.invoiceForm.value.invoiceNumber}</p>
            <p><strong>Variabilný symbol:</strong> ${this.invoiceForm.value.invoiceVariable}</p>
            <p><strong>Typ dokladu:</strong> Faktúra</p>
            <p><strong>Dátum splatnosti:</strong> ${this.invoiceForm.value.invoiceDueDate}</p>
            <p><strong>Dátum dodania:</strong> ${this.invoiceForm.value.invoiceDeliveryDate}</p>
            <p><strong>Meno a priezvisko:</strong> ${this.invoiceForm.value.invoiceName}</p>
            <p><strong>Firma:</strong> ${this.invoiceForm.value.invoiceCompany}</p>
            <p><strong>IČO (v prípade firmy):</strong> ${this.invoiceForm.value.invoiceICO}</p>
            <p><strong>DIČ (v prípade firmy):</strong> ${this.invoiceForm.value.invoiceDIC}</p>
            <p><strong>E-mail:</strong> ${this.invoiceForm.value.invoiceEmail}</p>
            <p><strong>Telefónne číslo:</strong> ${this.invoiceForm.value.invoicePhoneNumber}</p>
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
        <p><strong>Dátum objednávky:</strong> ${this.currentDate}</p>
        <p><strong>Spôsob doručenia:</strong> ${this.orderForm.value.deliveryOption}</p>
        <p><strong>Spôsob platby:</strong> ${this.orderForm.value.paymentOption}</p>
    </div>
    <div style="text-align: right; margin-bottom: 20px;">
        <p><strong>Medzisúčet:</strong> 0€</p>
        <p><strong>Zľava (-${this.orderForm.value.discountAmount}%):</strong></p>
        <h2 style="margin: 0; color: #333;">Celková suma: 0€</h2>
    </div>
    <div style="border-top: 1px solid #ddd; padding-top: 10px; color: #666; font-size: 12px;">
        <p><strong>Poznámka: ${this.orderForm.value.note}</strong></p>
    </div>
</div>`

      const options = {
        margin: 5,
        filename: `Faktúra_č${this.orderId}.pdf`,
        html2canvas: { scale: 2 }
      };

      if(invoiceHTML){
        html2pdf().set(options).from(invoiceHTML).save();
        this.invoiceCreated = true;
      }
    }else{
      this.validateAllFormFields(this.invoiceForm);
      this.snackBar.open('Zadané údaje nie sú správne alebo polia označené hviezdičkou boli vynechané!', '', {duration: 2000});
    }
  }

  ngOnInit(): void {
    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');
    
    this.existingOrderId = Number(this.route.snapshot.paramMap.get('orderId'));
    if(this.existingOrderId){
      this.isEditMode = true;
      this.loadOrder(this.existingOrderId);
    }else{
      this.isEditMode = false;
    }
  }
}
export interface OrderDTO {
  id?: number;
  orderId: number;
  customerName: string;
  company?: string;
  ico?: string;
  dic?: string;
  icDph?: string;
  address: string;
  city: string;
  postalCode: string;
  email: string;
  phoneNumber: string;
  note?: string;
  deliveryOption: string;
  paymentOption: string;
  discountAmount?: number;
  orderStatus: string;
  orderDate?: string;
  invoiceNumber: string;
  variableSymbol: string;
  invoiceIssueDate: string; 
  invoiceDueDate: string;  
  invoiceDeliveryDate: string;
  invoiceName: string;
  invoiceCompany?: string; 
  invoiceICO?: string; 
  invoiceDIC?: string;
  invoiceEmail: string;
  invoicePhoneNumber: string;
}
