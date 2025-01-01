import { Component, OnInit } from '@angular/core';
import { OrderService } from '../services/order.service';
import { CommonModule, DatePipe } from '@angular/common';
import { OrderDTO } from '../order-form/order-form.component';
import { RouterLink } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  providers: [DatePipe],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.css'
})
export class OrdersPageComponent implements OnInit{
  public ordersData: OrderDTO[] = [];
  filteredOrders = [...this.ordersData];
  statuses: string[] = [
    'nezpracovane-nova-objednavka',
    'vybavit-posta',
    'uhradene-vybavit',
    'neuhradene-cakam-na-platbu',
    'neuhradene-udaje-k-platbe-poslat-zakaznikovi-mail',
    'neuhradene-2xmail-poslany-zakaznikovi',
    'vybavit-odlozene-osobny-odber',
    'poslane-neuhradene',
    'dobierka-info-k-objednavke-mail',
    'zasielanie-cisla-zasielky-posta-mail',
    'oprava',
    'objednavka-odoslana-cakam-na-uhradu-dobierkou',
    'objednavka-vybavena',
    'storno',
    'rozbite-znicene-vratene'
  ];
  selectedStatuses: string[] = [];

  currentDate: string;

  isLoading: boolean = true;
  isVisibleCheckbox: boolean = false;
  isVisibleDateFilter: boolean = false;

  dateSortOrder: string = '';

  constructor(private orderService: OrderService, private datePipe: DatePipe){}

  toggleDropdown(dropdown: 'status' | 'date'){
    if(dropdown === 'status'){
      this.isVisibleCheckbox = !this.isVisibleCheckbox;
    }else{
      this.isVisibleDateFilter = !this.isVisibleDateFilter;
    }
  }

  sortByDate(order: 'newest' | 'oldest'): void {
   this.dateSortOrder = order;
   this.applyFilters();
  }
  
  applyFilters(): void {
    let filtered = [...this.ordersData];

    if(this.selectedStatuses.length > 0){
      filtered = filtered.filter(order => this.selectedStatuses.includes(order.orderStatus));
    }

    if(this.dateSortOrder){
      filtered = filtered.sort((a, b) => {
        const dateA = this.parseDate(a.orderDate).getDate();
        const dateB = this.parseDate(b.orderDate).getDate();

        return this.dateSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      })
    }

    this.filteredOrders = filtered;
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
      console.log("Objednávky načítané:", result);
      this.ordersData = result;
      this.filteredOrders = this.ordersData;
      this.isLoading = false;
    }, (error) =>{
      console.error("An error have occurred while trying to get data of orders", error);
    });
    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');
  }
}
