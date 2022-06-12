import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import books from 'src/app/db.json';




@Injectable({
  providedIn: 'root'
})
export class BooksServiceService {

  private title = new BehaviorSubject<String>('App title');
  private title$ = this.title.asObservable();

  constructor() { }
  setTitle(title: String) {
    this.title.next(title);
  }
  getTitle(): Observable<String> {
    return this.title$;
}

getQty(){

}


}

export class NewbookSerevice{


}



