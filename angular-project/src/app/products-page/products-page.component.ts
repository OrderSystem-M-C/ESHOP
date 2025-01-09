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
  dialogRef!: MatDialogRef<any>;

  public productsData: ProductDTO[] = [];
  
  isLoading: boolean = true;

  constructor(private datePipe: DatePipe, private dialog: MatDialog, private snackBar: MatSnackBar, private productService: ProductService){}

  productForm = new FormGroup({
    productName: new FormControl('', Validators.required),
    productDescription: new FormControl(''),
    productPrice: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
    productWeight: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)])
  })

  createProduct(){
    if(this.productForm.valid){
      let product: ProductDTO = {
        productName: this.productForm.value.productName,
        productDescription: this.productForm.value.productDescription || '',
        productPrice: Number(this.productForm.value.productPrice),
        productWeight: Number(this.productForm.value.productWeight)
      }

      this.productService.createProduct(product).subscribe((response) => {
        console.log(response);
        this.snackBar.open('Produkt bol úspešne vytvorený.', '', { duration: 1000 });
        this.productForm.reset();

        this.productService.getProducts().subscribe((result) => {
          this.productsData = result
        }, (error) => {
          console.error("An error have occurred while trying to get products data.", error);
        })

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
    this.dialogRef = this.dialog.open(createProductDialog);  
  
    this.dialogRef.afterClosed().subscribe((result) => {
      if(result){
        this.createProduct();
      }else{
        this.productForm.reset();
        this.snackBar.open('Vytváranie produktu bolo zrušené.', '', { duration: 1000 });
      }
    })
  }

  removeProduct(productId: number){
    this.productService.removeProduct(productId).subscribe((response) => {
      console.log(response);
      const index = this.productsData.findIndex(p => p.productId === productId);
      if(index != -1){
        this.productsData.splice(index, 1);
        this.snackBar.open('Produkt bol úspešne vymazaný!', '', { duration: 1000 });
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
      this.productsData = result
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
}
