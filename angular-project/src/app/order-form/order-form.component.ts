import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import * as html2pdf from 'html2pdf.js';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [DatePipe, CommonModule, FormsModule, ReactiveFormsModule],
  providers: [DatePipe, OrderService],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.css'
})
export class OrderFormComponent implements OnInit {
  currentDate: string;
  userMessage: string = '';
  charactersCount: number = 0;

  constructor(private datePipe: DatePipe, private fb: FormBuilder, public orderService: OrderService){}

  orderForm = new FormGroup({
    name: new FormControl('', Validators.required),
    company: new FormControl('', Validators.required),
    ico: new FormControl('', Validators.required),
    dic: new FormControl('', Validators.required),
    icDph: new FormControl('', Validators.required),
    address: new FormControl('', Validators.required),
    city: new FormControl('', Validators.required),
    postalCode: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    phoneNumber: new FormControl('', Validators.required),
    note: new FormControl(''),
    deliveryOption: new FormControl('', Validators.required),
    paymentOption: new FormControl('', Validators.required),
    discountAmount: new FormControl(0, Validators.required),
    orderStatus: new FormControl('nezpracovane-nova-objednavka')
  });

  update(){
    this.charactersCount = this.userMessage.length;
  }
  submitOrder(){
    if(this.orderForm.valid){
      let order: OrderDTO = {
        name: this.orderForm.value.name,
        company: this.orderForm.value.company,
        ico: this.orderForm.value.ico,
        dic: this.orderForm.value.dic,
        icDph: this.orderForm.value.icDph,
        address: this.orderForm.value.address,
        city: this.orderForm.value.city,
        postalCode: this.orderForm.value.postalCode,
        email: this.orderForm.value.email,
        phoneNumber: this.orderForm.value.phoneNumber,
        note: this.orderForm.value.note || '',
        deliveryOption: this.orderForm.value.deliveryOption,
        paymentOption: this.orderForm.value.paymentOption,
        discountAmount: this.orderForm.value.discountAmount,
        orderStatus: this.orderForm.value.orderStatus
      };
      this.orderService.createOrder(order).subscribe((response) => {
        console.log("Order created successfully!", response);
      }, (error) => {
        console.error("An error occured while trying to create order", error)
      });
    }
  }

  ngOnInit(): void {
    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');
  }
}
export interface OrderDTO {
  name: string;
  company: string;
  ico: string;
  dic: string;
  icDph: string;
  address: string;
  city: string;
  postalCode: string;
  email: string;
  phoneNumber: string;
  note: string;
  deliveryOption: string;
  paymentOption: string;
  discountAmount: number;
  orderStatus: string;
}
