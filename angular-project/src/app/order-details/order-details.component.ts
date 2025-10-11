import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, OnInit, TemplateRef  } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrderDTO, OrderService } from '../services/order.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { ProductDTO, ProductService, ProductUpdateDTO } from '../services/product.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InvoiceService } from '../services/invoice.service';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [DatePipe, RouterLink, MatDialogModule, CommonModule, FormsModule, ReactiveFormsModule ],
  providers: [DatePipe],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css'
})
export class OrderDetailsComponent implements OnInit{
  @Input() order: OrderDTO | null = null;
  @Input() previewOrderId: number | null = null;
  orderId: number | null = null
  currentDate: string = 'Načítava sa...';

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

  dialogRef!: MatDialogRef<any>; //akoby pristupujeme k otvorenemu dialogovemu oknu aby sme mohli s nim komunikovať => získať samotný výsledok

  isLoading: boolean = true;

  selectedProducts: ProductDTO[] = [];

  editedProducts: { [productId: number]: { productPrice?: number }} = {};
  isEditingProducts: boolean = false;
  hasShownEditingSnackbar = false;

  constructor(
    private dialog: MatDialog, 
    private route: ActivatedRoute, 
    private router: Router, 
    private datePipe: DatePipe, 
    private orderService: OrderService, 
    private snackBar: MatSnackBar, 
    private productService: ProductService,
    private invoiceService: InvoiceService
  ){} /* private dialog: MatDialog => na otvaranie dialogovych okien atd */

  editOrder(){
    if(this.previewOrderId != null) {
      return;
    }
    this.router.navigate(['order-form', this.orderId]);
  }
  returnHome(){
    if(this.previewOrderId != null) {
      return;
    }
    this.router.navigate(['/orders-page']);
  }

  onProductFieldChange(productId: number, newValue: any) {
    this.isEditingProducts = true;
    const value = Number(newValue);

    if (!this.editedProducts[productId]) {
      this.editedProducts[productId] = {};
    }
    this.editedProducts[productId]['productPrice'] = value;

    if (!this.hasShownEditingSnackbar) {
      this.snackBar.open('Vstúpili ste do editačného režimu!', '', { duration: 1000 });
      this.hasShownEditingSnackbar = true;
    }
  }

  saveAllChanges() {
    const updates: ProductUpdateDTO[] = [];
    this.isLoading = true;
  
    for (const productIdStr of Object.keys(this.editedProducts)) {
      const productId = Number(productIdStr);
      const edited = this.editedProducts[productId];
      const originalProduct = this.selectedProducts.find(p => p.productId === productId);
  
      if(originalProduct){
        if(edited.productPrice!== undefined){
          const productPrice = Number(edited.productPrice);
          if(isNaN(productPrice) || productPrice < 0){
            this.snackBar.open('Záporné alebo neplatné hodnoty pre cenu nie sú povolené!', '', { duration: 2500 });
            this.isLoading = false;
            return;
          }
        }
  
        let update: ProductUpdateDTO = { productId };
          
        if (edited.productPrice !== undefined) {
          const editedPrice = Number(edited.productPrice);
          const originalPrice = Number(originalProduct.productPrice ?? 0);

          if (editedPrice !== originalPrice) {
            update.productPrice = editedPrice;
          }
        }

        if (update.productPrice !== undefined) {
          updates.push(update);
        }
      }
    }
  
    if(updates.length === 0) {
      this.snackBar.open('Nemáte žiadne zmeny na uloženie!', '', { duration: 1000 });
      this.isLoading = false;
      return;
    }
  
    this.productService.updateProductPrice(this.order.id, updates).subscribe({
      next: (response) => {
        this.snackBar.open('Zmeny boli úspešne uložené!', '', { duration: 1000 });
  
        for (const upd of updates) {
          const productInMainData = this.selectedProducts.find(p => p.productId === upd.productId);
          if (productInMainData) {
            if (upd.productPrice !== undefined) {
              productInMainData.productPrice = upd.productPrice;
            }
          }
        }

        this.order.totalPrice = response.totalPrice;
  
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

  isProductEdited(productId: number): boolean {
    if (!this.editedProducts.hasOwnProperty(productId)) return false;
    if (!this.editedProducts[productId].hasOwnProperty('productPrice')) return false;

    const originalProduct = this.selectedProducts.find(p => p.productId === productId);
    if (!originalProduct) return false;

    return this.editedProducts[productId]['productPrice'] !== originalProduct['productPrice'];
  }

  async getInvoice(){
    if (!this.order || !this.selectedProducts || this.selectedProducts.length === 0) {
      this.snackBar.open('Nie je možné vytvoriť faktúru – chýbajú údaje alebo produkty!', '', { duration: 3000 });
      return;
    }

    const loadingSnack = this.snackBar.open('Generuje sa faktúra...', '', { duration: undefined });

    try {
      await this.invoiceService.generateInvoice(this.order, this.selectedProducts);
      this.snackBar.open('Faktúra bola úspešne stiahnutá!', '', { duration: 2000 });
    } catch(err) {
      console.error(err);
      this.snackBar.open('Nastala chyba pri generovaní faktúry!', '', { duration: 3000 });
    } finally {
      loadingSnack.dismiss();
    }
  }

  removeOrder(confirmDialog: TemplateRef<any>){ //to vkladame ten dialog aby sme mohli s ním narábať
    if(this.previewOrderId != null) {
      return;
    }
    this.dialogRef = this.dialog.open(confirmDialog);  // Otvorí dialógové okno s potvrdením to áno/nie

    this.dialogRef.afterClosed().subscribe((result) => {
      if(result){
        this.isLoading = true;
        this.orderService.deleteOrder(this.order.id).subscribe((response: any) => {
          this.isLoading = false;
          this.router.navigate(['/orders-page']);
          this.snackBar.open('Objednávka bola úspešne odstránená!' ,'', {duration: 1000});
        }, (error) =>{
          this.isLoading = false
          console.error(error);
        })
      }else{
        this.snackBar.open('Vymazanie objednávky bolo zrušené!', '', { duration: 1000 });
      }
    })
  }

  calculateTotalAmount(): number {
    return this.selectedProducts.reduce((sum, product) => sum + product.productAmount, 0);
  }

  calculateTotalWeight(): number {
    return this.selectedProducts.reduce((sum, product) => sum + product.productWeight * product.productAmount, 0);
  }

  calculateBasePrice(): number {
    const productsTotal = this.selectedProducts.reduce((sum, product) => {
      return sum + product.productPrice * product.productAmount;
    }, 0);

    const deliveryCost = this.order?.deliveryCost || 0;
    const paymentCost = this.order?.paymentCost || 0;

    return productsTotal + deliveryCost + paymentCost;
  }

  ngOnInit(): void {
    const orderIdParam = this.route.snapshot.paramMap.get('orderId');
    this.orderId = orderIdParam ? parseInt(orderIdParam, 10): this.previewOrderId;

    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');

    this.orderService.getOrderDetails(this.orderId).subscribe((result) => {
      this.order = result;
      if(this.order){
        this.productService.getOrderProducts(this.order.id).subscribe((result) => {
          this.selectedProducts = result;
          
          this.isLoading = false;
        }, (error) => {
          console.error("An error occurred while trying to get products.", error);
        })
      }
    }, (error) =>{
      console.error("An error occurred while trying to get order details", error);
    })
  }
}