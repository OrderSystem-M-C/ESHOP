import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { Form, FormControl, FormGroup, FormsModule, ReactiveFormsModule, UntypedFormBuilder, Validators } from '@angular/forms';
import * as html2pdf from 'html2pdf.js';
import { OrderService } from '../services/order.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductDTO } from '../products-page/products-page.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ProductService } from '../services/product.service';

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
  isLoading_edit: boolean = false;

  dialogRef!: MatDialogRef<any>;
  dialogClosed: boolean = true;

  productsData: ProductDTO[] = [];
  sortedProducts: ProductDTO[] = [];
  selectedProducts: ProductDTO[] = [];

  searchText: string = ''; 

  isEditingProducts: boolean = false;

  totalPrice: number = 0;

  constructor(private datePipe: DatePipe, private route: ActivatedRoute, public orderService: OrderService, private router: Router, private snackBar: MatSnackBar, private dialog: MatDialog, private productService: ProductService){}

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
      totalPrice: this.totalPrice,
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

  searchProducts() {
    if (!this.searchText || this.searchText.trim() === '') {
      this.sortedProducts = this.productsData;
    } else {
      this.sortedProducts = this.productsData.filter(product =>
        product.productName.toLowerCase().includes(this.searchText.toLowerCase()) ||
        product.productId.toString().includes(this.searchText)
      );
    }
  }

  openDialog(selectProductsDialog: TemplateRef<any>, edit: boolean | null){
    this.dialogClosed = false;
    this.isLoading = true;

    this.dialogRef = this.dialog.open(selectProductsDialog, {
      disableClose: true
    });
    
    this.productService.getProducts().subscribe((result) => {
      this.productsData = result.map(product => ({
        ...product,
        productAmount: 1,
        productSelected: this.selectedProducts.some(p => p.productId === product.productId) 
      }));
  
      this.sortedProducts = this.productsData;
      this.isLoading = false;
    }, (error) => {
      console.error('An error occurred while trying to get products data.', error);
      this.isLoading = false;
    })

    this.isEditingProducts = edit;
    
    this.dialogRef.afterClosed().subscribe((result) => {
      if(result === true){
        this.snackBar.open('Výber produktov bol úspešne zmenený!', '', { duration: 1000 });
      }else if(result === false){
        this.snackBar.open('Produkty boli úspešne pridané!', '', { duration: 1000 });
      }else{
        this.snackBar.open('Výber produktov bol zrušený!', '', { duration: 1000 });
      }
    })
  }
  toggleProductSelection(product: ProductDTO){
    const index = this.selectedProducts.findIndex(p => p.productId === product.productId);
    if(index != -1){
      this.selectedProducts.splice(index, 1);
      this.totalPrice -= product.productPrice;
    }else{
      this.selectedProducts.push(product);
      this.totalPrice += product.productPrice;
    }
  }
  confirmSelection() {
    this.dialogRef.close(this.isEditingProducts);
  }
  closeDialog(){
    this.dialogRef.close();
  }

  removeProduct(productId: number): void{
    const index = this.selectedProducts.findIndex(p => p.productId === productId);
    this.totalPrice -= this.selectedProducts[index].productAmount * this.selectedProducts[index].productPrice;
    if(index !== -1){
      this.selectedProducts.splice(index, 1);
      this.snackBar.open('Produkt bol odstránený!', '', { duration: 1000 });
    }
  }

  updateAmount(productId: number, productAmount: number) {
    const product = this.selectedProducts.find(p => p.productId === productId);
    if(product && productAmount > 0){
      product.productAmount = productAmount;
      this.recalculateTotalPrice();
    }
  }
  recalculateTotalPrice(){
    this.totalPrice = this.selectedProducts.reduce((acc, product) => {
      return acc + (product.productPrice * product.productAmount);
    }, 0)
  }

  updateOrder(){
    if(this.orderForm.valid && this.invoiceForm.valid){
      if(this.orderForm.pristine){
        this.snackBar.open('Nebola vykonaná žiadna zmena v objednávke!', '', {duration: 1000});
      }else{
        let order = this.createOrderDTO();

        this.isLoading = this.invoiceCreated = true;

        this.orderService.updateOrder(this.existingOrderId, order).subscribe((response) => {
          this.orderService.updateOrderProducts(order.orderId, this.selectedProducts).subscribe(() => {
            this.snackBar.open('Objednávka bola úspešne upravená!', '', {duration: 1000});
            this.router.navigate(['/orders-page']);
            this.isLoading = false;
          });
      }, (error) => {
        console.error("An error occurred while trying to update order", error);
        this.isLoading = false;
      });
      }
    }else if(this.orderForm.invalid || this.invoiceForm.invalid){
      this.snackBar.open('Zadané údaje nie sú správne alebo polia označené hviezdičkou boli vynechané!', '', {duration: 2000});
      this.validateAllFormFields(this.orderForm);
      this.validateAllFormFields(this.invoiceForm);
    }else if(this.selectedProducts.length === 0) {
      this.snackBar.open('Neboli zvolené žiadne produkty!', '', {duration: 2000});
    }
  }

  loadOrder(orderId: number){
    this.isLoading_edit = true;
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

      this.orderService.getOrderProducts(orderId).subscribe((result) => {
        this.selectedProducts = result;
        this.isLoading_edit = false;
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
    if(this.orderForm.valid && this.invoiceForm.valid && this.selectedProducts.length > 0){
      let order = this.createOrderDTO();

      this.isLoading = true;

      this.orderService.createOrder(order).subscribe((response: OrderDTO) => {
        if(response){
          this.orderService.addProductsToOrder(this.orderId, this.selectedProducts).subscribe();
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
    }else if(this.selectedProducts.length === 0) {
      const element = document.getElementById('selected-products-id');
      element.scrollIntoView({behavior: 'smooth', block: 'start'});
      this.snackBar.open('Nemáte zvolené produkty pre túto objednávku!', '', {duration: 2500}); 
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
          <td style="padding: 8px;">${(product.productPrice - ((product.productPrice / 100)) * this.orderForm.value.discountAmount).toFixed(2)}€ (-${this.orderForm.value.discountAmount}%)</td>
          <td style="padding: 8px;">${product.productAmount}x</td>
          <td style="padding: 8px;">${(product.productAmount * (product.productPrice - ((product.productPrice / 100) * this.orderForm.value.discountAmount))).toFixed(2)}€</td>
        </tr>`
      ).join('')}
      <tr>
        <td style="font-weight: bold; padding: 8px;">CELKOM:</td>
        <td style="padding: 8px;"></td>
        <td style="padding: 8px;"></td>
         <td style="font-weight: bold; padding: 8px">
          ${this.orderForm.value.discountAmount ? ((this.totalPrice - (this.totalPrice * this.orderForm?.value.discountAmount / 100)).toFixed(2) + '€ (-' + this.orderForm.value.discountAmount + '%)') : (this.totalPrice.toFixed(2) + '€')}
        </td>
      </tr>
    </table>
  </div>
  <div class="third-table" style="margin-top: 10px">
    <h3>Objednávateľ</h3>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Meno</th>
        <td style="padding: 8px;">${this.orderForm.value.customerName}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Spoločnosť</th>
        <td style="padding: 8px;">${this.orderForm.value.company || 'Nie je zadané'}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">IČO</th>
        <td style="padding: 8px;">${this.orderForm.value.ico || 'Nie je zadané'}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">DIČ</th>
        <td style="padding: 8px;">${this.orderForm.value.dic || 'Nie je zadané'}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">IČ DPH</th>
        <td style="padding: 8px;">${this.orderForm.value.icDph || 'Nie je zadané'}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Adresa</th>
        <td style="padding: 8px;">${this.orderForm.value.address}, ${this.orderForm.value.postalCode}, ${this.orderForm.value.city}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">E-mail</th>
        <td style="padding: 8px;">${this.orderForm.value.email}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Tel.č.</th>
        <td style="padding: 8px;">${this.orderForm.value.phoneNumber}</td>
      </tr>
    </table>
  </div>

  <!-- Fakturačné údaje -->
  <div class="invoice-table" style="margin-top: 10px;">
    <h3>Fakturačné údaje</h3>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Názov faktúry</th>
        <td style="padding: 8px;">${this.invoiceForm.value.invoiceName}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Spoločnosť</th>
        <td style="padding: 8px;">${this.invoiceForm.value.invoiceCompany || 'Nie je zadané'}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">IČO</th>
        <td style="padding: 8px;">${this.invoiceForm.value.invoiceICO || 'Nie je zadané'}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">DIČ</th>
        <td style="padding: 8px;">${this.invoiceForm.value.invoiceDIC || 'Nie je zadané'}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">E-mail</th>
        <td style="padding: 8px;">${this.invoiceForm.value.invoiceEmail}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Tel.č.</th>
        <td style="padding: 8px;">${this.invoiceForm.value.invoicePhoneNumber}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Dátum vystavenia faktúry</th>
        <td style="padding: 8px;">${this.invoiceForm.value.invoiceIssueDate}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Dátum splatnosti</th>
        <td style="padding: 8px;">${this.invoiceForm.value.invoiceDueDate}</td>
      </tr>
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #0d6efd; color: white;">Dátum doručenia faktúry</th>
        <td style="padding: 8px;">${this.invoiceForm.value.invoiceDeliveryDate}</td>
      </tr>
    </table>
  </div>
</div>
`
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
    
    this.existingOrderId = Number(this.route.snapshot.paramMap.get('orderId')) ?? null;

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
  totalPrice: number;
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
