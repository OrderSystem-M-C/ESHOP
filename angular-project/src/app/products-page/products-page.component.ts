import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { ProductService, ProductUpdateDTO } from '../services/product.service';
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
  currentDate: string = '';
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
  pageSize: number = 6;

  editedProducts: { [productId: number]: { stockAmount?: number; productCode?: number }} = {};
  isEditingProducts: boolean = false;
  hasShownEditingSnackbar = false;

  constructor(private datePipe: DatePipe, private dialog: MatDialog, private snackBar: MatSnackBar, private productService: ProductService){}

  productForm = new FormGroup({
    productName: new FormControl('', Validators.required),
    productDescription: new FormControl(''),
    productPrice: new FormControl('', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]),
    productWeight: new FormControl('', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]),
    stockAmount: new FormControl('', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]),
    productCode: new FormControl('', [Validators.pattern(/^\d+(\.\d{1,2})?$/)])
  })

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
    return this.editedProducts.hasOwnProperty(productId) && this.editedProducts[productId].hasOwnProperty(field);
  }

  saveAllChanges() {
    const updates: ProductUpdateDTO[] = [];
    this.isLoading = true;

    for(const productIdStr in this.editedProducts) {
      const productId = Number(productIdStr);
      const edited = this.editedProducts[productId];
      const originalProduct = this.productsData.find(p => p.productId === productId);

      if(originalProduct){
        let update: ProductUpdateDTO = { productId };
        if (edited.stockAmount !== undefined && edited.stockAmount !== originalProduct.stockAmount) {
          update.stockAmount = edited.stockAmount;
        }
        if (edited.productCode !== undefined && edited.productCode !== originalProduct.productCode) {
          update.productCode = edited.productCode;
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

    if (this.searchText.length > 0) {
      filtered = filtered.filter(product => {
        switch (this.searchOption) {
          case 'productName':
            return product.productName.toLowerCase().includes(this.searchText.toLowerCase());
          case 'productId':
            return product.productId.toString().startsWith(this.searchText);
          case 'productCode':
            return product.productCode.toString().startsWith(this.searchText);
          case 'productPrice':
            return product.productPrice.toString().startsWith(this.searchText);
          case 'auto':
            return (
              product.productName.toLowerCase().includes(this.searchText.toLowerCase()) ||
              product.productId.toString().startsWith(this.searchText) ||
              product.productPrice.toString().startsWith(this.searchText)
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
        filtered.sort((a, b) => b.productPrice - a.productPrice);
      }else if(criteria === 'priceDesc'){
        filtered.sort((a, b) => a.productPrice - b.productPrice);
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

  openDialog(createProductDialog: TemplateRef<any>){
    this.creationSuccessful = false; 
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
      console.error("An error have occurred while trying to remove product.");
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
export interface ProductDTO {
  productId?: number;
  productName: string,
  productDescription?: string,
  productPrice: number,
  productWeight?: number,
  productSelected?: boolean;
  productAmount?: number;
  stockAmount?: number;
  productCode?: number;
}
