import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { ProductDTO, ProductService, ProductUpdateDTO } from '../services/product.service';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CustomPaginatorIntl } from '../services/custom-paginator-intl.service';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, MatPaginatorModule],
  providers: [DatePipe, { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.css'
})
export class ProductsPageComponent implements OnInit {
  currentDate: string = 'Načítava sa...';
  dialogRef!: MatDialogRef<any>; // ! tu znamena ze premenna bude urcite inicializovana predtym ako sa na nu pristupi to znamena ze v TS nebude hadzat chybu aj ked dialogRef nebola inicializovana v konstruktore, TS si mysli ze v nejakom bode kod zabezpeci aby dialogRef malo hodnotu pred pouzitim

  public productsData: ProductDTO[] = [];
  filteredProducts: ProductDTO[] = [];
  ourFilteredProducts: ProductDTO[] = [];
  
  isLoading: boolean = true;
  isLoadingForm: boolean = false;
  creationSuccessful: boolean = false;

  isVisibleAlphabetical: boolean = false;
  isVisiblePrice: boolean = false;

  searchText: string = '';
  searchOption: string = 'auto';
  filtrationCriteria: string = '';

  totalItems: number = 0;
  pageIndex: number = 0;
  pageSize: number = 10;

  editedProducts: { [productId: number]: { stockAmount?: number; productCode?: number }} = {};
  editingProductId?: number;

  isEditingProducts: boolean = false;
  isEditMode: boolean = false;
  
  hasShownEditingSnackbar = false;

  constructor(private datePipe: DatePipe, private dialog: MatDialog, private snackBar: MatSnackBar, private productService: ProductService){}

  productForm = new FormGroup({
    productName: new FormControl('', Validators.required),
    productDescription: new FormControl(''),
    productPrice: new FormControl('', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]),
    productWeight: new FormControl('', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]),
    stockAmount: new FormControl('', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]),
    productCode: new FormControl('', [Validators.pattern(/^\d+$/), Validators.min(0)]),
  });

  updatePagedProducts(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.ourFilteredProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  handlePageEvent(pageEvent: PageEvent){
    this.pageSize = pageEvent.pageSize;
    this.pageIndex = pageEvent.pageIndex;
    this.updatePagedProducts();
  }

  toggleDropdown(dropdown: 'alphabetical' | 'price'){
    if(dropdown === 'alphabetical'){
      this.isVisibleAlphabetical = !this.isVisibleAlphabetical;
    }else{
      this.isVisiblePrice = !this.isVisiblePrice;
    }
  }

  onProductFieldChange(productId: number, field: 'stockAmount' | 'productCode', newValue: any) {
    this.isEditingProducts = true;
    const value = Number(newValue);

    if (!this.editedProducts[productId]) {
      this.editedProducts[productId] = {};
    }
    this.editedProducts[productId][field] = value;

    if (!this.hasShownEditingSnackbar) {
      this.snackBar.open('Vstúpili ste do editačného režimu!', '', { duration: 1000 });
      this.hasShownEditingSnackbar = true;
    }
  }

  isProductEdited(productId: number, field: 'stockAmount' | 'productCode'): boolean {
    if (!this.editedProducts.hasOwnProperty(productId)) return false;
    if (!this.editedProducts[productId].hasOwnProperty(field)) return false;

    const originalProduct = this.productsData.find(p => p.productId === productId);
    if (!originalProduct) return false;

    return this.editedProducts[productId][field] !== originalProduct[field];
  }

  openEditDialog(editProductDialog: TemplateRef<any>, product: ProductDTO){
    this.isEditMode = true;
    this.editingProductId = product.productId;
    this.productForm.setValue({
      productName: product.productName || '',
      productDescription: product.productDescription || '',
      productPrice: product.productPrice?.toString() || '',
      productWeight: product.productWeight?.toString() || '',
      stockAmount: product.stockAmount?.toString() || '',
      productCode: product.productCode?.toString() || ''
    });

    this.dialogRef = this.dialog.open(editProductDialog, {
      autoFocus: false
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        this.productForm.reset();
        this.snackBar.open('Upravovanie produktu bolo zrušené.', '', { duration: 1000 });
      }
    })
  }

  updateProduct(productId: number) {
    if(!this.productForm.valid) {
      this.validateAllFormFields(this.productForm);
      this.snackBar.open('Zadané údaje nie sú správne alebo polia označené hviezdičkou boli vynechané!', '', {duration: 2000});
      return;
    }

    this.isLoadingForm = true;

    const updatedProduct: ProductUpdateDTO = {
      productId,
      productName: this.productForm.value.productName,
      productDescription: this.productForm.value.productDescription || '',
      productPrice: Number(this.productForm.value.productPrice),
      productWeight: this.productForm.value.productWeight ? Number(this.productForm.value.productWeight) : 0,
      stockAmount: this.productForm.value.stockAmount ? Number(this.productForm.value.stockAmount) : 0,
      productCode: this.productForm.value.productCode ? Number(this.productForm.value.productCode) : 0,
    }

    this.productService.updateProduct([updatedProduct]).subscribe({
      next: () => {
        this.snackBar.open('Produkt bol úspešne upravený.', '', { duration: 1000 });

        const index = this.productsData.findIndex(p => p.productId === productId);
        if(index !== -1){
          this.productsData[index] = {
            ...this.productsData[index],
            ...updatedProduct
          }
        }

        this.applyFilters();
        
        this.isLoadingForm = false;

        this.dialogRef.close(true);
        this.productForm.reset();
      },
      error: (err) => {
        console.error("Chyba pri úprave produktu:", err);
        this.snackBar.open('Chyba pri ukladaní zmien!', '', { duration: 2000 });
        this.isLoadingForm = false;
      }
    })
  }

  saveAllChanges() {
    const updates: ProductUpdateDTO[] = [];
    this.isLoading = true;

    for(const productIdStr in this.editedProducts) {
      const productId = Number(productIdStr);
      const edited = this.editedProducts[productId];
      const originalProduct = this.productsData.find(p => p.productId === productId);

      if(originalProduct){
        if(edited.stockAmount !== undefined){
          const stockAmount = Number(edited.stockAmount);
          if(isNaN(stockAmount) || stockAmount < 0){
            this.snackBar.open('Záporné alebo neplatné hodnoty pre sklad nie sú povolené!', '', { duration: 2500 });
            this.isLoading = false;
            return;
          }
        }

        if(edited.productCode !== undefined){
          const productCodeNum = Number(edited.productCode);
          if(isNaN(productCodeNum) || productCodeNum < 0){
            this.snackBar.open('Záporné alebo neplatné hodnoty pre kód produktu nie sú povolené!', '', { duration: 2500 });
            this.isLoading = false;
            return;
          }
        }

        let update: ProductUpdateDTO = { productId };
        
        if (edited.stockAmount !== undefined && Number(edited.stockAmount) !== Number(originalProduct.stockAmount)) {
          update.stockAmount = Number(edited.stockAmount);
        }
        if (edited.productCode !== undefined && Number(edited.productCode) !== Number(originalProduct.productCode)) {
          update.productCode = Number(edited.productCode);
        }
        if (update.stockAmount !== undefined || update.productCode !== undefined) {
          updates.push(update);
        }
      }
    }

    if(updates.length === 0) {
      this.snackBar.open('Nemáte žiadne zmeny na uloženie!', '', { duration: 1000 });
      this.isLoading = false;
      return;
    }

    this.productService.updateProduct(updates).subscribe({
      next: () => {
        this.snackBar.open('Zmeny boli úspešne uložené!', '', { duration: 1000 });

        for (const upd of updates) {
          const productInMainData = this.productsData.find(p => p.productId === upd.productId);
          const productInFilteredData = this.ourFilteredProducts.find(p => p.productId === upd.productId);
          if (productInMainData) {
            if (upd.stockAmount !== undefined) {
              productInMainData.stockAmount = upd.stockAmount;
            }
            if (upd.productCode !== undefined) {
              productInMainData.productCode = upd.productCode;
            }
          }
          if (productInFilteredData) { 
            if (upd.stockAmount !== undefined) {
              productInFilteredData.stockAmount = upd.stockAmount;
            }
            if (upd.productCode !== undefined) {
              productInFilteredData.productCode = upd.productCode;
            }
          }
        }

        this.editedProducts = {};
        this.isEditingProducts = this.hasShownEditingSnackbar = this.isLoading = false;
      },
      error: (err) => {
        console.error("Error saving changes:", err);
        this.snackBar.open('Chyba pri ukladaní zmien!', '', { duration: 2000 });
        this.isLoading = false; 
      }
    })
  }

  cancelEditing() {
    this.editedProducts = {};
    this.isEditingProducts = this.hasShownEditingSnackbar = false;
    this.snackBar.open('Úpravy boli zrušené!', '', { duration: 2000 });
  }
  
  applyFilters(criteria?: string): void {
    let filtered = [...this.productsData];
    const searchNormalized = this.removeDiacritics(this.searchText);

    if (searchNormalized.length > 0) {
      filtered = filtered.filter(product => {
        const productNameNormalized = this.removeDiacritics(product.productName);
        const productIdStr = product.productId.toString();
        const productCodeStr = product.productCode.toString();
        const productPriceStr = product.productPrice.toString();

        switch (this.searchOption) {
          case 'productName':
            return productNameNormalized.includes(searchNormalized);
          case 'productId':
            return productIdStr.startsWith(this.searchText);
          case 'productCode':
            return productCodeStr.startsWith(this.searchText);
          case 'productPrice':
            return productPriceStr.startsWith(this.searchText);
          case 'auto':
            return (
              productNameNormalized.includes(searchNormalized) ||
              productIdStr.startsWith(this.searchText) ||
              productCodeStr.startsWith(this.searchText) ||
              productPriceStr.startsWith(this.searchText)
            );
          default:
            return false;
        }
      });
    }

    if(criteria){
      if(criteria === 'alphabeticalAsc'){
        filtered.sort((a, b) => a.productName.localeCompare(b.productName));
      }else if(criteria === 'alphabeticalDesc'){
        filtered.sort((a, b) => b.productName.localeCompare(a.productName));
      }else if(criteria === 'priceAsc'){
        filtered.sort((a, b) => a.productPrice - b.productPrice);
      }else if(criteria === 'priceDesc'){
        filtered.sort((a, b) => b.productPrice - a.productPrice);
      }
      this.isVisibleAlphabetical = this.isVisiblePrice = false;
    }

    this.filteredProducts = filtered;
    this.totalItems = this.filteredProducts.length;
    this.pageIndex = 0;
    this.updatePagedProducts();
  }

  searchOrders(): void {
    this.applyFilters();
  }

  private removeDiacritics(str: string): string {
    return str 
    ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    : '';
  }

  sortProducts(criteria: 'alphabeticalAsc' | 'alphabeticalDesc' | 'priceAsc' | 'priceDesc'): void{
    this.applyFilters(criteria);;
  }

  createProduct(){
    if(this.productForm.valid){
      let product: ProductDTO = {
        productName: this.productForm.value.productName,
        productDescription: this.productForm.value.productDescription || '',
        productPrice: Number(this.productForm.value.productPrice),
        productWeight: Number(this.productForm.value.productWeight),
        stockAmount: Number(this.productForm.value.stockAmount),
        productCode: Number(this.productForm.value.productCode) 
      }

      this.isLoadingForm = true;

      this.productService.createProduct(product).subscribe((response) => {
        this.snackBar.open('Produkt bol úspešne vytvorený.', '', { duration: 1000 });
        this.creationSuccessful = true;
        this.productForm.reset();

        this.productService.getProducts().subscribe((result) => {
          this.productsData = result
          this.filteredProducts = [...this.productsData];
          this.totalItems = this.filteredProducts.length;
          this.updatePagedProducts();
        }, (error) => {
          console.error("An error have occurred while trying to get products data.", error);
        })

        this.isLoadingForm = false;

        this.dialogRef.close();
      }, (error) => {
        console.error(error);
      })
    }else{
      this.validateAllFormFields(this.productForm);
      this.snackBar.open('Zadané údaje nie sú správne alebo polia označené hviezdičkou boli vynechané!', '', {duration: 2000});
    }
  }

  openCreateDialog(createProductDialog: TemplateRef<any>){
    if(this.isEditingProducts) this.cancelEditing();
    
    this.creationSuccessful = this.isEditMode = false; 
    this.dialogRef = this.dialog.open(createProductDialog, {
        autoFocus: false
    });  
  
    this.dialogRef.afterClosed().subscribe((result) => {
      if(result){
        this.createProduct();
      }else if(!this.creationSuccessful){
        this.productForm.reset();
        this.snackBar.open('Vytváranie produktu bolo zrušené.', '', { duration: 1000 });
      }
    })
  }

  removeProduct(productId: number){
    this.isLoading = true;
    this.productService.removeProduct(productId).subscribe((response) => {
      if(response){
        const index = this.productsData.findIndex(p => p.productId === productId);
        if(index != -1){
          const index_1 = this.productsData.findIndex(p => p.productId === productId);

          if(index_1 != -1){
            this.productsData.splice(index_1, 1);
          }else{
            console.error("An error have occurred while trying to splice the productsData array.")
          }

          const index_2 = this.filteredProducts.findIndex(p => p.productId === productId);

          if(index_2 != -1){
            this.filteredProducts.splice(index_2, 1);
            this.pageIndex = 0;
            this.totalItems = this.filteredProducts.length;
            this.updatePagedProducts();
          }else{
            console.error("An error have occurred while trying to splice the filteredProducts array.")
          }

          this.snackBar.open('Produkt bol úspešne vymazaný!', '', { duration: 1000 });

          this.isLoading = false;
        }
      }
    }, (error) => {
      console.error("An error have occurred while trying to remove product.", error);
    })
  }

  validateAllFormFields(formGroup: FormGroup){
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if(control?.invalid){
        control.markAsTouched(); 
      }
    })
  }

  ngOnInit(): void {
    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');

    this.productService.getProducts().subscribe((result) => {
      this.productsData = result;
      this.filteredProducts = [...this.productsData]; 
      this.isLoading = false;
      this.pageIndex = 0;
      this.applyFilters();
      this.updatePagedProducts();
    }, (error) => {
      console.error("An error have occurred while trying to get products data", error);
    })
  }
}
