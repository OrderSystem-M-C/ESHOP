import { Component, OnInit } from '@angular/core';
import { OrderService } from '../services/order.service';
import { CommonModule, DatePipe } from '@angular/common';
import { OrderDTO } from '../order-form/order-form.component';
import { RouterLink } from '@angular/router';

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
  isVisible: boolean = false;

  constructor(private orderService: OrderService, private datePipe: DatePipe){}

  toggleDropdown(){
    this.isVisible = !this.isVisible;
  }

  onCheckboxChange(event: Event){
    const checkBox = event.target as HTMLInputElement;
    const value = checkBox.value;

    if(checkBox.checked){
      this.selectedStatuses.push(value);
    }else{
      this.selectedStatuses = this.selectedStatuses.filter(status => status !== value);
    }

    this.filterOrders();
  }

  filterOrders(): void{
    if(this.selectedStatuses.length === 0){
      this.filteredOrders = [...this.ordersData];
    }else{
      this.filteredOrders = this.ordersData.filter(order => this.selectedStatuses.includes(order.orderStatus));
    }
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
