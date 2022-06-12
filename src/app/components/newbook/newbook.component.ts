import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup} from '@angular/forms'
import {MatFormFieldModule} from 'src/material/form-field';
import { MatDialog } from 'src/material/dialog'
import books from 'src/app/db.json'
import { bookModel } from '../../model/Bookodel';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-newbook',
  templateUrl: './newbook.component.html',
  styleUrls: ['./newbook.component.css']
})
export class NewbookComponent implements OnInit {

  constructor(public dialog: MatDialog) {}
  openDialog() {
    this.dialog.open(NewbookComponentForm);
  }

  ngOnInit(): void {

  }

}

@Component({
  selector: 'app-newbook-form',
  templateUrl: './app-newbook-form.html',
  styleUrls: ['newbook.component.css'],
})
export class NewbookComponentForm {
  formValue ! : FormGroup;

  constructor( private formbulder: FormBuilder) {}
  public BookList : bookModel[] = books.books;

  AddBook(data : bookModel){
    this.BookList.push(new bookModel(data));

  }

  ngOnInit(): void {
    

  }
  

}