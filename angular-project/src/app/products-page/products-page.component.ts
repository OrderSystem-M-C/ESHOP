import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.css'
})
export class ProductsPageComponent implements OnInit {
  currentDate: string = '';
  dialogRef!: MatDialogRef<any>; // ! tu znamena ze premenna bude urcite inicializovana predtym ako sa na nu pristupi to znamena ze v TS nebude hadzat chybu aj ked dialogRef nebola inicializovana v konstruktore, TS si mysli ze v nejakom bode kod zabezpeci aby dialogRef malo hodnotu pred pouzitim

  public productsData: ProductDTO[] = [];
  filteredProducts: ProductDTO[] = [];
  
  isLoading: boolean = true;
  isLoadingForm: boolean = false;
  creationSuccessful: boolean = false;

  isVisibleAlphabetical: boolean = false;
  isVisiblePrice: boolean = false;

  constructor(private datePipe: DatePipe, private dialog: MatDialog, private snackBar: MatSnackBar, private productService: ProductService){}

  productForm = new FormGroup({
    productName: new FormControl('', Validators.required),
    productDescription: new FormControl(''),
    productPrice: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
    productWeight: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)])
  })

  toggleDropdown(dropdown: 'alphabetical' | 'price'){
    if(dropdown === 'alphabetical'){
      this.isVisibleAlphabetical = !this.isVisibleAlphabetical;
    }else{
      this.isVisiblePrice = !this.isVisiblePrice;
    }
  }

  sortProducts(criteria: 'alphabeticalAsc' | 'alphabeticalDesc' | 'priceAsc' | 'priceDesc'): void{
    if(criteria === 'alphabeticalAsc'){
      this.filteredProducts.sort((a, b) => a.productName.localeCompare(b.productName));
    }else if(criteria === 'alphabeticalDesc'){
      this.filteredProducts.sort((a, b) => b.productName.localeCompare(a.productName));
    }else if(criteria === 'priceAsc'){
      this.filteredProducts.sort((a, b) => b.productPrice - a.productPrice);
    }else if(criteria === 'priceDesc'){
      this.filteredProducts.sort((a, b) => a.productPrice - b.productPrice);
    }
    this.isVisibleAlphabetical = this.isVisiblePrice = false;
  }

  createProduct(){
    if(this.productForm.valid){
      let product: ProductDTO = {
        productName: this.productForm.value.productName,
        productDescription: this.productForm.value.productDescription || '',
        productPrice: Number(this.productForm.value.productPrice),
        productWeight: Number(this.productForm.value.productWeight)
      }

      this.isLoadingForm = true;

      this.productService.createProduct(product).subscribe((response) => {
        console.log(response);
        this.snackBar.open('Produkt bol úspešne vytvorený.', '', { duration: 1000 });
        this.creationSuccessful = true;
        this.productForm.reset();

        this.productService.getProducts().subscribe((result) => {
          this.productsData = result
          this.filteredProducts = [...this.productsData];
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
    this.dialogRef = this.dialog.open(createProductDialog);  
  
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
  productWeight: number,
  productSelected?: boolean;
}
