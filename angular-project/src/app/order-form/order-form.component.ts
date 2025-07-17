import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import * as html2pdf from 'html2pdf.js';
import { OrderService } from '../services/order.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductDTO } from '../products-page/products-page.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ProductService } from '../services/product.service';
import { HttpResponse } from '@angular/common/http';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CustomPaginatorIntl } from '../services/custom-paginator-intl.service';
import { EmailService } from '../services/email.service';
import { EphService } from '../services/eph.service';
import { catchError, map, Observable, of } from 'rxjs';
import { CdkDrag, DragDropModule, moveItemInArray, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ManageStatusesDialogComponent } from '../manage-statuses-dialog/manage-statuses-dialog.component';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [DatePipe, CommonModule, FormsModule, ReactiveFormsModule, MatSnackBarModule, NgClass, MatPaginatorModule, DragDropModule, CdkDrag],
  providers: [DatePipe, OrderService, { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }],
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
  isEditOrderStatus: boolean = false;
  isLoading_packageCode: boolean = false;

  dialogRef!: MatDialogRef<any>;
  dialogClosed: boolean = true;

  productsData: ProductDTO[] = [];
  sortedProducts: ProductDTO[] = [];
  ourSortedProducts: ProductDTO[] = [];
  selectedProducts: ProductDTO[] = [];
  newSelectedProducts: ProductDTO[] = [];

  searchText: string = ''; 
  searchOption: string = 'auto';

  isEditingProducts: boolean = false;

  totalPrice: number = 0;
  productsTotalPrice: number = 0; 
  calculatedDiscountAmount: number = 0; 
  deliveryCost: number = 0;
  paymentCost: number = 0;

  totalItems: number = 0;
  pageIndex: number = 0;
  pageSize: number = 4;

  originalPackageCode: string = '';

  statuses: OrderStatusDTO[] = [];
  private originalStatusesOrder: OrderStatusDTO[] = [];

  constructor(private datePipe: DatePipe, private route: ActivatedRoute, public orderService: OrderService, private router: Router, private snackBar: MatSnackBar, private dialog: MatDialog, private productService: ProductService, private emailService: EmailService, private ephService: EphService){}

  updatePagedProducts(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.ourSortedProducts = this.sortedProducts.slice(startIndex, endIndex);
  }

  handlePageEvent(pageEvent: PageEvent){
    this.pageSize = pageEvent.pageSize;
    this.pageIndex = pageEvent.pageIndex;
    this.updatePagedProducts();
  }

  
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
    deliveryCost: new FormControl(0, Validators.required),
    paymentOption: new FormControl('', Validators.required),
    paymentCost: new FormControl(0, Validators.required),
    discountAmount: new FormControl(null, Validators.pattern('^[0-9]*$')),
    orderStatus: new FormControl('Nezpracované - nová objednávka'),
    packageCode: new FormControl('', Validators.pattern('^[A-Z]{2}\\d{9}[A-Z]{2}$'))
  });

  invoiceForm = new FormGroup({
    invoiceNumber: new FormControl(`${this.orderId}`, Validators.required),
    invoiceVariable: new FormControl(`${this.orderId}`, Validators.required),
    invoiceIssueDate: new FormControl('', Validators.required),
    invoiceDueDate: new FormControl(''),
    invoiceDeliveryDate: new FormControl(''),
    invoiceName: new FormControl('', Validators.required),
    invoiceCompany: new FormControl(''),
    invoiceICO: new FormControl(''),
    invoiceDIC: new FormControl(''),
    invoiceEmail: new FormControl('', [Validators.required, this.emailValidator]),
    invoicePhoneNumber: new FormControl('', [Validators.required, this.phoneValidator]),
  });

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
      deliveryCost: this.orderForm.value.deliveryCost,
      paymentOption: this.orderForm.value.paymentOption,
      paymentCost: this.orderForm.value.paymentCost,
      discountAmount: this.orderForm.value.discountAmount || 0,
      orderStatus: this.orderForm.value.orderStatus,
      ...(this.isEditMode ? {} : {orderDate: this.currentDate}),
      packageCode: this.orderForm.value.packageCode,
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

  loadOrderStatuses(): void {
    this.orderService.getOrderStatuses().subscribe({
      next: (response) => {
        this.statuses = this.originalStatusesOrder = response;
      },
      error: (err) => console.error(err)
    })
  }
  openManageStatusesDialog(): void {
    const dialogRef = this.dialog.open(ManageStatusesDialogComponent, {
      width: '1000px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result === true){
        this.statuses = this.originalStatusesOrder = [];
        this.loadOrderStatuses();
      }
    })
  }
  toggleEditOrderStatus() {
    if(this.isEditOrderStatus){
      if(this.hasOrderChanged()){
        this.saveStatusOrder();
      }else{
        this.snackBar.open("Poradie sa nezmenilo, nič sa neuložilo!", "", { duration: 2000 });
      }
    }
    this.isEditOrderStatus = !this.isEditOrderStatus;
  }
  drop(event: CdkDragDrop<any[]>) {
    const sorted = [...this.sortedStatuses];
    moveItemInArray(sorted, event.previousIndex, event.currentIndex);
    sorted.forEach((status, index) => {
      status.sortOrder = index;
    });
    this.statuses = sorted;
  }
  get sortedStatuses(): OrderStatusDTO[] {
    return this.statuses.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  }
  saveStatusOrder(){
    this.orderService.saveOrderStatusesSortOrder(this.statuses).subscribe({
      next: () => {
        this.snackBar.open("Poradie stavov bolo úspešne zmenené!", "", {
          duration: 2000
        })
      },
      error: (err) => console.error(err)
    })
  }
  hasOrderChanged(): boolean {
    for(let i = 0; i < this.statuses.length; i++){
      if(this.statuses[i].sortOrder !== i) return true;
    }
    return false;
  }
  cancelEditOrderStatus(): void {
    this.statuses = this.originalStatusesOrder;
    this.isEditOrderStatus = false;
    this.snackBar.open("Úpravy poradia boli zrušené.", "", {
      duration: 2000
    })
  }
  trackByStatusId(index: number, status: OrderStatusDTO): number {
    return status.statusId;
  }

  searchProducts() {
    let filtered = [...this.productsData];

    if(this.searchText && this.searchText.trim() !== ''){
      const searchLower = this.searchText.toLowerCase();

      filtered = filtered.filter(product => {
        switch (this.searchOption) {
          case 'productName':
            return product.productName.toLowerCase().includes(searchLower);
          case 'productId':
            return product.productId.toString().startsWith(searchLower);
          case 'productPrice':
            return product.productPrice.toString().startsWith(searchLower);
          case 'auto':
            return (
              product.productName.toLowerCase().includes(searchLower) ||
              product.productId.toString().startsWith(searchLower) ||
              product.productPrice.toString().startsWith(searchLower)
            );
          default:
            return false;
        }
      });
    }
    this.sortedProducts = filtered;
    this.pageIndex = 0;
    this.totalItems = this.sortedProducts.length;
    this.updatePagedProducts();
  }

  openDialog(selectProductsDialog: TemplateRef<any>, edit: boolean | null){
    this.dialogClosed = false;
    this.isLoading = true;

    const hadNoProductsBefore = this.selectedProducts.length === 0;
    this.newSelectedProducts = JSON.parse(JSON.stringify(this.selectedProducts));

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
      this.totalItems = this.sortedProducts.length;
      this.updatePagedProducts();
      
    }, (error) => {
      console.error('An error occurred while trying to get products data.', error);
      this.isLoading = false;
    })

    this.isEditingProducts = edit;
    
    this.dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.snackBar.open('Výber produktov bol úspešne zmenený!', '', { duration: 1000 });
      } else if (result === false) {
        if (hadNoProductsBefore && this.selectedProducts.length > 0) {
          this.snackBar.open('Produkty boli úspešne pridané!', '', { duration: 1000 });
        } else {
          this.snackBar.open('Výber produktov bol upravený!', '', { duration: 1000 });
        }
      } else {
        this.snackBar.open('Výber produktov bol zrušený!', '', { duration: 1000 });
        this.selectedProducts = JSON.parse(JSON.stringify(this.newSelectedProducts));
        this.totalPrice = this.selectedProducts.reduce((sum, p) => sum + p.productPrice, 0);
      }
      this.recalculateTotalPrice();
    });
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
    if(this.selectedProducts.length > 0){
      const isEdit = this.isEditingProducts === true;
      this.dialogRef.close(isEdit); 
    }
  }
  closeDialog(){
    if(this.hasUnsavedChanges()) {
      const confirmClose = window.confirm('Máte neuložené zmeny, chcete naozaj zatvoriť dialóg bez uloženia?');
      if (!confirmClose) {
        return;
      }
    }
    this.dialogRef.close(null);
  }
  hasUnsavedChanges(): boolean {
    if (this.selectedProducts.length !== this.newSelectedProducts.length) return true;

    const sortedSelected = [...this.selectedProducts].sort((a,b) => a.productId - b.productId);
    const sortedOriginal = [...this.newSelectedProducts].sort((a,b) => a.productId - b.productId);

    for (let i = 0; i < sortedSelected.length; i++) {
      if (sortedSelected[i].productId !== sortedOriginal[i].productId) return true;
    }
    return false;
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

  clearProducts(): void{
    this.selectedProducts = [];
    this.totalPrice = 0;
    this.snackBar.open('Vaše zvolené produkty boli úspešne premazané!', '', { duration: 2000 });
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
  recalculateTotalPrice(): void {
    let productsTotal = 0;
    this.selectedProducts.forEach(product => {
      productsTotal += (product.productPrice * product.productAmount);
    });
    this.productsTotalPrice = productsTotal; 

    this.deliveryCost = this.orderForm.get('deliveryCost')?.value || 0;
    this.paymentCost = this.orderForm.get('paymentCost')?.value || 0;
    const discountPercentage = this.orderForm.get('discountAmount')?.value || 0;

    let currentTotal = this.productsTotalPrice + this.deliveryCost + this.paymentCost;

    this.calculatedDiscountAmount = (currentTotal * discountPercentage) / 100;

    this.totalPrice = currentTotal - this.calculatedDiscountAmount;

    if (this.totalPrice < 0) {
      this.totalPrice = 0;
    }
  }
  onDeliveryChange() {
    const deliveryOption = this.orderForm.get('deliveryOption')?.value;

    if (deliveryOption === 'Kuriér') {
      this.orderForm.get('deliveryCost')?.setValue(5);
    } else {
      this.orderForm.get('deliveryCost')?.setValue(0);
    }

    this.recalculateTotalPrice();
  }
  onPaymentChange() {
    const paymentOption = this.orderForm.get('paymentOption')?.value;

    if (paymentOption === 'Hotovosť') {
      this.orderForm.get('paymentCost')?.setValue(2);
    } else {
      this.orderForm.get('paymentCost')?.setValue(0);
    }

    this.recalculateTotalPrice();
  }

  async updateOrder(){
    this.isLoading = true;
    if (this.isEditMode && this.orderForm.value.packageCode === this.originalPackageCode) {
    } else if (this.orderForm.value.packageCode?.trim()) {
      const isValid = await this.validatePackageCodeForSubmit(this.orderForm.value.packageCode).toPromise();
      if (!isValid) {
        this.isLoading = false;
        return;
      }
    }
    const arrayChanged = this.checkChanges(this.selectedProducts, this.newSelectedProducts);
    if(this.orderForm.valid && this.invoiceForm.valid){
      if(this.orderForm.pristine && !arrayChanged){
        this.snackBar.open('Nebola vykonaná žiadna zmena v objednávke!', '', {duration: 1000});
      }else{
        let order = this.createOrderDTO();

        if(order.orderStatus === 'Zasielanie čísla zásielky'){
            if(!order.packageCode || order.packageCode.trim() === ''){
               this.snackBar.open('Pre odoslanie e-mailu je potrebné zadať podacie číslo!', '', { duration: 2000 });
               const packageCodeControl = this.orderForm.get('packageCode');
               packageCodeControl?.setErrors({ invalid: true });
               packageCodeControl?.markAsTouched();
               return;
            }
        }

        this.invoiceCreated = true;

        this.orderService.updateOrder(this.existingOrderId, order).subscribe((response) => {
          const response_obj = response
          if(arrayChanged){
            this.orderService.updateOrderProducts(response_obj.id, this.selectedProducts).subscribe((response: HttpResponse<boolean>) => {
              if(response.status === 200 || response.status === 204){
                this.checkOrderStatusAndSendEmails(order);
                this.snackBar.open('Objednávka bola úspešne upravená!', '', {duration: 2000});
                this.router.navigate(['/orders-page']);
                this.isLoading = false;
              }
            }, (error) => {
                console.error("An error occurred while trying to update order products", error);
                this.isLoading = false;
            });
          } else {
            this.checkOrderStatusAndSendEmails(order);
            this.isLoading = false;
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

  private checkOrderStatusAndSendEmails(order: OrderDTO){
    const orderStatus = this.orderForm.get('orderStatus')?.value || order.orderStatus;

    const emailDtos = this.selectedProducts.map(() => ({
        email: order.email,
        orderId: order.orderId,
        packageCode: order.packageCode
    }));

    if(orderStatus === 'Zasielanie čísla zásielky') {
       this.emailService.sendPackageCodeEmails(emailDtos).subscribe();
    } else if(orderStatus === 'Dobierka - Info k objednávke (poslať e-mail)') {
      this.emailService.sendOrderConfirmationEmails(emailDtos).subscribe();
    }
  }

  loadOrder(orderId: number){
    this.isLoading_edit = true;
    this.orderService.getOrderDetails(orderId).subscribe((order) => {
      this.orderForm.patchValue(order); //patchValue robi ze vyplni hodnoty objednavky
      this.originalPackageCode = order.packageCode;
      this.recalculateTotalPrice();

      if(order.packageCode === ''){
        this.ephService.generatePackageCode().subscribe({
          next: (response) => {
            this.orderForm.patchValue({
              packageCode: response.packageCode
            })
          },
          error: (err) => console.error(err)
        })
      }

      this.totalPrice = order.totalPrice;

      this.invoiceForm.patchValue({
        invoiceNumber: order.invoiceNumber,
        invoiceVariable: order.variableSymbol,
        invoiceIssueDate: order.invoiceIssueDate,
        invoiceDueDate: order.invoiceDueDate === '' ? undefined : order.invoiceDueDate,
        invoiceDeliveryDate: order.invoiceDeliveryDate === '' ? undefined : order.invoiceDeliveryDate,
        invoiceName: order.invoiceName,
        invoiceCompany: order.invoiceCompany,
        invoiceICO: order.invoiceICO,
        invoiceDIC: order.invoiceDIC,
        invoiceEmail: order.invoiceEmail,
        invoicePhoneNumber: order.invoicePhoneNumber,
      });

      this.orderService.getOrderProducts(order.id).subscribe((result) => {
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
  
  async submitOrder(){
    this.isLoading = true;
    if(this.orderForm.value.packageCode?.trim()){
      const isValid = await this.validatePackageCodeForSubmit(this.orderForm.value.packageCode).toPromise();
      if(!isValid){
        this.isLoading = false;
        return;
      }
    }
    if(this.orderForm.valid && this.invoiceForm.valid && this.selectedProducts.length > 0){
      let order = this.createOrderDTO();

      if(order.orderStatus === 'Zasielanie čísla zásielky'){
        if(!order.packageCode || order.packageCode.trim() === ''){
            this.snackBar.open('Pre odoslanie e-mailu je potrebné zadať podacie číslo!', '', { duration: 2000 });
            const packageCodeControl = this.orderForm.get('packageCode');
            packageCodeControl?.setErrors({ invalid: true });
            packageCodeControl?.markAsTouched();
            return;
        }
      }

      this.orderService.createOrder(order).subscribe((response: OrderDTO) => {
        if(response){
          this.orderService.addProductsToOrder(response.id, this.selectedProducts).subscribe({
            next: (res) => {
              if (res.status === 204) {
                this.checkOrderStatusAndSendEmails(order);
                this.isLoading = false;

                if (!this.invoiceCreated) {
                  this.createInvoice();
                  this.router.navigate(['/orders-page']);
                } else {
                  this.snackBar.open('Objednávka bola úspešne vytvorená!', '', {duration: 1000});
                  this.router.navigate(['/orders-page']);
                }
             } else {
                 console.warn('Unexpected status:', res.status);
              }
            },
            error: (error) => {
              console.error('An error has occurred while trying to add products to order', JSON.stringify(error));
              this.isLoading = false;
            }
          });
        }else{
          this.checkOrderStatusAndSendEmails(order);
          this.isLoading = false;
        }
      }, (error) => {
        console.error("An error occurred while trying to create order", error);
        this.isLoading = false;
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
  checkPackageCodeFormat(code: string): boolean {
    const trackingPattern = /^[A-Z]{2}\d{9}[A-Z]{2}$/;
    const result = trackingPattern.test(code);

    if (!result) {
      this.snackBar.open('Zadané podacie číslo nie je v správnom formáte!', '', { duration: 3000 });
      this.orderForm.get('packageCode')?.setErrors({ invalidFormat: true });
      return false;
    }
    this.orderForm.get('packageCode')?.setErrors(null);
    return true;
  }

  validatePackageCode(packageCode: string): void {
    this.isLoading_packageCode = true;
    if (this.isEditMode && packageCode === this.originalPackageCode) {
      this.orderForm.get('packageCode')?.setErrors(null);
      this.snackBar.open('Podacie číslo ostáva nezmenené a je platné.', '', { duration: 3000 });
      this.isLoading_packageCode = false;
      return;
    }
    if (!this.checkPackageCodeFormat(packageCode)) return;

    this.ephService.validatePackageCode(packageCode).subscribe({
      next: (response) => {
        if(response.valid){
          this.orderForm.get('packageCode')?.setErrors(null);
          this.snackBar.open(response.message || 'Podacie číslo je platné a dostupné.', '', { duration: 3000 });
        }else{
          this.orderForm.get('packageCode')?.setErrors({ invalid: true });
          this.snackBar.open(response.message || 'Neznáma chyba pri validácií podacieho čísla!', '', { duration: 3000 });
        }
        this.isLoading_packageCode = false;
      },
      error: (err) => {
        const msg = err?.error?.message || 'Neznáma chyba pri validácií podacieho čísla!';
        this.orderForm.get('packageCode')?.setErrors({ invalid: true });
        this.snackBar.open(msg, '', { duration: 3000 });
        this.isLoading_packageCode = false;
      }
    })
  }
  validatePackageCodeForSubmit(packageCode: string): Observable<boolean> {
    if (!this.checkPackageCodeFormat(packageCode)) {
      return of(false);
    }
    return this.ephService.validatePackageCode(packageCode).pipe(
      map(response => {
        if(response.valid){
          this.orderForm.get('packageCode')?.setErrors(null);
          return true;
        }else{
          this.orderForm.get('packageCode')?.setErrors({ invalid: true });
          this.snackBar.open(response.message || 'Neznáma chyba pri validácií podacieho čísla!', '', { duration: 3000 });
          return false;
        }
      }),
      catchError(err => {
         const msg = err?.error?.message || 'Neznáma chyba pri validácií podacieho čísla!';
         this.orderForm.get('packageCode')?.setErrors({ invalid: true });
         this.snackBar.open(msg, '', { duration: 3000 });
        return of(false);
      })
    )
  }

  async createInvoice(){
    this.invoiceCreated = true;
    const discountAmount = this.orderForm.value.discountAmount ? this.orderForm.value.discountAmount : 0;
    const formattedInvoiceIssueDate = this.invoiceForm.value.invoiceIssueDate.split('-').reverse().join('.');
    
    const hasCompanyData = this.orderForm.value.company || this.orderForm.value.ico || this.orderForm.value.dic;
    const hasInvoiceCompanyData = this.invoiceForm.value.invoiceCompany || this.invoiceForm.value.invoiceICO || this.invoiceForm.value.invoiceDIC;

    const loadingSnack = this.snackBar.open('Sťahuje sa faktúra...', '', { duration: undefined });

    const companyRowHTML = hasCompanyData ? `
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #f8f9fa;">
          Spoločnosť, IČO, DIČ, IČ DPH
        </th>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">
          ${this.orderForm.value.company || 'Nie je zadané'}, 
          ${this.orderForm.value.ico || 'Nie je zadané'}, 
          ${this.orderForm.value.dic || 'Nie je zadané'}, 
          ${this.orderForm.value.icDph || 'Nie je zadané'}
        </td>
      </tr>
` : '';

    const invoiceCompanyRowHTML = hasInvoiceCompanyData ? `
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #f8f9fa;">
          Spoločnosť, IČO, DIČ, IČ DPH
        </th>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">
          ${ this.invoiceForm.value.invoiceCompany || 'Nie je zadané'}, 
          ${ this.invoiceForm.value.invoiceICO || 'Nie je zadané'}, 
          ${ this.invoiceForm.value.invoiceDIC || 'Nie je zadané'}
        </td>
      </tr>
` : '';
    if(this.invoiceForm.valid && this.orderForm.valid && this.selectedProducts.length > 0){
      const invoiceHTML = `
<div style="width: 100%; margin: 10px auto; box-sizing: border-box; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333;">
  <div style="background-color: #e4e4e4ff; padding: 8px; text-align: center; border-bottom: 1px solid #e0e0e0;">
    <h2 style="margin-top: 14px;">Číslo objednávky: <strong>${this.isEditMode ? this.existingOrderId : this.orderId}</strong></h2>
  </div>
  <div style="padding: 20px;">
    <div style="margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0; width: 40%;">Dátum vystavenia faktúry</th>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${formattedInvoiceIssueDate}</td>
        </tr>
        <tr>
          <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0;">Číslo faktúry</th>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${this.invoiceForm.value.invoiceNumber}</td>
        </tr>
        <tr>
          <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0;">Celkový počet produktov</th>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${this.selectedProducts.reduce((sum, product) => sum + product.productAmount, 0)} ks</td>
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
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e0e0e0;">Poštovné (${this.orderForm.get('deliveryOption').value}):</td>
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e0e0e0;">
              ${(this.orderForm.get('deliveryCost')?.value || 0).toFixed(2)} €
            </td>
          </tr>

          <tr>
            <td colspan="2" style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0;">Zvolený spôsob platby</td>
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e0e0e0;">Poplatok za platbu (${this.orderForm.get('paymentOption').value}):</td>
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e0e0e0;">
              ${(this.orderForm.get('paymentCost')?.value || 0).toFixed(2)} €
            </td>
          </tr>

          <tr>
            <td colspan="2" style="padding: 8px; text-align: left;">Celková cena objednávky</td>
            <td style="padding: 8px; font-weight: bold; text-align: center;">CELKOM:</td>
            <td style="padding: 8px; font-weight: bold; text-align: center;">
              ${
                this.orderForm.get('discountAmount')?.value > 0
                  ? (this.totalPrice.toFixed(2) + ' € <span style="color: #6c757d;">(zľava: -' + (this.orderForm.get('discountAmount')?.value || 0) + '%)</span>')
                  : (this.totalPrice.toFixed(2) + ' €')
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
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${this.orderForm.value.customerName}</td>
        </tr>
        ${companyRowHTML}
        <tr>
          <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">Adresa</th>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${this.orderForm.value.address}, ${this.orderForm.value.postalCode}, ${this.orderForm.value.city}</td>
        </tr>
        <tr>
          <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">E-mail</th>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${this.orderForm.value.email}</td>
        </tr>
        <tr>
          <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">Tel.č.</th>
          <td style="padding: 8px;">${this.orderForm.value.phoneNumber}</td>
        </tr>
      </table>
    </div>

    <div>
      <h3 style="margin-bottom: 10px; font-weight: bold;">Fakturačné údaje</h3>
      <table style="width: 100%; border: 1px solid #e0e0e0;">
        <tr>
          <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">Meno a priezvisko</th>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${this.invoiceForm.value.invoiceName}</td>
        </tr>
        ${invoiceCompanyRowHTML}
        <tr>
          <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">E-mail</th>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${this.invoiceForm.value.invoiceEmail}</td>
        </tr>
        <tr>
          <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">Tel.č.</th>
          <td style="padding: 8px;">${this.invoiceForm.value.invoicePhoneNumber}</td>
        </tr>
      </table>
    </div>
  </div>
</div>
`
      const orderIdForInvoice = this.isEditMode ? this.existingOrderId : this.orderId;
      const options = {
        margin: [5, 5, 5, 5],
        filename: `Faktúra_č${orderIdForInvoice}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: {unit: 'mm', format: 'a4', orientation: 'portrait'}
      };

      if(invoiceHTML){
        await html2pdf().set(options).from(invoiceHTML).save();
        setTimeout(() => {
          this.invoiceCreated = false;
        }, 2000);
        loadingSnack.dismiss();
        this.snackBar.open('Faktúra bola úspešne stiahnutá!', '', {duration: 2000});
      }
    }else{
      this.validateAllFormFields(this.invoiceForm);
      this.invoiceCreated = false;
      loadingSnack.dismiss();
      this.snackBar.open('Zadané údaje nie sú správne alebo polia označené hviezdičkou boli vynechané!', '', {duration: 2000});
    }
  }

  ngOnInit(): void {
    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');

    const invoiceIssueDate = now.toISOString().split('T')[0];

    this.invoiceForm.patchValue({
      invoiceIssueDate: invoiceIssueDate
    })
    
    this.existingOrderId = Number(this.route.snapshot.paramMap.get('orderId')) ?? null;

    this.loadOrderStatuses();

    if(this.existingOrderId){
      this.isEditMode = true;
      this.loadOrder(this.existingOrderId);
    }else{
      this.isEditMode = false;

      this.ephService.generatePackageCode().subscribe({
        next: (response) => {
          this.orderForm.patchValue({
            packageCode: response.packageCode
          })
        },
        error: (err) => console.error(err)
      })
    }

    this.onDeliveryChange();
    this.onPaymentChange();
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
  deliveryCost: number;
  paymentOption: string;
  paymentCost: number;
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
  orderSelected?: boolean;
  packageCode?: string;
}
export interface OrderStatusDTO {
  statusId?: number;
  statusName: string;
  sortOrder?: number;
  statusColor: string;
}