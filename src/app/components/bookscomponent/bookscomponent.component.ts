import { Component, OnInit } from '@angular/core';
import books from 'src/app/db.json'
import { bookModel } from '../../model/Bookodel';
import { BooksServiceService } from "./../../books-service.service";
import { MatDialog } from'src/material/dialog';



@Component({
  selector: 'app-bookscomponent',
  templateUrl: './bookscomponent.component.html',
  styleUrls: ['./bookscomponent.component.css']
})
export class BookscomponentComponent implements OnInit {

  constructor(private bookService: BooksServiceService,public dialog: MatDialog) { }

  openDialog() {
    this.dialog.open(BookDetailView);
  }

  public BookList : bookModel [] = books.books;
  

  ngOnInit(): void {
    this.bookService.setTitle('All Books');

  }

}

@Component({
  selector: 'app-book-detail-view',
  templateUrl: './app-book-detail-view.html',
  styleUrls: ['./bookscomponent.component.css']

})

export class BookDetailView {

  public BookList : bookModel [] = books.books;


  constructor(public dialog: MatDialog){ }
}






 

  

