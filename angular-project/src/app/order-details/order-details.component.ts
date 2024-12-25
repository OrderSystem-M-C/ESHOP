import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../services/order.service';
import { OrderDTO } from '../order-form/order-form.component';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [DatePipe, RouterLink],
  providers: [DatePipe],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css'
})
export class OrderDetailsComponent implements OnInit{
  orderId: number | null = null
  currentDate: string = '';

  order: OrderDTO;

  constructor(private route: ActivatedRoute, private datePipe: DatePipe, private orderService: OrderService){}

  ngOnInit(): void {
    const orderIdParam = this.route.snapshot.paramMap.get('orderId');
    this.orderId = orderIdParam ? parseInt(orderIdParam, 10): null;
    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');

    this.orderService.getOrderDetails(this.orderId).subscribe((result) => {
      this.order = result;
    }, (error) =>{
      console.error("An error occurred", error);
    })
  }
}
