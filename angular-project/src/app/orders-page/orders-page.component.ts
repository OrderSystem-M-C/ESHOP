import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { OrderService } from '../services/order.service';
import { CommonModule, DatePipe } from '@angular/common';
import { OrderDTO, OrderStatusDTO } from '../order-form/order-form.component';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js/auto';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CustomPaginatorIntl } from '../services/custom-paginator-intl.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthenticationService } from '../authentication/authentication.service';
import { EmailService } from '../services/email.service';
import { catchError, EMPTY, finalize, forkJoin, map, of, switchMap, take, tap } from 'rxjs';
import { OrderDetailsComponent } from '../order-details/order-details.component';
import { HttpErrorResponse } from '@angular/common/http';
import { EphService, PackageCodeResponseDTO } from '../services/eph.service';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, CommonModule, FormsModule, MatPaginatorModule, OrderDetailsComponent],
  providers: [DatePipe, { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss'
})
export class OrdersPageComponent implements OnInit, AfterViewInit {
  public ordersData: OrderDTO[] = [];
  filteredOrders = [...this.ordersData];
  ourFilteredOrders: OrderDTO[] = [];
  statuses: OrderStatusDTO[] = [];
  
  selectedStatuses: string[] = [];

  currentDate: string;

  isLoading: boolean = true;
  isVisibleCheckbox: boolean = false;
  isVisibleDateFilter: boolean = false;
  isVisibleChangeStatus: boolean = false;

  dateSortOrder: string = '';

  searchText: string = '';
  searchOption: string = 'auto';

  totalRevenue: number = 0;

  revenue_chartInstance: any;
  revenue_ctx: any;
  @ViewChild('revenueChart', { static: false }) revenueChart!: { nativeElement: HTMLCanvasElement };

  orders_chartInstance: any;
  orders_ctx: any;
  @ViewChild('ordersDate', { static: false }) ordersDate!: { nativeElement: HTMLCanvasElement };

  pie_chartInstance: any;
  pie_ctx: any;
  @ViewChild('ordersStatusChart', { static: false }) ordersStatusChart!: { nativeElement: HTMLCanvasElement };

  totalItems: number = 0;
  pageIndex: number = 0;
  pageSize: number = 6;

  selectedOrders: OrderDTO[] = [];

  selectedRange: '1d' | '7d' | '1m' | '1y' | 'all' = 'all';

  hoveredOrder: OrderDTO = null;

  constructor(private orderService: OrderService, private datePipe: DatePipe, private router: Router, private snackBar: MatSnackBar, public authService: AuthenticationService, private emailService: EmailService, private ephService: EphService){}

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

  toggleDropdown(dropdown: 'status' | 'date' | 'changeStatus'){
    if(dropdown === 'status'){
      this.isVisibleCheckbox = !this.isVisibleCheckbox;
    }else if(dropdown === 'date'){
      this.isVisibleDateFilter = !this.isVisibleDateFilter;
    }else{
      this.isVisibleChangeStatus = !this.isVisibleChangeStatus;
    }
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
      this.isVisibleChangeStatus = false;
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
          this.isLoading = false;
          this.clearSelection();
          return EMPTY; 
        }
        this.snackBar.open("Objednávka/y bola/i úspešne skopírované!", "", { duration: 1000 });
        this.clearSelection();
        return this.reloadOrders();
      })
    ).subscribe({
      next: () => this.isLoading = false,
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
        this.isVisibleChangeStatus = false;
        this.updateStatusChart();
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

  downloadXmlFile(){
    if(!this.selectedOrders?.length){
      this.snackBar.open("Nemáte zvolenú/é objednávku/y na kopírovanie!", "", { duration: 1000 });
      return;
    }

    this.isLoading = true;
    const loadingRef = this.snackBar.open("Sťahuje sa XML súbor...", "", { duration: undefined });

    const updateObservables = this.selectedOrders.map(order => 
      this.ephService.generatePackageCode().pipe(
        switchMap((response: PackageCodeResponseDTO) => {
          return this.ephService.updatePackageCode(order.orderId, response.packageCode).pipe(
            map(() => ({ orderId: order.orderId, packageCode: response.packageCode })),
            take(1)
          );
        }),
        catchError(err => {
          console.error("An error have occurred while trying to update orders: ", err);
          return of(null);
        }),
        take(1)  
      )
    )
    
    forkJoin(updateObservables).pipe(
      tap(results => {
        this.filteredOrders = this.filteredOrders.map(order => {
            const updatedResult = results.find(result => result && result.orderId === order.orderId);
            if (updatedResult) {
                return { ...order, packageCode: updatedResult.packageCode };
            }
            return order;
        });
        this.updatePagedOrders();
      }),
      switchMap(() => this.orderService.getOrdersXmlFile(this.selectedOrders.map(o => o.orderId))),
      finalize(() => {
        this.isLoading = false;
        loadingRef.dismiss();
      })
    ).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = `Zasielky_${new Date().toLocaleDateString("sk").replace(/\s/g, "").replace(/\./g, "")}.xml`;
        a.click();
        URL.revokeObjectURL(objectUrl);

        this.snackBar.open("XML súbor bol úspešne stiahnutý!", "", { duration: 1500 });
        this.clearSelection();
      },
      error: (err) => {
        loadingRef.dismiss();
        console.error("Chyba pri spracovaní objednávok alebo sťahovaní XML.", err);
        this.snackBar.open("Chyba pri spracovaní objednávok alebo sťahovaní XML.", "", { duration: 1500 });
      }
    })
  }

  private reloadOrders() {
    return this.orderService.getOrders().pipe(
      tap((result) => {
        this.filteredOrders = this.ordersData = result;
        this.pageIndex = 0;
        this.totalItems = this.filteredOrders.length;
        this.updatePagedOrders();

        this.updateOrdersChart();
        this.updateRevenueChart();
        this.updateStatusChart();
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
      this.snackBar.open('Výber bol zrušený.', '', { duration: 3000 });
    }
  }

  filterOrdersByRange(): any[] {
    const now = new Date();
    let fromDate: Date;
    switch(this.selectedRange){
      case '1d':
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1m':
        fromDate = new Date(now);
        fromDate.setMonth(fromDate.getMonth() - 1);
        break;
      case '1y':
        fromDate = new Date(now);
        fromDate.setFullYear(fromDate.getFullYear() - 1);
        break;
      case 'all':
        default:
          return this.ordersData;
    }
    return this.ordersData.filter(order => {
      const orderDate = this.parseDate(order.orderDate);
      return orderDate >= fromDate;
    })
  }

  onRangeChange(event: Event, chart: 'orders' | 'revenue'): void {
    const value = (event.target as HTMLSelectElement).value as '1d' | '7d' | '1m' | '1y' | 'all';
    this.changeRange(value, chart);
  }

  changeRange(range: '1d' | '7d' | '1m' | '1y' | 'all', chart: 'orders' | 'revenue'){
    this.selectedRange = range;

    setTimeout(() => {
      if (chart === 'orders' && this.ordersDate?.nativeElement) {
        this.orders_chartInstance?.destroy();
        this.createChart(chart);
      } else if (chart === 'revenue' && this.revenueChart?.nativeElement) {
        this.revenue_chartInstance?.destroy();
        this.createChart(chart);
      }
    }, 0);
  }

  createChart(chart: 'status' | 'orders' | 'revenue'): void {
    if(chart === 'status'){
      this.pie_chartInstance = this.ordersStatusChart.nativeElement;
      this.pie_ctx = this.pie_chartInstance.getContext('2d');
  
      const statusCounts: { [key: string]: number } = {};
      this.ordersData.forEach(order => {
        statusCounts[order.orderStatus] = (statusCounts[order.orderStatus] || 0) + 1;
      });

      const backgroundColors = this.statuses.map(s => s.statusColor);

      const activeStatusNames = Object.keys(statusCounts);
      const labels = this.statuses.filter(status => activeStatusNames.includes(status.statusName));
      const data = labels.map(status => statusCounts[status.statusName]);
      const colors = labels.map(status => {
        const idx = this.statuses.findIndex(originalStatus => originalStatus.statusName === status.statusName);
        return idx !== -1 ? backgroundColors[idx] : '#ccc';
      });

      this.pie_chartInstance = new Chart(this.pie_ctx, {
        type: 'doughnut',
        data: {
          labels: labels.map(s => s.statusName),
          datasets: [
            {
              label: 'Počet objednávok',
              data: data,
              backgroundColor: colors,
              hoverOffset: 8
            }
          ]
        },
      });
    }else if(chart === 'orders'){
      this.orders_chartInstance = this.ordersDate.nativeElement;
      this.orders_ctx = this.orders_chartInstance.getContext('2d');

      const filteredOrders = this.filterOrdersByRange();
      const ordersByDate = this.groupOrdersByDate(filteredOrders);

      const dates = Object.keys(ordersByDate);
      const orderCounts = Object.values(ordersByDate);

      this.orders_chartInstance = new Chart(this.orders_ctx, {
        type: 'bar',
        data: {
          labels: dates,
          datasets: [{
            label: 'Počet objednávok',
            data: orderCounts, 
            backgroundColor: '#084298',
            borderColor: '#1e88e5',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            x: {
              title: {
                display: true,
                text: 'Dátum'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Počet objednávok'
              },
              ticks: {
                stepSize: 1,
                precision: 0
              }
            }
          }
        }
      })
    }else if(chart === 'revenue') {
      this.revenue_chartInstance= this.revenueChart.nativeElement;
      this.revenue_ctx = this.revenue_chartInstance.getContext('2d');

      const filteredOrders = this.filterOrdersByRange();
      const ordersRevenue = this.groupOrdersByDateRevenue(filteredOrders);

      const labels = Object.keys(ordersRevenue);
      const data = Object.values(ordersRevenue).map(o => o.totalRevenue);

      this.revenue_chartInstance = new Chart(this.revenue_ctx, {
        type: 'line',
        data: {
          labels: [0, ...labels],
          datasets: [{
            label: 'Denná tržba (€)',
            data: [0, ...data], 
            backgroundColor: '#084298',
            borderColor: '#1e88e5',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            x: {
              title: {
                display: true,
                text: 'Dátum'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Tržba v €'
              }
            }
          }
        }
      })
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

  updateStatusChart(): void {
    const backgroundColors = this.statuses.map(s => s.statusColor);
    const statusCounts: { [key: string]: number } = {};
    this.filteredOrders.forEach(order => {
      statusCounts[order.orderStatus] = (statusCounts[order.orderStatus] || 0) + 1;
    });
  
    const labels = this.statuses.filter(status => statusCounts[status.statusName] !== undefined);
    const data = labels.map(status => statusCounts[status.statusName]);
    const colors = labels.map(status => {
      const idx = this.statuses.indexOf(status);
      return idx !== -1 ? backgroundColors[idx] : '#ccc'; 
    });
  
    this.pie_chartInstance.data.labels = labels.map(s => s.statusName);
    this.pie_chartInstance.data.datasets[0].data = data;
    this.pie_chartInstance.data.datasets[0].backgroundColor = colors;
    this.pie_chartInstance.update();
  }
  updateOrdersChart(): void {
    const ordersByDate = this.groupOrdersByDate(this.filteredOrders);
    const dates = Object.keys(ordersByDate);
    const orderCounts = Object.values(ordersByDate);

    this.orders_chartInstance.data.labels = dates;
    this.orders_chartInstance.data.datasets[0].data = orderCounts;
    this.orders_chartInstance.update();
  }
  updateRevenueChart(): void {
    const ordersRevenue = this.groupOrdersByDateRevenue(this.filteredOrders);
    const labels = Object.keys(ordersRevenue);
    const data = Object.values(ordersRevenue).map(o => o.totalRevenue);

    this.revenue_chartInstance.data.labels = [0, ...labels];
    this.revenue_chartInstance.data.datasets[0].data = [0, ...data];
    this.revenue_chartInstance.update();
  }

  groupOrdersByDate(orders: OrderDTO[]) {
    return orders.reduce((acc, order) => {
      const [datePart] = order.orderDate.split(' ');
      const [day, month, year] = datePart.split('.').map(Number);
      const formattedDate = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;

      if(!acc[formattedDate]){
        acc[formattedDate] = 0;
      }
      acc[formattedDate] += 1;

      return acc;
    }, {});
  }
  groupOrdersByDateRevenue(orders: OrderDTO[]): { [date: string]: { totalRevenue: number } } {
    return orders.reduce((acc, order) => {
      const [datePart] = order.orderDate.split(' ');
      const [day, month, year] = datePart.split('.').map(Number);
      const formattedDate = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;

      if(!acc[formattedDate]){
        acc[formattedDate] = { totalRevenue: 0 };
      }
      acc[formattedDate].totalRevenue += parseFloat(order.totalPrice.toFixed(2));

      return acc;
    }, {} as { [date: string]: { totalRevenue: number } });
  }

  sortByDate(order: 'newest' | 'oldest'): void {
   this.dateSortOrder = order;
   this.isVisibleDateFilter = false;
   this.applyFilters();
  }
  
  applyFilters(): void {
    let filtered = [...this.ordersData];
    const searchNormalized = this.removeDiacritics(this.searchText);

    if(searchNormalized.length > 0){
      filtered = filtered.filter(order => {
        const customerNameNormalized = this.removeDiacritics(order.customerName);
        const emailNormalized = this.removeDiacritics(order.email);
        const noteNormalized = this.removeDiacritics(order.note);
        const orderIdStr = order.orderId.toString();

        switch(this.searchOption) {
          case 'customerName':
            return customerNameNormalized.includes(searchNormalized);
          case 'orderId':
            return orderIdStr.startsWith(searchNormalized);
          case 'email':
            return emailNormalized.includes(searchNormalized);
          case 'note':
            return noteNormalized.includes(searchNormalized);
          case 'auto':
            return (
              customerNameNormalized.includes(searchNormalized) ||
              orderIdStr.startsWith(searchNormalized) ||
              emailNormalized.includes(searchNormalized) ||
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

    if(this.dateSortOrder){
      filtered = filtered.sort((a, b) => {
        const dateA = this.parseDate(a.orderDate).getTime();
        const dateB = this.parseDate(b.orderDate).getTime();

        return this.dateSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      })
    }

    this.filteredOrders = filtered;
    this.totalItems = this.filteredOrders.length;
    this.pageIndex = 0;
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

        this.totalRevenue = parseFloat(
          orders.reduce((total, order) => total + (order.totalPrice || 0), 0).toFixed(2)
        );
        this.totalItems = orders.length;
        this.pageIndex = 0;
        this.applyFilters();
        this.createChart('status');
        this.createChart('orders');
        this.createChart('revenue');
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
}
