import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, NgModel, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [DatePipe, CommonModule, FormsModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.css'
})
export class OrderFormComponent implements OnInit {
  currentDate: string;
  userMessage: string = '';
  charactersCount: number = 0;

  constructor(private datePipe: DatePipe){}

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
    discountAmount: new FormControl(Validators.min(0), Validators.max(100)),
    orderStatus: new FormControl('nezpracovane-nova-objednavka')
  });

  update(){
    this.charactersCount = this.userMessage.length;
  }
  submitOrder(){
    console.table(this.orderForm.value);
  }

  ngOnInit(): void {
    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');
  }
}
