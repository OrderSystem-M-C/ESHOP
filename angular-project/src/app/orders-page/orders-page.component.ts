import { AfterViewInit, Component, Injectable, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { OrderService } from '../services/order.service';
import { CommonModule, DatePipe } from '@angular/common';
import { OrderDTO } from '../order-form/order-form.component';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js/auto';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CustomPaginatorIntl } from '../services/custom-paginator-intl.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthenticationService } from '../api-authorization/authentication.service';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, CommonModule, FormsModule, MatPaginatorModule],
  providers: [DatePipe, { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss'
})
export class OrdersPageComponent implements OnInit, AfterViewInit{
  public ordersData: OrderDTO[] = [];
  filteredOrders = [...this.ordersData];
  ourFilteredOrders: OrderDTO[] = [];
  statuses: string[] = [
    'Nezpracované - nová objednávka',
    'Vybaviť - Pošta',
    'Zasielanie čísla zásielky',
    'Uhradené - Vybaviť',
    'Vybaviť - Odložené, osobný odber',
    'Neuhradené - čakám na platbu',
    'Neuhradené - 2x poslaný e-mail',
    'Poslané, neuhradené',
    'Neuhradené - Údaje k platbe, poslať e-mail',
    'Dobierka - Info k objednávke (poslať e-mail)',
    'Objednávka vybavená',
    'Objednávka odoslaná, čakám na úhradu dobierkou',
    'Storno',
    'Oprava',
    'Rozbité, zničené, vrátené'
  ];
  
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
  @ViewChild('revenueChart') revenueChart!: { nativeElement: any };

  orders_chartInstance: any;
  orders_ctx: any;
  @ViewChild('ordersDate') ordersDate!: { nativeElement: any };

  pie_chartInstance: any;
  pie_ctx: any;
  @ViewChild('ordersStatusChart') ordersStatusChart!: { nativeElement: any };

  totalItems: number = 0;
  pageIndex: number = 0;
  pageSize: number = 6;

  selectedOrders: OrderDTO[] = [];

  selectedRange: '1d' | '7d' | '1m' | '1y' | 'all' = 'all';

  constructor(private orderService: OrderService, private datePipe: DatePipe, private router: Router, private snackBar: MatSnackBar, public authService: AuthenticationService){}

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
    const selected = this.ourFilteredOrders.filter(order => order.orderSelected);

    this.selectedOrders = selected.length === 0 ? [] : selected;

    if(this.selectedOrders.length === 0){
      this.isVisibleChangeStatus = false;
    }
  }

  copySelectedOrders(): void {
    this.isLoading = true;
    if(this.selectedOrders){
      let orderIds = this.selectedOrders.map(order => order.orderId);
      this.orderService.copyOrders(orderIds, this.currentDate).subscribe(() => {
        this.snackBar.open("Objednávka/y bola/i úspešne skopírované!", "", { duration: 1000 });
        this.ourFilteredOrders.forEach(order => order.orderSelected = false);
        this.selectedOrders = [];
  
        this.orderService.getOrders().subscribe((result) => {
          this.filteredOrders = result;
          this.pageIndex = 0;
          this.totalItems = this.filteredOrders.length;
          this.updatePagedOrders();
          this.isLoading = false;

          this.updateOrdersChart();
          this.updateRevenueChart();
          this.updateStatusChart();
        }, (error) => {
          console.error("An error have occurred!", error);
          this.isLoading = false;
        })
      }, (error) => {
        console.error("An error have occurred!", error);
        this.isLoading = false;
      })
    }else{
      this.snackBar.open("Nemáte zvolenú/é objednávku/y na kopírovanie!", "", { duration: 1000 });
      this.isLoading = false;
    }
  }

  changeOrderStatus(orderStatus: string): void {
    this.isLoading = true;
    if(this.selectedOrders){
      let orderIds = this.selectedOrders.map(order => order.orderId);
      this.orderService.changeOrderStatus(orderIds, orderStatus).subscribe((response) => {
        if(response){
          this.snackBar.open("Zmena stavu bola úspešná!", "", { duration: 1500 });
          this.selectedOrders = [];
          this.orderService.getOrders().subscribe((result) => {
            this.filteredOrders = result;
            this.pageIndex = 0;
            this.totalItems = this.filteredOrders.length;
            this.updatePagedOrders();
            this.isLoading = this.isVisibleChangeStatus = false;

            this.updateStatusChart();
          }, (error) => {
            console.error("An error have occurred!", error);
            this.isLoading = false;
          })
        }
      }, (error) => {
        console.error("An error has occurred while trying to change status of the order/orders.", error);
        this.isLoading = false;
      })
    }
  }

  removeSelectedOrders(): void {
    this.isLoading = true;
    if(this.selectedOrders){
      let orderIds = this.selectedOrders.map(order => order.orderId);
      this.orderService.removeSelectedOrders(orderIds).subscribe((respone) => {
        if(respone){
          this.snackBar.open("Objednávka/y boli úspešne vymazané!", "", { duration: 1500 });
          this.selectedOrders = [];
          this.orderService.getOrders().subscribe((result) => {
            this.filteredOrders = result;
            this.pageIndex = 0;
            this.totalItems = this.filteredOrders.length;
            this.updatePagedOrders();
            this.isLoading = false;

            this.updateStatusChart();
            this.updateOrdersChart();
            this.updateRevenueChart();
          }, (error) => {
            console.error("An error have occurred!", error);
            this.isLoading = false;
          })
        }
      })
    }
  }

  downloadXmlFile(){
    if(this.selectedOrders){
      let orderIds = this.selectedOrders.map(order => order.orderId);
      this.orderService.getOrdersXmlFile(orderIds).subscribe((blob) => {
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = `Zasielky_${new Date().toLocaleDateString("sk").replace(/\s/g, "").replace(/\./g, "")}.xml`
      a.click();
      URL.revokeObjectURL(objectUrl);

      this.snackBar.open("XML súbor bol úspešne stiahnutý!", "", { duration: 1500 });
      this.selectedOrders = [];
      this.ordersData.forEach(order => {
        order.orderSelected = false;
      })
    }, (error) => {
      console.error("An error has occurred while trying to download XML file.", error);
    })
    }
  }

  filterOrdersByRange(): any[] {
    const now = new Date();
    let fromDate: Date;
    switch(this.selectedRange){
      case '1d':
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1); 
        break;
      case '7d':
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case '1m':
        fromDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '1y':
        fromDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
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

  changeRange(range: '1d' | '7d' | '1m' | '1y' | 'all', chart: 'orders' | 'revenue'){
    this.selectedRange = range;
    if(chart === 'orders'){
      this.orders_chartInstance.destroy();
      this.createChart(chart);
    }else{
      this.revenue_chartInstance.destroy();
      this.createChart(chart);
    }
  }

  createChart(chart: 'status' | 'orders' | 'revenue'): void {
    if(chart === 'status'){
      this.pie_chartInstance = this.ordersStatusChart.nativeElement;
      this.pie_ctx = this.pie_chartInstance.getContext('2d');
  
      const statusCounts: { [key: string]: number } = {};
      this.ordersData.forEach(order => {
        statusCounts[order.orderStatus] = (statusCounts[order.orderStatus] || 0) + 1;
      });

      const backgroundColors = ['#4CAF50', '#FF9800', '#2196F3', '#FF5722', '#8BC34A', '#03A9F4', '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63', '#673AB7', '#CDDC39', '#FFC107', '#009688', '#607D8B', '#F44336'];

      const labels = this.statuses.filter(status => statusCounts[status] !== undefined);
      const data = labels.map(status => statusCounts[status]);
      const colors = labels.map(status => {
        const idx = this.statuses.indexOf(status);
        return idx !== -1 ? backgroundColors[idx] : '#ccc';
      });

      this.pie_chartInstance = new Chart(this.pie_ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Stavy objednávok',
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
            backgroundColor: '#0d6efd',
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
            backgroundColor: '#0d6efd',
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
    const statusIndex = this.statuses.indexOf(orderStatus);
    const backgroundColors = ['#4CAF50', '#FF9800', '#2196F3', '#FF5722', '#8BC34A', '#03A9F4', '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63', '#673AB7', '#CDDC39', '#FFC107', '#009688', '#607D8B', '#F44336'];
    if(statusIndex !== -1 && statusIndex < backgroundColors.length){
      return backgroundColors[statusIndex];
    }
    return '#ccc';
  }

  updateStatusChart(): void {
    const backgroundColors = ['#4CAF50', '#FF9800', '#2196F3', '#FF5722', '#8BC34A', '#03A9F4', '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63', '#673AB7', '#CDDC39', '#FFC107', '#009688', '#607D8B', '#F44336'];
    const statusCounts: { [key: string]: number } = {};
    this.filteredOrders.forEach(order => {
      statusCounts[order.orderStatus] = (statusCounts[order.orderStatus] || 0) + 1;
    });
  
    const labels = this.statuses.filter(status => statusCounts[status] !== undefined);
    const data = labels.map(status => statusCounts[status]);
    const colors = labels.map(status => {
      const idx = this.statuses.indexOf(status);
      return idx !== -1 ? backgroundColors[idx] : '#ccc'; 
    });
  
    this.pie_chartInstance.data.labels = labels;
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

    if (this.searchText.length > 0) {
      filtered = filtered.filter(order => {
        switch (this.searchOption) {
          case 'customerName':
            return order.customerName.toLowerCase().includes(this.searchText.toLowerCase());
          case 'orderId':
            return order.orderId.toString().startsWith(this.searchText);
          case 'email':
            return order.email.toLowerCase().includes(this.searchText.toLowerCase());
          case 'note':
            return order.note.toLowerCase().includes(this.searchText.toLowerCase())
          case 'auto':
            return (
              order.customerName.toLowerCase().includes(this.searchText.toLowerCase()) ||
              order.orderId.toString().startsWith(this.searchText) ||
              order.email.toLowerCase().includes(this.searchText.toLowerCase()) ||
              order.note.toLowerCase().includes(this.searchText.toLowerCase())
            );
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
    this.orderService.getOrders().subscribe((result) =>{
      this.ordersData = result;
      this.filteredOrders = this.ordersData;
      this.isLoading = false;
      this.createChart('status');
      this.createChart('orders');
      this.createChart('revenue');
      this.totalRevenue = parseFloat(
        (this.ordersData.reduce((total, order) => total + (order.totalPrice) || 0, 0)).toFixed(2)
      )
      this.totalItems = this.ordersData.length;
      this.pageIndex = 0;
      this.applyFilters();
    }, (error) =>{
      console.error("An error have occurred while trying to get data of orders", error);
    });
    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');
  }
  ngAfterViewInit(): void{
    this.updatePagedOrders();
  }
}
