import { Component, OnInit } from '@angular/core';
import { BooksServiceService } from "./../../books-service.service"

@Component({
  selector: 'app-dash-board',
  templateUrl: './dash-board.component.html',
  styleUrls: ['./dash-board.component.css']
})
export class DashBoardComponent implements OnInit {

  constructor(private bookService: BooksServiceService) { }

  ngOnInit() {
    this.bookService.setTitle('Dashboard');

  }
}

