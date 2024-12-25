import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterOutlet, CommonModule]
})
export class AppComponent implements OnInit {
  title = 'angular-project';
  
  isHidden: boolean = false;

  acceptCookies(){
    localStorage.setItem('cookiesAccepted', 'true');
    this.isHidden = true;
  }
  declineCookies(){
    localStorage.setItem('cookiesAccepted', 'false');
    this.isHidden = true;
  }

  ngOnInit(): void {
    let cookiesAccepted = JSON.parse(localStorage.getItem('cookiesAccepted'));
    if(cookiesAccepted){
      this.isHidden = true;
    }
  }
}
