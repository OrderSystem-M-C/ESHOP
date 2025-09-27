import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { OrderDTO, OrderService, OrderStatusDTO } from '../services/order.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CustomPaginatorIntl } from '../services/custom-paginator-intl.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthenticationService } from '../authentication/authentication.service';
import { EmailService } from '../services/email.service';
import { catchError, EMPTY, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { OrderDetailsComponent } from '../order-details/order-details.component';
import { HttpErrorResponse } from '@angular/common/http';
import { InvoiceService } from '../services/invoice.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, CommonModule, FormsModule, MatPaginatorModule, OrderDetailsComponent],
  providers: [DatePipe, { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss'
})
export class OrdersPageComponent implements OnInit, AfterViewInit, OnDestroy {
  ordersData: OrderDTO[] = [];
  filteredOrders = [...this.ordersData];
  ourFilteredOrders: OrderDTO[] = [];

  statuses: OrderStatusDTO[] = [];

  selectedStatuses: string[] = [];

  currentDate: string = 'Načítava sa...';

  isLoading: boolean = true;
  
  dropdownState: { [key: string]: boolean } = {
    status: false,
    date: false,
    price: false,
    name: false,
    changeStatus: false
  }

  sortConfig = {
    field: null as 'date' | 'price' | 'name' | null,
    order: null as 'asc' | 'desc' | 'newest' | 'oldest' | null
  }

  searchText: string = '';
  searchOption: string = 'auto';

  totalItems: number = 0;
  pageIndex: number = 0;
  pageSize: number = 10;

  selectedOrders: OrderDTO[] = [];

  hoveredOrder: OrderDTO = null;

  constructor(
    private orderService: OrderService, 
    private datePipe: DatePipe, 
    private router: Router,
    private snackBar: MatSnackBar, 
    public authService: AuthenticationService, 
    private emailService: EmailService,
    private invoiceService: InvoiceService,
    private productService: ProductService
  ){}

  updatePagedOrders(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.ourFilteredOrders = this.filteredOrders.slice(startIndex, endIndex);
  }

  handlePageEvent(pageEvent: PageEvent){
    this.pageSize = pageEvent.pageSize;
    this.pageIndex = pageEvent.pageIndex;
    this.updatePagedOrders();
  }

  toggleDropdown(dropdown: 'status' | 'date' | 'changeStatus' | 'price' | 'name'){
    this.dropdownState[dropdown] = !this.dropdownState[dropdown];
  }

  navigateToDetails(order: OrderDTO, event: MouseEvent){
    const target = event.target as HTMLElement;

    if (target.hasAttribute('data-skip-navigation') || target.closest('[data-skip-navigation]')) {
      return;
    }
    this.router.navigate(['/order-details', order.orderId])
  }

  selectOrder(){
    const selected = this.ordersData.filter(order => order.orderSelected);

    this.selectedOrders = selected.length === 0 ? [] : selected;

    if(this.selectedOrders.length === 0){
      this.dropdownState['changeStatus'] = false;
    }
  }

  copySelectedOrders(): void {
    if(!this.selectedOrders?.length){
      this.snackBar.open("Nemáte zvolenú/é objednávku/y na kopírovanie!", "", { duration: 1000 });
      return;
    }
    this.isLoading = true;
    const orderIds = this.selectedOrders.map(o => o.orderId);

    this.orderService.copyOrders(orderIds, this.currentDate).pipe(
      switchMap((response: any) => {
        if (response?.message?.includes("dostupných podacích čísiel")) {
          this.snackBar.open(response.message, "", { duration: 3000 });
          this.clearSelection();
          return EMPTY; 
        }

        this.snackBar.open("Objednávka/y bola/i úspešne skopírované!", "", { duration: 1000 });

        return this.reloadOrders().pipe(
          tap(() => {
            this.clearSelection();
          })
        )
      })
    ).subscribe({
      next: () =>  this.isLoading = false,
      error: (err: HttpErrorResponse) => {
        console.error("An error has occurred while trying to copy order/orders.", err);
        this.isLoading = false;
      }
    })
  }

  changeOrderStatus(orderStatus: string): void {
    if(!this.selectedOrders?.length){
      this.snackBar.open("Nemáte zvolenú/é objednávku/y na kopírovanie!", "", { duration: 1000 });
      return;
    }
    this.isLoading = true;
    const orderIds = this.selectedOrders.map(o => o.orderId);
    const emailDtos = this.selectedOrders.map(order => ({
      email: order.email,
      orderId: order.orderId,
      packageCode: order.packageCode
    }));

    if (orderStatus === 'Zasielanie čísla zásielky') {
      const hasInvalidPackageCode = this.selectedOrders.some(order => !order.packageCode || order.packageCode.trim() === '');

      if (hasInvalidPackageCode) {
        this.snackBar.open('Pre odoslanie e-mailu je potrebné zadať podacie číslo!', '', { duration: 2000 });
        this.isLoading = false;
        return;
      }
    }
    
    this.orderService.changeOrderStatus(orderIds, orderStatus).pipe(
      switchMap((response) => {
        if(!response) throw new Error("Not success!");
        this.snackBar.open("Zmena stavu bola úspešná!", "", { duration: 1500 });
        this.clearSelection();
        
        if(orderStatus === 'Zasielanie čísla zásielky') {
          return this.emailService.sendPackageCodeEmails(emailDtos).pipe(
            catchError((error) => {
              console.error("An error has occurred while trying to send emails.", error?.message);
               return of(null);
            }),
            switchMap(() => this.reloadOrders())
          );
        }
        else if(orderStatus === 'Dobierka - Info k objednávke (poslať e-mail)'){
          return this.emailService.sendOrderConfirmationEmails(emailDtos).pipe(
            catchError((error) => {
              console.error("An error has occurred while trying to send emails.", error?.message);
               return of(null);
            }),
            switchMap(() => this.reloadOrders())
          )
        }
        return of(null);
      }),
      switchMap(() => this.reloadOrders()),
      finalize(() => {
        this.isLoading = false;
        this.dropdownState['changeStatus'] = false;
      })
    ).subscribe({
      next: () => {},
      error: (err) => {
        console.error("An error has occurred while trying to change order status.", err);
        this.isLoading = false;
      }
    })
  }

  removeSelectedOrders(): void {
    if(!this.selectedOrders?.length){
      this.snackBar.open("Nemáte zvolenú/é objednávku/y na kopírovanie!", "", { duration: 1000 });
      return;
    }
    this.isLoading = true;
    const orderIds = this.selectedOrders.map(o => o.orderId);

    this.orderService.removeSelectedOrders(orderIds).pipe(
      switchMap((response) => {
        if(!response) throw new Error("Not success!");
        this.snackBar.open("Objednávka/y boli úspešne vymazané!", "", { duration: 1500 });
        this.clearSelection();
        return this.reloadOrders();
      })
    ).subscribe({
      next: () => this.isLoading = false,
      error: (err) => {
        console.error("An error has occurred while trying to remove orders.", err);
        this.isLoading = false;
      }
    })
  }

  downloadXmlFiles(){
    if(!this.selectedOrders?.length){
      this.snackBar.open("Nemáte zvolenú/é objednávku/y na kopírovanie!", "", { duration: 1000 });
      return;
    }

    this.isLoading = true;
    const loadingRef = this.snackBar.open("Generuje sa XML súbor...", "", { duration: undefined });

    this.orderService.getOrdersXmlFile(this.selectedOrders.map(o => o.orderId)).pipe(
      tap((response) => {
        const byteCharacters = atob(response.fileContentBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for(let i = 0; i < byteCharacters.length; i++){
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/xml'});

        if(blob){
          const a = document.createElement('a');
          const objectUrl = URL.createObjectURL(blob);
          a.href = objectUrl;
          a.download = response.fileName;
          a.click();
          URL.revokeObjectURL(objectUrl);
        }

        if(response.generatedCodes){
          this.filteredOrders = this.filteredOrders.map(order => {
            const newPackageCode = response.generatedCodes[order.orderId];
            return newPackageCode ? { ...order, packageCode: newPackageCode } : order;
          });
          this.updatePagedOrders();
        }

        this.snackBar.open("XML súbor bol úspešne stiahnutý!", "", {
          duration: 2000
        });
        this.clearSelection();
      }),
      finalize(() => {
        this.isLoading = false;
        loadingRef.dismiss();
      })
    ).subscribe({
      error: (err: HttpErrorResponse) => {
        const backendError = err.error; 

        if (backendError?.error === "NO_CODES_LEFT") {
          this.snackBar.open(backendError.message, "", { duration: 3000 });
        } else {
          this.snackBar.open("Nastala chyba pri generovaní XML!", "", { duration: 3000 });
        }

        this.clearSelection();
      }
    })
  }

  downloadInvoices(): void {
    this.isLoading = true;

    if(!this.selectedOrders || this.selectedOrders.length === 0) {
      this.snackBar.open('Zabudli ste vybrať objednávky!', '', { duration: 3000 });
      this.isLoading = false;
      return;
    }

    const loadingSnack = this.snackBar.open('Generujú sa faktúry...', '', { duration: undefined });

    const observables = this.selectedOrders.map(selected =>
      this.orderService.getOrderDetails(selected.orderId).pipe(
        switchMap(order => 
          this.productService.getOrderProducts(order.id!).pipe(
            map(products => ({
              order: order,
              products
            }))
          )
        )
      )
    );

    forkJoin(observables).subscribe({
      next: async results => {
        try {
          await this.invoiceService.generateInvoices(results);
          this.snackBar.open('PDF s faktúrami bolo úspešne stiahnuté!', '', { duration: 2000 });
        } catch (err) {
          console.error(err);
          this.snackBar.open('Nastala chyba pri generovaní faktúr!', '', { duration: 3000 });
        } finally {
          this.isLoading = false;
          
          loadingSnack.dismiss();
          this.clearSelection();
        }
      },
      error: err => {
        console.error(err);
        this.snackBar.open('Nastala chyba pri načítaní objednávok!', '', { duration: 3000 });
        this.isLoading = false;
        loadingSnack.dismiss();
      }
    });
  }

  private reloadOrders() {
    return this.orderService.getOrders().pipe(
      tap((result) => {
        this.filteredOrders = this.ordersData = result;
        this.pageIndex = 0;
        this.totalItems = this.filteredOrders.length;

        this.updatePagedOrders();
      }),
      catchError((error) => {
        console.error("An error has occured while trying to reload orders.", error);
        this.isLoading = false;
        return EMPTY;
      })
    )
  }

  selectAllOrders(){
    for (let order of this.filteredOrders) {
      order.orderSelected = true;
    }
    this.selectedOrders = [...this.filteredOrders];
  }

  clearSelection(showSnackbar: boolean = false) {
    this.selectedOrders = [];
    this.filteredOrders.forEach(order => order.orderSelected = false);
    if (showSnackbar) {
      this.snackBar.open('Výber bol zrušený!', '', { duration: 3000 });
    }
  }

  getStatusColor(orderStatus: string): string {
    const statusIndex = this.statuses.findIndex(s => s.statusName === orderStatus);
    const backgroundColors = this.statuses.map(s => s.statusColor);
    if(statusIndex !== -1 && statusIndex < backgroundColors.length){
      return backgroundColors[statusIndex];
    }
    return '#ccc';
  }

  setSort(field: 'date' | 'price' | 'name', order: 'asc' | 'desc' | 'newest' | 'oldest'): void {
    this.sortConfig = { field, order };
    this.applyFilters();
  }
  
  applyFilters(isLocal?: boolean): void {
    let filtered = [...this.ordersData];
    const searchNormalized = this.removeDiacritics(this.searchText);

    if(searchNormalized.length > 0){
      filtered = filtered.filter(order => {
        const customerNameNormalized = this.removeDiacritics(order.customerName);
        const emailNormalized = this.removeDiacritics(order.email);
        const noteNormalized = this.removeDiacritics(order.note);
        const orderIdStr = order.orderId.toString();

        const productNamesNormalized = order.productNames
          ? order.productNames.map(p => this.removeDiacritics(p))
          : [];

        switch(this.searchOption) {
          case 'customerName':
            return customerNameNormalized.includes(searchNormalized);
          case 'orderId':
            return orderIdStr.startsWith(searchNormalized);
          case 'email':
            return emailNormalized.includes(searchNormalized);
          case 'product':
            return productNamesNormalized.some(p => 
              p.includes(searchNormalized)
            );
          case 'note':
            return noteNormalized.includes(searchNormalized);
          case 'auto':
            return (
              customerNameNormalized.includes(searchNormalized) ||
              orderIdStr.startsWith(searchNormalized) ||
              emailNormalized.includes(searchNormalized) ||
              productNamesNormalized.some(p => 
              p.includes(searchNormalized)
              ) ||
              noteNormalized.includes(searchNormalized) 
            )
          default:
            return false;
        }
      });
    }

    if(this.selectedStatuses.length > 0){
      filtered = filtered.filter(order => this.selectedStatuses.includes(order.orderStatus));
    }

    if(this.sortConfig.field) {
      filtered = filtered.sort((a, b) => {
        switch(this.sortConfig.field) {
          case 'date': {
            const dateA = this.parseDate(a.orderDate).getTime();
            const dateB = this.parseDate(b.orderDate).getTime();
            return this.sortConfig.order === 'newest'
            ? dateB - dateA
            : dateA - dateB;
          }
          case 'price': {
            const priceA = a.totalPrice ?? 0;
            const priceB = b.totalPrice ?? 0;
            return this.sortConfig.order === 'asc'
            ? priceA - priceB
            : priceB - priceA
          }
          case 'name': {
            const nameA = this.removeDiacritics(a.customerName).toLowerCase();
            const nameB = this.removeDiacritics(b.customerName).toLowerCase();
            if (nameA < nameB) return this.sortConfig.order === 'asc' ? -1 : 1;
            if (nameA > nameB) return this.sortConfig.order === 'asc' ? 1 : -1;
            return 0;
          }
          default:
            return 0;
          }
      })
    }

    this.filteredOrders = filtered;
    this.totalItems = this.filteredOrders.length;
    if(!isLocal) this.pageIndex = 0;
    this.updatePagedOrders();
  }

  searchOrders(): void {
    this.applyFilters();
  }

  private removeDiacritics(str: string): string {
    return str 
    ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    : '';
  }

  parseDate(dateString: string): Date {
    if(!dateString.includes(' ')){
      console.error('An error have occurred with dateString');
    }
    
    const[datePart, timePart] = dateString.split(' ');

    if(!datePart.includes('.') || !timePart.includes(':')){
      console.error('An error have occurred with datePart or timePart');
    }

    const[day, month, year] = datePart.split('.').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    if (!day || !month || !year || !hours || !minutes || seconds === undefined){ //v seconds === undefined preto lebo seconds niekedy nemusia byt definovane v case a nech je jasne ze hodnota neexistuje
      console.error('Invalid time or date values');
    }

    const parsedDate = new Date(year, month - 1, day, hours, minutes, seconds); //v javascripte sa mesiace pocitaju od indexu 0 preto je tam month - 1
    return parsedDate;
  }

  onCheckboxChange(event: Event){
    const checkBox = event.target as HTMLInputElement;
    const value = checkBox.value;

    if(checkBox.checked){
      this.selectedStatuses.push(value);
    }else{
      this.selectedStatuses = this.selectedStatuses.filter(status => status !== value);
    }

    this.applyFilters();
  }

  ngOnInit(): void {
    forkJoin({
      orders: this.orderService.getOrders(),
      statuses: this.orderService.getOrderStatuses()
    }).subscribe({
      next: ({ orders, statuses}) => {
        this.ordersData = orders;
        this.filteredOrders = orders;
        this.statuses = statuses;

        this.totalItems = orders.length;
        this.pageIndex = Number(localStorage.getItem('pageIndex')) ?? 0;

        this.applyFilters(true);
      },
      error: (err) => {
        console.error("An error has occurred while trying to fetch data.", err);
      },
      complete: () => {
        this.isLoading = false;
        const now = new Date();
        this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');

        console.log('%c\
        ██╗  ██╗███████╗██╗     ██╗      ██████╗\n\
        ██║  ██║██╔════╝██║     ██║     ██╔═══██╗\n\
        ███████║█████╗  ██║     ██║     ██║   ██║\n\
        ██╔══██║██╔══╝  ██║     ██║     ██║   ██║\n\
        ██║  ██║███████╗███████╗███████╗╚██████╔╝\n\
        ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝ ╚═════╝', 
        'font-family: monospace; white-space: pre; font-size: 12px; color: #4CAF50; background: black; padding: 5px;');
      }
    })
  }
  ngAfterViewInit(): void{
    this.updatePagedOrders();
  }
  ngOnDestroy(): void {
    localStorage.setItem('pageIndex', String(this.pageIndex));
  }
}
