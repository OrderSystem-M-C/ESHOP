import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import * as html2pdf from 'html2pdf.js';
import { OrderService } from '../services/order.service';
import { HttpResponse } from '@angular/common/http';
import html2canvas from 'html2canvas';

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

  orderId: number = 0;

  constructor(private datePipe: DatePipe, private fb: FormBuilder, public orderService: OrderService){}

  orderForm = new FormGroup({
    name: new FormControl('', Validators.required),
    company: new FormControl(''),
    ico: new FormControl(''),
    dic: new FormControl(''),
    icDph: new FormControl(''),
    address: new FormControl('', Validators.required),
    city: new FormControl('', Validators.required),
    postalCode: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    phoneNumber: new FormControl('', Validators.required),
    note: new FormControl(''),
    deliveryOption: new FormControl('', Validators.required),
    paymentOption: new FormControl('', Validators.required),
    discountAmount: new FormControl(0),
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
        orderStatus: this.orderForm.value.orderStatus,
        orderDate: this.currentDate
      };
      this.orderService.createOrder(order).subscribe((response: OrderDTO) => {
        console.log("Order created successfully!", response);
        this.orderId = response.orderId;
        this.createInvoice();
      }, (error) => {
        console.error("An error occured while trying to create order", error)
      });
    }
  }

  createInvoice(){
    const invoiceHTML = ` <div style="width: 100%;box-sizing: border-box; padding: 40px">
        <div class="title-element" style="font-family: Arial, Helvetica, sans-serif; text-align: center;">
          <h2>Číslo objednávky: <strong>${this.orderId}</strong></h2>
        </div>
        <div class="first-table">
          <table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse; text-align: center;">
            <tr>
              <th style="padding: 8px; text-align: left; background-color: #f9f9f9;">Dátum</th>
              <td style="padding: 8px;">${this.currentDate}</td>
            </tr>
            <tr>
              <th style="padding: 8px; text-align: left; background-color: #f9f9f9;">Hmotnosť objednávky</th>
              <td style="padding: 8px;">0kg</td>
            </tr>
            <tr>
              <th style="padding: 8px; text-align: left; background-color: #f9f9f9;">Celkový počet produktov</th>
              <td style="padding: 8px;">0ks</td>
            </tr>
            <tr>
              <th style="padding: 8px; text-align: left; background-color: #f9f9f9;">IP adresa</th>
              <td style="padding: 8px;">192.168.10.1</td>
            </tr>
          </table>
        </div>
        <div class="second-table" style="margin-top: 12.5px">
          <h3>Objednané produkty:</h3>
          <table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse; text-align: center;">
            <tr style="background-color: #f9f9f9;">
              <th style="padding: 10px;">Číslo produktu</th>
              <th style="padding: 10px;">Cena/ks</th>
              <th style="padding: 10px;">Ks</th>
              <th style="padding: 10px;">Celkom</th>
            </tr>
            <tr>
              <td style="padding: 8px;">*</td>
              <td style="padding: 8px;">0€</td>
              <td style="padding: 8px;">0ks</td>
              <td style="padding: 8px;">0€</td>
            </tr>
            <tr>
              <td>Spôsob dopravy: ${this.orderForm.value.deliveryOption}</td>
              <td></td>
              <td></td>
              <td>0€</td>
            </tr>
            <tr>
              <td>Spôsob platby: ${this.orderForm.value.paymentOption}</td>
              <td></td>
              <td></td>
              <td>0€</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">CELKOM:</td>
              <td></td>
              <td></td>
              <td style="font-weight: bold;">0€</td>
            </tr>
          </table>
        </div>
        <div class="third-table" style="margin-top: 12.5px">
          <h3>Objednávateľ:</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">
            <tr>
              <th style="padding: 8px; text-align: left; background-color: #f9f9f9;">Meno</th>
              <td style="padding: 8px;">${this.orderForm.value.name}</td>
            </tr>
            <tr>
              <th style="padding: 8px; text-align: left; background-color: #f9f9f9;">Firma</th>
              <td style="padding: 8px;">${this.orderForm.value.company}</td>
            </tr>
            <tr>
              <th style="padding: 8px; text-align: left; background-color: #f9f9f9;">IČO (v prípade firmy)</th>
              <td style="padding: 8px;">${this.orderForm.value.ico}</td>
            </tr>
            <tr>
              <th style="padding: 8px; text-align: left; background-color: #f9f9f9;">DIČ (v prípade firmy)</th>
              <td style="padding: 8px;">${this.orderForm.value.dic}</td>
            </tr>
            <tr>
              <th style="padding: 8px; text-align: left; background-color: #f9f9f9;">Adresa</th>
              <td style="padding: 8px;">
                ${this.orderForm.value.address}, ${this.orderForm.value.city}, ${this.orderForm.value.postalCode}
              </td>
            </tr>
            <tr>
              <th style="padding: 8px; text-align: left; background-color: #f9f9f9">Email</th>
              <td style="padding: 8px;">${this.orderForm.value.email}</td>
            </tr>
            <tr>
              <th style="padding: 8px; text-align: left; background-color: #f9f9f9">Telefón</th>
              <td style="padding: 8px;">${this.orderForm.value.phoneNumber}</td>
            </tr>
          </table>
        </div>
      </div>`

      const options = {
        margin: 5,
        filename: `Faktúra_č${this.orderId}.pdf`,
        html2canvas: { scale: 2 }
      };

      if(invoiceHTML){
        html2pdf().set(options).from(invoiceHTML).save();
      }
  }

  ngOnInit(): void {
    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');
  }
}
export interface OrderDTO {
  orderId?: number;
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
  orderDate?: string;
}
