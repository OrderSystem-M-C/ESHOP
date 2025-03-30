import { CommonModule, DatePipe, formatCurrency, NgClass } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { Form, FormControl, FormGroup, FormsModule, ReactiveFormsModule, UntypedFormBuilder, Validators } from '@angular/forms';
import * as html2pdf from 'html2pdf.js';
import { OrderService } from '../services/order.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductDTO } from '../products-page/products-page.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ProductService } from '../services/product.service';
import { HttpResponse } from '@angular/common/http';

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
  newSelectedProducts: ProductDTO[] = [];

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
    orderStatus: new FormControl('Nezpracované - nová objednávka')
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

      if (this.isEditingProducts) {
        this.newSelectedProducts = JSON.parse(JSON.stringify(this.selectedProducts)); //aby sa predišlo problémom s referenciami, vytvorí sa tzv. hlboká kópia (deep copy), lebo keď v JavaScripte priradím premennú typu objekt alebo pole, neukladá sa jeho skutočná hodnota, ale iba referencia na ten objekt v pamäti a tak dostaneme samostatnú kópiu.
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

    if(this.isEditMode){
      const newIndex = this.newSelectedProducts.findIndex(p => p.productId === product.productId);
      if(newIndex !== -1){
        this.newSelectedProducts.splice(newIndex, 1);
      }else{
        this.newSelectedProducts.push(product);
      }
    }
  }
  confirmSelection() {
    this.dialogRef.close(this.isEditingProducts);
  }
  closeDialog(){
    this.dialogRef.close();
  }

  checkChanges(originalProducts: ProductDTO[], newProducts: ProductDTO[]): boolean {
    if(originalProducts.length !== newProducts.length){
      return true;
    }
    const originalMap = new Map(originalProducts.map(p => [p.productId, p.productAmount]));
    const newMap = new Map(newProducts.map(p => [p.productId, p.productAmount]));
    return [...originalMap.keys()].some(productId => !newMap.has(productId) || originalMap.get(productId) !== newMap.get(productId)) || 
           [...newMap.keys()].some(productId => !originalMap.has(productId))
  }

  removeProduct(productId: number): void{
    const index = this.selectedProducts.findIndex(p => p.productId === productId);
    this.totalPrice -= this.selectedProducts[index].productAmount * this.selectedProducts[index].productPrice;
    if(index !== -1){
      this.selectedProducts.splice(index, 1);
      this.snackBar.open('Produkt bol odstránený!', '', { duration: 1000 });
    }
    if(this.isEditMode){
      const newIndex = this.newSelectedProducts.findIndex(p => p.productId === productId);
      if (newIndex !== -1) {
        this.newSelectedProducts.splice(newIndex, 1);
      }
    }
  }

  updateAmount(productId: number, productAmount: number) {
    const product = this.selectedProducts.find(p => p.productId === productId);
    if(product && productAmount > 0){
      product.productAmount = productAmount;
      this.recalculateTotalPrice();
    }
    if (this.isEditingProducts) {
      const newProduct = this.newSelectedProducts.find(p => p.productId === productId);
      if (newProduct) {
        newProduct.productAmount = productAmount;
      }
    }
  }
  recalculateTotalPrice(){
    const products = this.isEditingProducts ? this.newSelectedProducts : this.selectedProducts;
    this.totalPrice = products.reduce((acc, product) => {
      return acc + (product.productPrice * product.productAmount);
    }, 0)
  }

  updateOrder(){
    const arrayChanged = this.checkChanges(this.selectedProducts, this.newSelectedProducts);
    if(this.orderForm.valid && this.invoiceForm.valid){
      if(this.orderForm.pristine && !arrayChanged){
        this.snackBar.open('Nebola vykonaná žiadna zmena v objednávke!', '', {duration: 1000});
      }else{
        let order = this.createOrderDTO();
        this.isLoading = this.invoiceCreated = true;

        this.orderService.updateOrder(this.existingOrderId, order).subscribe((response) => {
          const response_obj = response
          if(arrayChanged){
            this.orderService.updateOrderProducts(response_obj.id, this.selectedProducts).subscribe((response: HttpResponse<boolean>) => {
              if(response.status === 200 || response.status === 204){
                this.snackBar.open('Objednávka bola úspešne upravená!', '', {duration: 2000});
                this.router.navigate(['/orders-page']);
                this.isLoading = false;
              }
            });
          }
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

      this.totalPrice = order.totalPrice;

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
        console.log(this.newSelectedProducts, this.selectedProducts)
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
    const discountAmount = this.orderForm.value.discountAmount ? this.orderForm.value.discountAmount : 0;
    const formattedInvoiceIssueDate = this.invoiceForm.value.invoiceIssueDate.split('-').reverse().join('.');
    if(this.invoiceForm.valid){
      const invoiceHTML = `
<div style="width: 100%; margin: 20px auto; box-sizing: border-box; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333;">
  <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-bottom: 1px solid #e0e0e0;">
    <h2 style="margin-top: 10px;">Číslo objednávky: <strong>${this.isEditMode ? this.existingOrderId : this.orderId}</strong></h2>
  </div>
  <div style="padding: 20px;">
    <div style="margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white; border-bottom: 1px solid #0d6efd;">Dátum vystavenia faktúry</th>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${formattedInvoiceIssueDate}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white; border-bottom: 1px solid #0d6efd;">Číslo faktúry</th>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.invoiceForm.value.invoiceNumber}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white;">Celkový počet produktov</th>
          <td style="padding: 10px;">${this.selectedProducts.reduce((sum, product) => sum + product.productAmount, 0)} ks</td>
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
            <th style="padding: 10px; text-align: center;">Ks</th>
            <th style="padding: 10px; text-align: center;">Celkom</th>
          </tr>
        </thead>
        <tbody>
          ${this.selectedProducts.map(product => `
            <tr>
              <td style="padding: 10px; text-align: left; border-bottom: 1px solid #f0f0f0;">${product.productName}</td>
              <td style="padding: 10px; text-align: center; border-bottom: 1px solid #f0f0f0;">${product.productPrice}€</td>
              <td style="padding: 10px; text-align: center; border-bottom: 1px solid #f0f0f0;">${product.productAmount} ks</td>
              <td style="padding: 10px; text-align: center; border-bottom: 1px solid #f0f0f0;">${(product.productAmount * (product.productPrice - ((product.productPrice / 100) * discountAmount))).toFixed(2)}€</td>
            </tr>
          `).join('')}
          <tr>
            <td style="padding: 10px; font-weight: bold; text-align: left;">CELKOM:</td>
            <td style="padding: 10px;"></td>
            <td style="padding: 10px;"></td>
            <td style="padding: 10px; font-weight: bold; text-align: right;">
              ${discountAmount ? ((this.totalPrice - (this.totalPrice * discountAmount / 100)).toFixed(2) + '€ <span style="color: #6c757d;">(-' + discountAmount + '%)</span>') : (this.totalPrice.toFixed(2) + '€ <span style="color: #6c757d;">(-' + discountAmount + '%)</span>')}
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
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.orderForm.value.customerName}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white; border-bottom: 1px solid #0d6efd;">Spoločnosť, IČO, DIČ, IČ DPH</th>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.orderForm.value.company || 'Nie je zadané'}, ${this.orderForm.value.ico || 'Nie je zadané'}, ${this.orderForm.value.dic || 'Nie je zadané'}, ${this.orderForm.value.icDph || 'Nie je zadané'}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white; border-bottom: 1px solid #0d6efd;">Adresa</th>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.orderForm.value.address}, ${this.orderForm.value.postalCode}, ${this.orderForm.value.city}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white; border-bottom: 1px solid #0d6efd;">E-mail</th>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.orderForm.value.email}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white;">Tel.č.</th>
          <td style="padding: 10px;">${this.orderForm.value.phoneNumber}</td>
        </tr>
      </table>
    </div>

    <div>
      <h3 style="margin-bottom: 10px; font-weight: bold;">Fakturačné údaje</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white; border-bottom: 1px solid #0d6efd;">Meno a priezvisko</th>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.invoiceForm.value.invoiceName}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white; border-bottom: 1px solid #0d6efd;">Spoločnosť, IČO, DIČ</th>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.invoiceForm.value.invoiceCompany || 'Nie je zadané'}, ${this.invoiceForm.value.invoiceICO || 'Nie je zadané'}, ${this.invoiceForm.value.invoiceDIC || 'Nie je zadané'}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white; border-bottom: 1px solid #0d6efd;">E-mail</th>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.invoiceForm.value.invoiceEmail}</td>
        </tr>
        <tr>
          <th style="padding: 10px; text-align: left; background-color: #0d6efd; color: white;">Tel.č.</th>
          <td style="padding: 10px;">${this.invoiceForm.value.invoicePhoneNumber}</td>
        </tr>
      </table>
    </div>
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
interface OrderResponse {
  id: number;
}