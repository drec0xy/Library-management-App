import { Component, OnInit } from '@angular/core';
import { BooksServiceService } from '../../books-service.service';
import {MatMenuModule} from 'src/material/menu';
import { MatDialog } from 'src/material/dialog';
import { LendABook } from '../books-on-lend/books-on-lend.component';



@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit {
  title!: String;

  constructor(private bookService: BooksServiceService, public dialog: MatDialog) { }

  openDialog() {
    this.dialog.open(LendABook);
  }

  ngOnInit() {
  
    this.bookService.getTitle().subscribe(appTitle => this.title = appTitle);

  }

}
