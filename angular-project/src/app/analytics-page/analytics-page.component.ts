import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { OrderDTO, OrderService, OrderStatusDTO, ProductStatsDTO } from '../services/order.service';
import { finalize, forkJoin } from 'rxjs';
import { ApexFill, ApexStroke, ApexXAxis, ApexYAxis, NgApexchartsModule } from "ng-apexcharts";
import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexLegend,
  ApexResponsive,
  ApexAxisChartSeries
} from "ng-apexcharts";
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CustomPaginatorIntl } from '../services/custom-paginator-intl.service';

export type PieChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  responsive: ApexResponsive[];
  fill: ApexFill;
};

export type OrdersChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  colors: string[];
};

export type RevenueChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  fill: ApexFill;
  colors: string[];
}

export type ProductsChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  colors: string[];
};

@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [NgApexchartsModule, CommonModule, RouterLink, MatPaginatorModule],
  providers: [DatePipe, { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }],
  templateUrl: './analytics-page.component.html',
  styleUrl: './analytics-page.component.css'
})
export class AnalyticsPageComponent implements OnInit{
  currentDate: string = 'Načítava sa...';

  ordersData: OrderDTO[] = [];

  productStats: ProductStatsDTO[] = [];

  statuses: OrderStatusDTO[] = [];

  emailCounts: Record<string, number> = {};
  filteredEmailCounts: any[] = [];

  isLoading: boolean = true;

  public pieChartOptions: Partial<PieChartOptions>;
  public ordersChartOptions: Partial<OrdersChartOptions>;
  public revenueChartOptions: Partial<RevenueChartOptions>;
  public productsChartOptions: Partial<ProductsChartOptions>;

  selectedRange: '1d' | '7d' | '1m' | '1y' | 'all' = 'all';

  totalRevenue: number = 0;
  totalRevenueAllTime: number = 0;

  totalOrders: number = 0;
  totalOrdersAllTime: number = 0;

  totalItems: number = 0;
  pageIndex: number = 0;
  pageSize: number = 6;

  constructor(
    private datePipe: DatePipe,
    private orderService: OrderService,
    private snackBar: MatSnackBar
  ){}

  exportData() {
    this.snackBar.open("Funkcia exportovania dát do súboru CSV ešte nie je dostupná!", "", { duration: 2500 });
  }

  updatePagedEmails(): void {
    const emailEntries = Object.entries(this.emailCounts);
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredEmailCounts = emailEntries.slice(startIndex, endIndex);
  }
  
  handlePageEvent(pageEvent: PageEvent){
    this.pageSize = pageEvent.pageSize;
    this.pageIndex = pageEvent.pageIndex;
    this.updatePagedEmails();
  }

  onRangeChange(event: Event, chart: 'orders' | 'revenue'): void {
    const value = (event.target as HTMLSelectElement).value as '1d' | '7d' | '1m' | '1y' | 'all';
    this.changeRange(value, chart);
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

  changeRange(range: '1d' | '7d' | '1m' | '1y' | 'all', chart: 'orders' | 'revenue'){
    this.selectedRange = range;

    const filteredOrders = this.filterOrdersByRange();

    this.totalRevenue = parseFloat(
      filteredOrders.reduce((total, order) => total + (order.totalPrice || 0), 0).toFixed(2)
    );
    this.totalOrders = filteredOrders.length;

    chart === 'orders' ? this.prepareOrdersChartData(filteredOrders) : this.prepareRevenueChartData(filteredOrders);
  }
  
  parseDate(dateString: string): Date {
    if(!dateString.includes(' ')){
      console.error('An error have occurred with dateString', dateString);
      return new Date(NaN);
    }
    
    const[datePart, timePart] = dateString.split(' ');

    if(!datePart.includes('.') || !timePart.includes(':')){
      console.error('An error have occurred with datePart or timePart: ', dateString);
      return new Date(NaN);
    }

    const[day, month, year] = datePart.split('.').map(Number);
    const [hours, minutes, secondsRaw] = timePart.split(':').map(Number);

    const seconds = Number.isNaN(secondsRaw) ? 0 : secondsRaw;

    if ([day, month, year, hours, minutes, seconds].some(val => Number.isNaN(val))) {
      console.error('Invalid time or date values:', dateString);
      return new Date(NaN);
    }

    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  private preparePieChartData(orders: OrderDTO[] = this.ordersData) {
    const statusCounts: { [key: string]: number } = {};

    orders.forEach(order => {
      statusCounts[order.orderStatus] = (statusCounts[order.orderStatus] || 0) + 1;
    });

    const activeStatuses = this.statuses.filter(s => statusCounts[s.statusName] > 0);

    this.pieChartOptions = {
      series: activeStatuses.map(s => statusCounts[s.statusName]),
      chart: { type: "pie", height: 350 },
      labels: activeStatuses.map(s => s.statusName),
      fill: { colors: activeStatuses.map(s => s.statusColor) },
      dataLabels: { 
        enabled: true,
        formatter: (val, opts) => {
          const idx = opts.seriesIndex;
          const count = opts.w.globals.series[idx];
          return count.toString();
        } 
      },
      legend: { position: "bottom" },
      responsive: [{
        breakpoint: 480,
        options: { chart: { width: 300 }, legend: { position: "bottom" } }
      }]
    };
  }

  private prepareOrdersChartData(orders: OrderDTO[] = this.ordersData) {
    const grouped = this.groupOrdersByDate(orders);
    const labels = Object.keys(grouped);
    const values = Object.values(grouped).map(o => o.totalCount);

    this.ordersChartOptions = {
      series: [{ name: 'Počet objednávok', data: values }],
      chart: { type: "bar", height: 250 },
      xaxis: { categories: labels },
      yaxis: { title: { text: 'Počet objednávok (ks)'} },
      colors: [ "198754"]
    }
  }

  private prepareRevenueChartData(orders: OrderDTO[] = this.ordersData) {
    const grouped = this.groupOrdersByDateRevenue(orders);
    const labels = Object.keys(grouped);
    const values = Object.values(grouped).map(o => o.totalRevenue);

    this.revenueChartOptions = {
      series: [{ name: "Tržba (€)", data: values }],
      chart: { type: "area", height: 250 },
      xaxis: { categories: labels },
      yaxis: { title: { text: "Tržba (€)"} },
      dataLabels: { enabled: true },
      stroke: { curve: "smooth" },
      fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.2 } },
      colors: ["#198754"]
    }
  }

  private prepareProductsChartData() {
    const labels = this.productStats.map(s => s.productName);
    const values = this.productStats.map(s => s.quantity);

    this.productsChartOptions = {
      series: [{ name: 'Počet produktov:', data: values }],
      chart: { type: 'bar', height: 350 },
      xaxis: { categories: labels },
      yaxis: { title: { text: 'Počet kusov (ks)'} },
      dataLabels: { enabled: true },
      colors: ['#198754']
    }
  }

  private prepareEmailsData(emailsList: string[]) {
    emailsList.forEach(e => {
      this.emailCounts[e] = (this.emailCounts[e] || 0) + 1;
    });

    this.totalItems = Object.keys(this.emailCounts).length;
    this.pageIndex = 0;

    this.updatePagedEmails();
  }

  groupOrdersByDate(orders: OrderDTO[]): { [date: string] : { totalCount: number } } {
      const grouped = orders.reduce((acc, order) => {
        const [datePart] = order.orderDate.split(' ');
        const [day, month, year] = datePart.split('.').map(Number);
        const formattedDate = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
  
        if(!acc[formattedDate]){
          acc[formattedDate] = { totalCount: 0};
        }
        acc[formattedDate].totalCount += 1;
  
        return acc;
      }, {} as { [date: string]: { totalCount: number }});
  
      return this.sortObjectsByDateAsc(grouped);
    }
  groupOrdersByDateRevenue(orders: OrderDTO[]): { [date: string]: { totalRevenue: number } } {
    const grouped = orders.reduce((acc, order) => {
      const [datePart] = order.orderDate.split(' ');
      const [day, month, year] = datePart.split('.').map(Number);
      const formattedDate = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
  
      if (!acc[formattedDate]) acc[formattedDate] = { totalRevenue: 0 };
      acc[formattedDate].totalRevenue += parseFloat(order.totalPrice.toFixed(2));

      return acc;
    }, {} as { [date: string]: { totalRevenue: number } });
  
    return this.sortObjectsByDateAsc(grouped);
  }
  private sortObjectsByDateAsc<T>(obj: { [date: string]: T}): { [date: string]: T } {
    return Object.fromEntries(
      Object.entries(obj).sort((a, b) => {
        const [dateA, monthA, yearA] = a[0].split('.').map(Number);
        const [dateB, monthB, yearB] = b[0].split('.').map(Number);
        return new Date(yearA, monthA - 1, dateA).getTime() - new Date(yearB, monthB - 1, dateB).getTime();
      })
    )
  }

  ngOnInit(): void {
    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');
    
    forkJoin({
      orders: this.orderService.getOrders(),
      productStats: this.orderService.getProductStats(),
      statuses: this.orderService.getOrderStatuses()
    }).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ({ orders, productStats, statuses }) => {
        this.ordersData = orders;
        this.productStats = productStats;
        this.statuses = statuses;

        this.totalRevenueAllTime = parseFloat(
          orders.reduce((total, order) => total + (order.totalPrice || 0), 0).toFixed(2)
        );
        this.totalRevenue = this.totalRevenueAllTime;

        this.totalOrdersAllTime = orders.length;
        this.totalOrders = this.totalOrdersAllTime;

        this.preparePieChartData();
        this.prepareOrdersChartData();
        this.prepareRevenueChartData();
        this.prepareProductsChartData();
        this.prepareEmailsData(
          orders.map(o => o.email)
        );
      },
      error: (err) => console.error(err)
    })
  }
}
