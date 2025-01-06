import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';

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

  constructor(private datePipe: DatePipe, private dialog: MatDialog){}

  productForm = new FormGroup({
    productName: new FormControl('', Validators.required),
    productDescription: new FormControl(''),
    productPrice: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
    productWeight: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)])
  })

  createProduct(createProductDialog: TemplateRef<any>){ //to vkladame ten dialog aby sme mohli s ním narábať
    this.dialogRef = this.dialog.open(createProductDialog);  // Otvorí dialógové okno s potvrdením to áno/nie
  
    this.dialogRef.afterClosed().subscribe((result) => {
      if(result){
        console.log('hi :D')
      }else{
        this.productForm.reset();
      }
    })
  }

  ngOnInit(): void {
    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');
  }
}
export interface ProductDTO {
  productName: string,
  productDescription?: string,
  productPrice: number,
  productWeight: number,
}
