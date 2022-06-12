import { Component, OnInit } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser'
import { BooksServiceService } from '../../books-service.service';
import { MatDialog } from 'src/material/dialog'
import { MatFormFieldModule } from 'src/material/form-field';
import  books from 'src/app/db.json';
import users from 'src/app/db.json';
import LendedBooks from 'src/app/db.json';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup } from '@angular/forms';
import { bookModel, User, lendedBook } from '../../model/Bookodel';
import { CommonModule } from '@angular/common';






@Component({
  selector: 'app-books-on-lend',
  templateUrl: './books-on-lend.component.html',
  styleUrls: ['./books-on-lend.component.css']
})
export class BooksOnLendComponent implements OnInit {

  constructor(private bookService: BooksServiceService, public dialog: MatDialog) { }

  ngOnInit(): void {
    this.bookService.setTitle('Books on Lend');

  }
  BooksOnLend: lendedBook[] = books.LendedBooks;

  
  returned(){
    this.BooksOnLend.pop();
 }
}

@Component({
  selector: 'app-book-lend-a-book',
  templateUrl: './app-book-lend-a-book.html',
  styleUrls: ['./books-on-lend.component.css']
})

export class LendABook {
    constructor(private formbulder: FormBuilder){}
    formValue ! : FormGroup;

     BookList : bookModel [] = books.books;

     UsersList: User[] = books.users;

     BooksOnLend: lendedBook[] = books.LendedBooks;


     LendOut(data: lendedBook){
        this.BooksOnLend.push(data);
        console.log(this.BooksOnLend);
     }

}