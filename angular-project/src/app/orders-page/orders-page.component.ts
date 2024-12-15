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

  currentDate: string;

  constructor(private orderService: OrderService, private datePipe: DatePipe){}

  ngOnInit(): void {
    this.orderService.getOrders().subscribe((result) =>{
      console.log("Objednávky načítané:", result);
      this.ordersData = result;
    }, (error) =>{
      console.error("An error have occurred while trying to get data of orders", error);
    });
    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');
  }
}
