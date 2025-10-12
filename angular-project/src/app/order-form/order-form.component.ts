import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { OrderDTO, OrderService, OrderStatusDTO } from '../services/order.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ProductDTO, ProductService } from '../services/product.service';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CustomPaginatorIntl } from '../services/custom-paginator-intl.service';
import { EmailService } from '../services/email.service';
import { EphService, EphSettingsDTO } from '../services/eph.service';
import { catchError, finalize, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { CdkDrag, DragDropModule, moveItemInArray, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ManageStatusesDialogComponent } from '../manage-statuses-dialog/manage-statuses-dialog.component';
import { InvoiceService } from '../services/invoice.service';
import { SystemSettingsDTO, SystemSettingsService } from '../services/system-settings.service';
import { NgxIntlTelInputModule, CountryISO, SearchCountryField } from 'ngx-intl-tel-input';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [DatePipe, CommonModule, FormsModule, ReactiveFormsModule, MatSnackBarModule, NgClass, MatPaginatorModule, DragDropModule, CdkDrag, NgxIntlTelInputModule],
  providers: [DatePipe, OrderService, { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.css'
})
export class OrderFormComponent implements OnInit {
  currentDate: string = 'Načítava sa...';

  userMessage: string = '';
  charactersCount: number = 0;

  orderId: number | null = null;
  existingOrderId: number | null = null;

  preferredCountries: CountryISO[] = [
    CountryISO.Slovakia, CountryISO.CzechRepublic, CountryISO.Germany,
    CountryISO.Austria, CountryISO.Poland, CountryISO.Hungary, CountryISO.Switzerland
  ];

  CountryISO = CountryISO;
  SearchCountryField = SearchCountryField;

  fullPhoneNumber: string = '';
  fullInvoicePhoneNumber: string = '';

  readonly DEFAULTS = {
    email: 'nezadany@objednavky.local',
    customerName: 'Nezadany zakaznik',
    address: 'Nezadana adresa',
    city: 'Nezadane mesto',
    postalCode: '00000',
    phoneNumber: '0900000000',
    ico: '00000000',
    dic: '00000000',
    icdph: '00000'
  };

  invoiceCreated: boolean = false;

  isEditMode: boolean = false;
  isEditOrderStatus: boolean = false;
  
  isLoading: boolean = false;
  isLoadingEdit: boolean = false;
  isLoadingPackageCode: boolean = false;
  isLoadingStatuses: boolean = false;

  dialogRef!: MatDialogRef<any>;
  dialogClosed: boolean = true;

  productsData: ProductDTO[] = [];
  sortedProducts: ProductDTO[] = [];
  ourSortedProducts: ProductDTO[] = [];

  selectedProducts: ProductDTO[] = [];
  newSelectedProducts: ProductDTO[] = [];
  snapshotProducts: ProductDTO[] = [];

  searchText: string = ''; 
  searchOption: string = 'auto';

  isEditingProducts: boolean = false;

  totalPrice: number = 0;
  totalPriceCopy: number = 0;
  
  productsTotalPrice: number = 0; 

  calculatedDiscountAmount: number = 0; 
  calculatedDiscountPercent: number = 0;

  deliveryCost: number = 0;
  paymentCost: number = 0;

  totalItems: number = 0;
  pageIndex: number = 0;
  pageSize: number = 6;

  originalPackageCode: string = '';

  statuses: OrderStatusDTO[] = [];
  private originalStatusesOrder: OrderStatusDTO[] = [];

  ephSettings: EphSettingsDTO;
  systemSettings: SystemSettingsDTO;

  editedProducts: { [productId: number]: { productPrice?: number }} = {};
  isEditingProductPrices: boolean = false;
  hasShownEditingSnackbar: boolean = false;

  constructor(
    private datePipe: DatePipe, 
    private route: ActivatedRoute, 
    public orderService: OrderService, 
    private router: Router, 
    private snackBar: MatSnackBar, 
    private dialog: MatDialog, 
    private productService: ProductService, 
    private emailService: EmailService, 
    private ephService: EphService,
    private systemSettingsService: SystemSettingsService,
    private invoiceService: InvoiceService,
  ){}

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
    ico: new FormControl('', Validators.pattern(/^\d{8}$/)),
    dic: new FormControl('', Validators.pattern(/^\d{8,10}$/)),
    icdph: new FormControl('', [
      control => {
        const value = control.value;
        if (!value || value === this.DEFAULTS.icdph) return null;
        return /^[A-Z0-9]{8,12}$/.test(value) ? null : { invalidIcDph: true }; 
      }
    ]),
    address: new FormControl('', Validators.required),
    city: new FormControl('', Validators.required),
    postalCode: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
    email: new FormControl('', [Validators.required, this.emailValidator]),
    phoneNumber: new FormControl('', Validators.required),
    note: new FormControl(''),
    deliveryOption: new FormControl('', Validators.required),
    deliveryCost: new FormControl(0, [Validators.required, Validators.min(0)]),
    paymentOption: new FormControl('', Validators.required),
    paymentCost: new FormControl(0, [Validators.required, Validators.min(0)]),
    discountAmount: new FormControl(null, Validators.pattern('^[0-9]*$')),
    orderStatus: new FormControl('Nezpracované - nová objednávka'),
    packageCode: new FormControl('')
  });

  invoiceForm = new FormGroup({
    invoiceNumber: new FormControl<string>('000000', [
      Validators.required,
      Validators.pattern(/^\d+$/) 
    ]),
    invoiceVariable: new FormControl('000000', Validators.required),
    invoiceIssueDate: new FormControl('', Validators.required),
    invoiceName: new FormControl(''),
    invoiceCompany: new FormControl(''),
    invoiceICO: new FormControl('', Validators.pattern(/^\d{8}$/)),
    invoiceDIC: new FormControl('', Validators.pattern(/^\d{8,10}$/)),
    invoiceEmail: new FormControl('', [this.emailValidator]),
    invoicePhoneNumber: new FormControl(''),
  }, { validators: this.conditionalInvoiceValidator() });

  conditionalInvoiceValidator(): ValidatorFn {
    return (formGroup: AbstractControl): { [key: string]: any } | null => {
      const nameControl = formGroup.get('invoiceName');
      const emailControl = formGroup.get('invoiceEmail');
      const phoneControl = formGroup.get('invoicePhoneNumber');

      const nameValue = nameControl?.value?.trim() || '';
      const emailValue = emailControl?.value?.trim() || '';
      const phoneValue = phoneControl?.value?.number?.trim() || '';

      const isAnyFieldFilled = nameValue.length > 0 || emailValue.length > 0 || phoneValue.length > 0;

      let hasError = false;

      const setConditionalError = (control: AbstractControl | null) => {
        if(control) {
          control.setErrors({ requiredConditional: true });
          if (!control.touched) control.markAsTouched();
          if (!control.dirty) control.markAsDirty();
          hasError = true;
        }
      }
      const clearConditionalError = (control: AbstractControl | null) => {
        if(control && control.hasError('requiredConditional')) {
          control.setErrors(null);
        }
      };

      if(isAnyFieldFilled) {
        if(nameControl && nameValue.length === 0) {
          setConditionalError(nameControl);
        }else {
          clearConditionalError(nameControl)
        }

        if(emailControl && emailValue.length === 0) {
          setConditionalError(emailControl);
        }else {
          clearConditionalError(emailControl)
        }

        if(phoneControl) {
          if(phoneValue.length === 0) {
            setConditionalError(phoneControl);
          } else {
            clearConditionalError(phoneControl);
          }
        }

        return hasError ? { incompleteInvoiceContactData: true } : null;
      }else {
        clearConditionalError(nameControl);
        clearConditionalError(emailControl);
        clearConditionalError(phoneControl);

        if (formGroup.hasError('incompleteInvoiceContactData')) {
          return null; 
        }
      }
      return null;
    }
  }

  onPhoneNumberChange(value: any) {
    this.fullPhoneNumber = value?.nationalNumber || '';
  }
  onInvoicePhoneNumberChange(value: any) {
    this.fullInvoicePhoneNumber = value?.nationalNumber || '';
  }

  createOrderDTO(): OrderDTO {
    return {
      orderId: this.isEditMode ? this.existingOrderId : this.orderId,
      customerName: this.orderForm.value.customerName,
      company: this.orderForm.value.company || '',
      ico: this.orderForm.value.ico || '',
      dic: this.orderForm.value.dic || '',
      icdph: this.orderForm.value.icdph || '',
      address: this.orderForm.value.address,
      city: this.orderForm.value.city,
      postalCode: this.orderForm.value.postalCode,
      email: this.orderForm.value.email,
      phoneNumber: this.fullPhoneNumber || '', 
      note: this.orderForm.value.note || '',
      deliveryOption: this.orderForm.value.deliveryOption,
      deliveryCost: this.orderForm.value.deliveryCost,
      paymentOption: this.orderForm.value.paymentOption,
      paymentCost: this.orderForm.value.paymentCost,
      discountAmount: this.calculatedDiscountPercent || 0,
      orderStatus: this.orderForm.value.orderStatus,
      ...(this.isEditMode ? {} : {orderDate: this.currentDate}),
      packageCode: this.orderForm.value.packageCode,
      totalPrice: this.totalPrice,
      invoiceNumber: Number(this.invoiceForm.value.invoiceNumber),
      variableSymbol: this.invoiceForm.value.invoiceVariable,
      invoiceIssueDate: this.invoiceForm.value.invoiceIssueDate,
      invoiceName: this.invoiceForm.value.invoiceName || '',
      invoiceCompany: this.invoiceForm.value.invoiceCompany || '',
      invoiceICO: this.invoiceForm.value.invoiceICO || '',
      invoiceDIC: this.invoiceForm.value.invoiceDIC || '',
      invoiceEmail: this.invoiceForm.value.invoiceEmail || '',
      invoicePhoneNumber: this.fullInvoicePhoneNumber || '',
    };
  }

  loadOrderStatuses(): void {
    this.isLoadingStatuses = true;
    this.orderService.getOrderStatuses().pipe(
      finalize(() => this.isLoadingStatuses = false)
    ).subscribe({
      next: (response) => {
        this.statuses = response.map(s => ({ ...s }));
        this.originalStatusesOrder = response.map(s => ({ ...s }));
      },
      error: (err) => console.error(err)
    })
  }

  openManageStatusesDialog(): void {
    const dialogRef = this.dialog.open(ManageStatusesDialogComponent, {
      width: '1100px'
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
    moveItemInArray(this.statuses, event.previousIndex, event.currentIndex);
    this.statuses.forEach((status, index) => status.sortOrder = index);
  }

  get sortedStatuses(): OrderStatusDTO[] {
    return this.statuses.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  }

  saveStatusOrder(){
    this.isLoadingStatuses = true;
    this.orderService.saveOrderStatusesSortOrder(this.statuses).pipe(
      finalize(() => this.isLoadingStatuses = false)
    ).subscribe({
      next: () => {
        this.snackBar.open("Poradie stavov bolo úspešne zmenené!", "", {
          duration: 2000
        });
        this.originalStatusesOrder = this.sortedStatuses.map(s => ({ ...s }));
        this.loadOrderStatuses();
      },
      error: (err) => console.error(err)
    })
  }

  hasOrderChanged(): boolean {
    if(this.statuses.length !== this.originalStatusesOrder.length) return true;
    for(let i = 0; i < this.statuses.length; i++){
      if(this.statuses[i].statusId !== this.originalStatusesOrder[i].statusId) return true;
    }
    return false;
  }

  cancelEditOrderStatus(): void {
    this.statuses = this.originalStatusesOrder;
    this.isEditOrderStatus = false;
    this.snackBar.open("Úpravy poradia boli zrušené!", "", {
      duration: 2000
    });
  }
  
  trackByStatusId(index: number, status: OrderStatusDTO): number {
    return status.statusId;
  }

  trackByProductId(index: number, product: ProductDTO): number {
    return product.productId;
  }

  searchProducts() {
    let filtered = [...this.productsData];
    const searchNormalized = this.removeDiacritics(this.searchText.trim().toLowerCase());

    if(searchNormalized.length > 0){
      filtered = filtered.filter(product => {
        const productNameNormalized = this.removeDiacritics(product.productName.toLowerCase());
        const productIdStr = product.productId.toString();
        const productCodeStr = product.productCode.toString();
        const productPriceStr = product.productPrice.toString();
        switch (this.searchOption) {
          case 'productName':
            return productNameNormalized.includes(searchNormalized);
          case 'productId':
            return productIdStr.startsWith(searchNormalized);
          case 'productCode':
            return productCodeStr.startsWith(this.searchText);
          case 'productPrice':
            return productPriceStr.startsWith(searchNormalized);
          case 'auto':
            return (
              productNameNormalized.includes(searchNormalized) ||
              productIdStr.startsWith(searchNormalized) ||
              productCodeStr.startsWith(this.searchText) ||
              productPriceStr.startsWith(searchNormalized)
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

  private removeDiacritics(str: string): string {
    return str
      ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      : '';
  }

  public getActiveProducts(): ProductDTO[] {
    return this.isEditMode ? this.newSelectedProducts : this.selectedProducts;
  }

  public getOriginalProducts(): ProductDTO[] {
    return this.snapshotProducts;
  }

  onProductFieldChange(productId: number, newValue: any) {
    const value = Number(newValue);

    if (!this.isEditingProductPrices) {
      this.snapshotProducts = this.getActiveProducts().map(p => ({ ...p }));
      this.isEditingProductPrices = true;
    }

    if (!this.editedProducts[productId]) {
      this.editedProducts[productId] = {};
    }
    this.editedProducts[productId]['productPrice'] = value;

    const targetArray = this.getActiveProducts();

    const productToUpdate = targetArray.find(product => product.productId === productId);
    if (productToUpdate) {
      productToUpdate.productPrice = value;
    }

    this.recalculateTotalPrice();

    if (!this.hasShownEditingSnackbar) {
      this.snackBar.open('Vstúpili ste do editačného režimu!', '', { duration: 1000 });
      this.hasShownEditingSnackbar = true;
    }
  }

  cancelEditing() {
    this.isEditingProductPrices = this.hasShownEditingSnackbar = false;

    if (this.isEditMode) {
      this.newSelectedProducts = this.snapshotProducts.map(p => ({ ...p }));
    } else {
      this.selectedProducts = this.snapshotProducts.map(p => ({ ...p }));
    }

    this.editedProducts = {};
    this.recalculateTotalPrice();
    this.snackBar.open('Úpravy boli zrušené!', '', { duration: 2000 });
  }

  isProductEdited(productId: number): boolean {
    if (!this.editedProducts.hasOwnProperty(productId)) return false;
    if (!this.editedProducts[productId].hasOwnProperty('productPrice')) return false;

    const originalProduct = this.selectedProducts.find(p => p.productId === productId);
    if (!originalProduct) return false;

    return this.editedProducts[productId]['productPrice'] !== originalProduct['productPrice'];
  }

  isProductSelected(product: ProductDTO): boolean {
    const targetArray = this.isEditMode ? this.newSelectedProducts : this.selectedProducts;
    return targetArray.some(p => p.productId === product.productId);
  }

  openDialog(selectProductsDialog: TemplateRef<any>, edit: boolean | null){
    this.dialogClosed = false;
    this.isLoading = true;

    const activeProducts = this.getActiveProducts();
    this.snapshotProducts = JSON.parse(JSON.stringify(this.getActiveProducts()));

    const hadNoProductsBefore = this.selectedProducts.length === 0;

    this.dialogRef = this.dialog.open(selectProductsDialog, {
      disableClose: true
    });
    
    this.productService.getProducts().subscribe((result) => {
      this.productsData = result.map(product => ({
        ...product,
        productAmount: 1,
        productSelected: activeProducts.some(p => p.productId === product.productId)
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
        this.snackBar.open('Výber produktov bol úspešne zmenený!', '', { duration: 1500 });
      } else if (result === false) {
        if (hadNoProductsBefore && this.selectedProducts.length > 0) {
          this.snackBar.open('Produkty boli úspešne pridané!', '', { duration: 1500 });
        } else {
          this.snackBar.open('Výber produktov bol upravený!', '', { duration: 1500 });
        }
      } else {
        this.snackBar.open('Výber produktov bol zrušený!', '', { duration: 1500 });
        if (this.isEditMode) {
          this.newSelectedProducts = this.snapshotProducts;
        } else {
          this.selectedProducts = this.snapshotProducts;
        }
      }
      this.recalculateTotalPrice();
    });
  }
  toggleProductSelection(product: ProductDTO) {
    const targetArray = this.getActiveProducts();
    const index = targetArray.findIndex(p => p.productId === product.productId);

    if (index !== -1) {
        targetArray.splice(index, 1);
    } else {
        targetArray.push({ ...product });
    }

    this.recalculateTotalPrice();
  }
  confirmSelection() {
    const activeProducts = this.getActiveProducts();
    if(activeProducts.length >= 0){
      this.dialogRef.close(false);
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
    const active = this.getActiveProducts();
    const original = this.getOriginalProducts();

    if (active.length !== original.length) return true;

    const sortedActive = [...active].sort((a,b) => a.productId - b.productId);
    const sortedOriginal = [...original].sort((a,b) => a.productId - b.productId);

    for (let i = 0; i < sortedActive.length; i++) {
      if (sortedActive[i].productId !== sortedOriginal[i].productId) return true;
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

  removeProduct(productId: number): void {
    const targetArray = this.isEditMode ? this.newSelectedProducts : this.selectedProducts;
    const index = targetArray.findIndex(p => p.productId === productId);

    if (index !== -1) {
      this.totalPrice -= targetArray[index].productAmount * targetArray[index].productPrice;
      targetArray.splice(index, 1);
      this.snackBar.open('Produkt bol odstránený!', '', { duration: 1500 });
    }
  }

  clearProducts(): void {
    this.newSelectedProducts = [];
    this.selectedProducts = [];
    this.editedProducts = {};

    if(this.isEditMode) {
      this.newSelectedProducts = [...this.newSelectedProducts];
    } else {
      this.selectedProducts = [...this.selectedProducts];
    }

    this.recalculateTotalPrice();

    this.snackBar.open('Vaše zvolené produkty boli úspešne premazané!', '', { duration: 2000 });
  }

  updateAmount(productId: number, productAmount: number) {
    if (productAmount <= 0) return;

    const targetArray = this.getActiveProducts();
    const product = targetArray.find(p => p.productId === productId);

    if (product) {
      product.productAmount = productAmount;
      this.recalculateTotalPrice();
    }
  }

  updateCost(optionType: 'delivery' | 'payment'): void {
    if(optionType === 'delivery') {
      const deliveryOption = this.orderForm.get('deliveryOption')?.value;
      this.orderForm.patchValue({ deliveryCost: deliveryOption === 'Kuriér' || deliveryOption === 'Zahraničie' ? this.systemSettings.deliveryFee : 0 });
    } else {
      const paymentOption = this.orderForm.get('paymentOption')?.value;
      this.orderForm.patchValue({ paymentCost: paymentOption === 'Hotovosť' ? this.systemSettings.paymentFee : 0 });
    }
    this.recalculateTotalPrice();
  }

  recalculateTotalPrice(): void {
    const targetArray = this.isEditMode ? this.newSelectedProducts : this.selectedProducts;

    let productsTotal = 0;
    targetArray.forEach(product => {
      productsTotal += (product.productPrice * product.productAmount);
    });
    this.productsTotalPrice = productsTotal; 

    let currentDeliveryCost = 0;
    let currentPaymentCost = 0;

    if (this.orderForm.get('deliveryOption')?.value === 'Kuriér' || this.orderForm.get('deliveryOption')?.value === 'Zahraničie') {
      currentDeliveryCost = this.orderForm.get('deliveryCost')?.value || 0;
    }
    this.deliveryCost = currentDeliveryCost;

    if (this.orderForm.get('paymentOption')?.value === 'Hotovosť') {
      currentPaymentCost = this.orderForm.get('paymentCost')?.value || 0;
    }
    this.paymentCost = currentPaymentCost;

    const discountAmount = this.orderForm.get('discountAmount')?.value || 0;
    let currentTotal = this.productsTotalPrice + this.deliveryCost + this.paymentCost;

    this.calculatedDiscountAmount = discountAmount;
    this.calculatedDiscountPercent = currentTotal > 0 
    ? (discountAmount / currentTotal) * 100
    : 0;

    this.totalPrice = currentTotal - discountAmount;

    if (this.totalPrice < 0) {
      this.totalPrice = 0;
    }

    this.totalPriceCopy = currentTotal;
  }

  async updateOrder() {
    this.isLoading = true;

    const orderStatus = this.orderForm.get('orderStatus')?.value;
    const packageCodeControl = this.orderForm.get('packageCode');
    const packageCode = packageCodeControl?.value;

    if (orderStatus === 'Zasielanie čísla zásielky' && !packageCode) {
      packageCodeControl?.setErrors({ required: true });
      packageCodeControl?.markAsTouched();
      this.snackBar.open(
        'Pre tento stav objednávky je potrebné zadať podacie číslo!',
        '',
        { duration: 3000 }
      );
      this.isLoading = false;
      return;
    } else {
      packageCodeControl?.setErrors(null);
    }

    if (packageCode?.trim()) {
      const isValid = await this.validatePackageCodeForSubmit(this.orderForm.value.packageCode).toPromise();
      if (!isValid) {
        this.isLoading = false;
        return;
      }
    }

    this.fillDefaultValues();

    const arrayChanged = this.checkChanges(this.selectedProducts, this.newSelectedProducts);

    setTimeout(() => {
      if (this.orderForm.valid && this.invoiceForm.valid && this.newSelectedProducts.length > 0) {
        if (this.orderForm.pristine && !arrayChanged) {
          return this.showSnack('Nebola vykonaná žiadna zmena v objednávke!', 1500);
        }

        const order = this.createOrderDTO();

        if (order.orderStatus === 'Zasielanie čísla zásielky' && !order.packageCode?.trim()) {
          const packageCodeControl = this.orderForm.get('packageCode');
          packageCodeControl?.setErrors({ invalid: true });
          packageCodeControl?.markAsTouched();
          return this.showSnack('Pre odoslanie e-mailu je potrebné zadať podacie číslo!');
        }

        this.invoiceCreated = true;

        this.orderService.updateOrder(this.existingOrderId, order).subscribe({
          next: (response) => {
            if (arrayChanged) {
              this.productService.updateOrderProducts(response.body.id, this.newSelectedProducts).subscribe({
                next: (resp: HttpResponse<boolean>) => {
                  if (resp.status === 200 || resp.status === 204) {
                    this.checkOrderStatusAndSendEmails(order);
                    this.showSuccessAndNavigate('Objednávka bola úspešne upravená!');
                  }
                },
                error: (err) => this.handleError("An error occurred while trying to update order products", err)
              });
            } else {
              this.checkOrderStatusAndSendEmails(order);
              this.showSuccessAndNavigate('Objednávka bola úspešne upravená!');
            }
          },
          error: (err) => this.handleError("An error occurred while trying to update order", err)
        });
      } else if (this.orderForm.invalid || this.invoiceForm.invalid) {
        this.validateAllFormFields(this.orderForm);
        this.validateAllFormFields(this.invoiceForm);
        this.showSnack('Zadané údaje nie sú správne alebo polia označené hviezdičkou boli vynechané!');
      } else if (this.selectedProducts.length === 0) {
        this.showSnack('Neboli zvolené žiadne produkty!');
      }
    }, 100);
  }

  private showSnack(msg: string, duration: number = 3000) {
    this.snackBar.open(msg, '', { duration });
    this.isLoading = false;
  }

  private showSuccessAndNavigate(msg: string) {
    this.snackBar.open(msg, '', { duration: 2000 });
    this.router.navigate(['/orders-page']);
    this.isLoading = false;
  }

  private handleError(context: string, err: any) {
    console.error(context, err);
    this.isLoading = false;
  }

  private fillDefaultValues() {
    const fields = ['email', 'customerName', 'address', 'city', 'postalCode', 'phoneNumber'];

    if (this.orderForm.get('company')?.value) {
      ['ico', 'dic', 'icdph'].forEach(field => {
        const control = this.orderForm.get(field);
        if (!control?.value || control.value.trim() === '') {
          control.setValue(this.DEFAULTS[field]);
        }
      });
    }

    if (this.invoiceForm.get('invoiceCompany')?.value) {
      ['invoiceICO', 'invoiceDIC'].forEach(field => {
        const control = this.invoiceForm.get(field);
        if (!control?.value || control.value.trim() === '') {
          const defaultField = field.replace('invoice', '').toLowerCase(); 
          control.setValue(this.DEFAULTS[defaultField]);
        }
      });
    }

    fields.forEach(field => {
      const control = this.orderForm.get(field);
      if (!control?.value || ('' + control.value).trim() === '') {
        control.setValue(this.DEFAULTS[field]);
      }
    });
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

  loadOrder(orderId: number) {
    this.isLoadingEdit = true;

    this.orderService.getOrderDetails(orderId).pipe(
      switchMap(order => forkJoin({
        order: of(order),
        products: this.productService.getOrderProducts(order.id)
      }))
    ).subscribe(({ order, products }) => {
      this.orderForm.patchValue(order);

      ['phoneNumber', 'invoicePhoneNumber'].forEach(field => {
        const control = this.orderForm.get(field);
        if (control?.value) control.markAsTouched();
      });

      this.userMessage = order.note;
      this.charactersCount = this.userMessage.length;

      this.originalPackageCode = order.packageCode;

      this.totalPrice = order.totalPrice;

      this.invoiceForm.patchValue({
        invoiceNumber: String(order.invoiceNumber),
        invoiceVariable: order.variableSymbol,
        invoiceIssueDate: order.invoiceIssueDate,
        invoiceName: order.invoiceName,
        invoiceCompany: order.invoiceCompany,
        invoiceICO: order.invoiceICO,
        invoiceDIC: order.invoiceDIC,
        invoiceEmail: order.invoiceEmail,
        invoicePhoneNumber: order.invoicePhoneNumber,
      });

      this.selectedProducts = products;
      this.newSelectedProducts = JSON.parse(JSON.stringify(products));

      const productsTotal = this.newSelectedProducts.reduce(
        (sum, p) => sum + p.productPrice * p.productAmount, 0
      );

      const totalBeforeDiscount = productsTotal + order.deliveryCost + order.paymentCost;

      const discountAmountInEuro = Math.round((totalBeforeDiscount * order.discountAmount) / 100);

      this.orderForm.patchValue({
        discountAmount: discountAmountInEuro
      });

      this.totalPriceCopy = this.isEditMode ? totalBeforeDiscount : order.totalPrice;

      this.recalculateTotalPrice();
      this.isLoadingEdit = false;
    }, error => {
      console.error('Error loading order', error);
      this.isLoadingEdit = false;
    });
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

    const orderStatus = this.orderForm.get('orderStatus')?.value;
    const packageCodeControl = this.orderForm.get('packageCode');
    const packageCode = packageCodeControl?.value;

    if (orderStatus === 'Zasielanie čísla zásielky' && !packageCode) {
      this.orderForm.get('packageCode')?.setErrors({ required: true });
      this.orderForm.get('packageCode')?.markAsTouched();
      return this.showSnack('Pre tento stav objednávky je potrebné zadať podacie číslo!'); 
    }else{
      packageCodeControl?.setErrors(null);
    }

    if(packageCode?.trim()){
      const isValid = await this.validatePackageCodeForSubmit(this.orderForm.value.packageCode).toPromise();
      if(!isValid){
        this.isLoading = false;
        return;
      }
    }

    this.fillDefaultValues();

    this.orderForm.get('packageCode')?.setErrors(null);

    setTimeout(() => {
      if(this.orderForm.valid && this.invoiceForm.valid && this.selectedProducts.length > 0){
        let order = this.createOrderDTO();

        if(order.orderStatus === 'Zasielanie čísla zásielky'){
          if(!order.packageCode || order.packageCode.trim() === ''){
              packageCodeControl?.setErrors({ invalid: true });
              packageCodeControl?.markAsTouched();
              return this.showSnack('Pre odoslanie e-mailu je potrebné zadať podacie číslo!');
          }
        }

        this.orderService.createOrder(order).subscribe({
          next: (response: OrderDTO) => {
            if (!response) {
              this.checkOrderStatusAndSendEmails(order);
              this.isLoading = false;
              return;
            }

            this.productService.addProductsToOrder(response.id, this.selectedProducts).subscribe({
              next: (res) => {
                if (res.status === 204 || res.status === 200) {
                  this.checkOrderStatusAndSendEmails(order);

                  if (!this.invoiceCreated) {
                    this.downloadInvoice();
                  } else {
                    this.showSnack('Objednávka bola úspešne vytvorená!', 1500);
                  }

                  this.router.navigate(['/orders-page']);
                } else {
                  console.warn('Unexpected status:', res.status);
                }

                this.isLoading = false;
              },
              error: (err) => this.handleError('An error has occurred while trying to add products to order', err)
            });
          },
          error: (err) => this.handleError('An error occurred while trying to create order', err)
        });
      }else if(this.selectedProducts.length === 0) {
        const element = document.getElementById('selected-products-id');
        element.scrollIntoView({behavior: 'smooth', block: 'start'});
        this.showSnack('Nemáte zvolené produkty pre túto objednávku!');
      }else if(this.orderForm.invalid || this.invoiceForm.invalid){
        this.validateAllFormFields(this.orderForm);
        this.validateAllFormFields(this.invoiceForm);
        this.showSnack('Zadané údaje nie sú správne alebo polia označené hviezdičkou boli vynechané!');
      }
    }, 100);
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

  checkPackageCodeFormat(code: string): boolean {
    let trackingPattern: RegExp;

    if (this.ephSettings && this.ephSettings.ephPrefix && this.ephSettings.ephSuffix) {
        trackingPattern = new RegExp(`^(${this.ephSettings.ephPrefix})\\d{9}(${this.ephSettings.ephSuffix})$`);
    } else {
        trackingPattern = /^[A-Z]{2}\d{9}[A-Z]{2}$/;
    }

    const result = trackingPattern.test(code);

    if (!result) {
      this.snackBar.open('Zadané podacie číslo nie je v správnom formáte!', '', { duration: 2000 });
      this.orderForm.get('packageCode')?.setErrors({ invalidFormat: true });
      return false;
    }
    this.orderForm.get('packageCode')?.setErrors(null);
    return true;
  }

  validatePackageCode(packageCode: string): void {
    this.isLoadingPackageCode = true;

    this.orderForm.get('packageCode')?.markAsTouched();

    if(!packageCode){
      this.orderForm.get('packageCode')?.setErrors({ required: true });
      this.snackBar.open('Podacie číslo nebolo zadané!', '', { duration: 2000 });
      this.isLoadingPackageCode = false;
      return;
    }

    if (this.isEditMode && packageCode === this.originalPackageCode) {
      this.orderForm.get('packageCode')?.setErrors(null);
      this.snackBar.open('Podacie číslo ostáva nezmenené a je platné!', '', { duration: 2000 });
      this.isLoadingPackageCode = false;
      return;
    }

    if (!this.checkPackageCodeFormat(packageCode)) {
      this.isLoadingPackageCode = false;
      return;
    }

    this.ephService.validatePackageCode(packageCode)
      .pipe(finalize(() => this.isLoadingPackageCode = false))
      .subscribe({
        next: (response) => {
          setTimeout(() => {
            if(response.valid){
              this.orderForm.get('packageCode')?.setErrors(null);
              this.snackBar.open(response.message || 'Podacie číslo je platné a dostupné!', '', { duration: 2000 });
            }else{
              this.orderForm.get('packageCode')?.setErrors({ invalid: true });
              this.snackBar.open(response.message || 'Neznáma chyba pri validácií podacieho čísla!', '', { duration: 2000 });
            }
          }, 0);
        },
        error: (err) => {
          setTimeout(() => {
            const msg = err?.error?.message || 'Neznáma chyba pri validácií podacieho čísla!';
            this.orderForm.get('packageCode')?.setErrors({ invalid: true });
            this.snackBar.open(msg, '', { duration: 2000 });
          }, 0);
        }
    })
  }

  validatePackageCodeForSubmit(packageCode: string): Observable<boolean> {
    if(this.isEditMode && packageCode === this.originalPackageCode) {
      this.orderForm.get('packageCode')?.setErrors(null);
      return of(true);
    }

    if (!this.checkPackageCodeFormat(packageCode)) {
      this.isLoadingPackageCode = false;
      return of(false);
    }

    const orderId = this.isEditMode ? this.existingOrderId : undefined;

    return this.ephService.validatePackageCode(packageCode, orderId).pipe(
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

  generatePackageCode(){
    this.isLoadingPackageCode = true;
    this.ephService.generatePackageCode().pipe(
      finalize(() => this.isLoadingPackageCode = false)
    ).subscribe({
      next: (response) => {
        this.orderForm.patchValue({
          packageCode: response.packageCode
        });

        this.snackBar.open("Podacie číslo bolo úspešne vygenerované!", "", { duration: 2000 });
      },
      error: (err: HttpErrorResponse) => {
        const backendError = err.error; 

        if (backendError?.error === "NO_CODES_LEFT") {
          this.snackBar.open(backendError.message, "", { duration: 3000 });
        } else {
          this.snackBar.open("Nastala chyba pri generovaní podacieho čísla!", "", { duration: 3000 });
        }

        this.orderForm.patchValue({
          packageCode: ''
        });

        console.error("Package code generation error:", err);
      }
    });
  }

  async downloadInvoice(){
    if (this.selectedProducts.length === 0) {
      this.snackBar.open('Zabudli ste na výber produktov!', '', { duration: 3000 });
      return;
    }

    if (!this.orderForm.valid || !this.invoiceForm.valid){
      this.validateAllFormFields(this.orderForm);
      this.validateAllFormFields(this.invoiceForm);
      this.snackBar.open(
        'Zadané údaje nie sú správne alebo polia označené hviezdičkou boli vynechané!',
        '', 
        { duration: 3000 }
      );
      return;
    }

    this.invoiceCreated = true;
    const loadingSnack = this.snackBar.open('Generuje sa faktúra...', '', { duration: undefined });

    try {
      const orderData = this.createOrderDTO();

      await this.invoiceService.generateInvoice(orderData, this.selectedProducts);
      this.snackBar.open('Faktúra bola úspešne stiahnutá!', '', { duration: 2000 });
    } catch (err) {
      console.error(err);
      this.snackBar.open('Nastala chyba pri generovaní faktúry!', '', { duration: 2000 });
    } finally {
      this.invoiceCreated = false;
      loadingSnack.dismiss();
    }
  }

  ngOnInit(): void {
    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');

    const invoiceIssueDate = now.toISOString().split('T')[0];

    this.invoiceForm.patchValue({ invoiceIssueDate: invoiceIssueDate })
    
    this.existingOrderId = Number(this.route.snapshot.paramMap.get('orderId')) ?? null;
    this.isEditMode = !!this.existingOrderId;

    this.isLoading = true;

    this.loadOrderStatuses();

    forkJoin({
      ephSettings: this.ephService.getEphSettings(),
      systemSettings: this.systemSettingsService.getSystemSettings(),
      orderId: this.orderService.generateOrderId()
    }).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ({ ephSettings, systemSettings, orderId }) => {
        this.ephSettings = ephSettings;
        this.systemSettings = systemSettings;
        this.orderId = orderId;

        this.orderForm.patchValue({
          deliveryCost: systemSettings.deliveryFee,
          paymentCost: systemSettings.paymentFee
        });

        if (!this.isEditMode) {
          this.invoiceForm.patchValue({
            invoiceNumber: String(this.orderId),
            invoiceVariable: String(this.orderId)
          });
        }
      },
      error: (err) => console.error("An error has occurred:", err)
    })

    if (this.isEditMode) {
      this.loadOrder(this.existingOrderId);
    }
  }
}