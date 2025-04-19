import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent implements OnInit {
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;
  @Input() limitItems: number = 0;
  @Output() changePage = new EventEmitter<number>();

  pages: number[] = [];

  constructor(){}

  range(start: number, end: number): number[] {
    return [...Array(end).keys()].map(el => el + start);
  }
  calculatePages(){
    const pagesCount = Math.ceil(this.totalItems / this.limitItems);
    this.pages = this.range(1, pagesCount);
  }
  changePages(direction: string){
    let newPage = this.currentPage;
    if(direction === 'right' && this.currentPage < this.pages.length){
      newPage++;
    }else if(direction === 'left' && this.currentPage > 1){
      newPage--;
    }
    if(newPage != this.currentPage){
      this.changePage.emit(newPage);
    }
  }
  ngOnInit(): void {
    this.calculatePages();
  }
  ngOnChanges(): void {
    this.calculatePages();
  }
}
