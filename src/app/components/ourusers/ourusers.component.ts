import { Component, OnInit } from '@angular/core';
import { BooksServiceService } from "./../../books-service.service"
import books from 'src/app/db.json'


@Component({
  selector: 'app-ourusers',
  templateUrl: './ourusers.component.html',
  styleUrls: ['./ourusers.component.css']
})
export class OurusersComponent implements OnInit {

  constructor(private bookService: BooksServiceService ) { }

  public Users : { 
    username: string, 
    userID: string, 
    profilepic: string, 
    }[] = books.users;

  ngOnInit(): void {

    this.bookService.setTitle('Our Users');

  }

}




 

  

