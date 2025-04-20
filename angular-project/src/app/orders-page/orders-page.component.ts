import { Component, OnInit, ViewChild } from '@angular/core';
import { OrderService } from '../services/order.service';
import { CommonModule, DatePipe } from '@angular/common';
import { OrderDTO } from '../order-form/order-form.component';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js/auto';
import { PaginationComponent } from '../pagination/pagination.component';
import { MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, CommonModule, FormsModule, PaginationComponent, MatPaginatorModule],
  providers: [DatePipe],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.css'
})
export class OrdersPageComponent implements OnInit{
  public ordersData: OrderDTO[] = [];
  filteredOrders = [...this.ordersData];
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

  currentPage: number = 1;
  totalItems: number = 0;
  limitItems: number = 2;

  constructor(private orderService: OrderService, private datePipe: DatePipe){}

  onPageChange(page: number) {
    this.currentPage = page;
    this.updateCurrentOrders();
  }
  updateCurrentOrders() {
    const startIndex = (this.currentPage - 1) * this.limitItems;
    const endIndex = startIndex + this.limitItems;
    this.filteredOrders = this.ordersData.slice(startIndex, endIndex);
  }

  toggleDropdown(dropdown: 'status' | 'date'){
    if(dropdown === 'status'){
      this.isVisibleCheckbox = !this.isVisibleCheckbox;
    }else{
      this.isVisibleDateFilter = !this.isVisibleDateFilter;
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

      const labels = Object.keys(statusCounts);
      const data = Object.values(statusCounts);

      const backgroundColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#66FF66',
        '#FF6666', '#3399FF', '#FF3399', '#99FF33', '#FF6633', '#33FF99', '#6633FF'
      ];
  
      this.pie_chartInstance = new Chart(this.pie_ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Stavy objednávok',
              data: data,
              backgroundColor: backgroundColors.slice(0, labels.length),
              hoverOffset: 8
            }
          ]
        },
      });
    }else if(chart === 'orders'){
      this.orders_chartInstance = this.ordersDate.nativeElement;
      this.orders_ctx = this.orders_chartInstance.getContext('2d');
      const ordersByDate = this.groupOrdersByDate(this.ordersData);

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
      const ordersRevenue = this.groupOrdersByDateRevenue(this.ordersData);

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
          case 'auto':
            return (
              order.customerName.toLowerCase().includes(this.searchText.toLowerCase()) ||
              order.orderId.toString().startsWith(this.searchText) ||
              order.email.toLowerCase().includes(this.searchText.toLowerCase())
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
  }

  searchOrders(): void {
    if(!this.searchText){
      this.filteredOrders = this.ordersData;
    }
    this.filteredOrders = this.ordersData.filter(order => {
      switch(this.searchOption){
        case 'customerName':
          return  order.customerName.toLowerCase().includes(this.searchText.toLowerCase())
        case 'orderId':
          return order.orderId.toString().startsWith(this.searchText)
        case 'email':
          return  order.email.toLowerCase().includes(this.searchText.toLowerCase())
        case 'note':
          return order.note.toLowerCase().includes(this.searchText.toLowerCase())
        case 'auto':
          return (
            order.customerName.toLowerCase().includes(this.searchText.toLowerCase()) ||
            order.orderId.toString().startsWith(this.searchText) ||
            order.email.toLowerCase().includes(this.searchText.toLowerCase()) ||
            order.note.toLowerCase().includes(this.searchText.toLowerCase())
          )
        default:
          return false
      }
    })
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
      this.updateCurrentOrders();
    }, (error) =>{
      console.error("An error have occurred while trying to get data of orders", error);
    });
    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');
  }
}
