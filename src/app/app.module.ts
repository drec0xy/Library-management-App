import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { DropdownCompnentComponent } from './components/dropdown-compnent/dropdown-compnent.component';
import { BookscomponentComponent, BookDetailView } from './components/bookscomponent/bookscomponent.component';
import { DashBoardComponent } from './components/dash-board/dash-board.component';
import { BooksOnLendComponent, LendABook } from './components/books-on-lend/books-on-lend.component';
import { OurusersComponent } from './components/ourusers/ourusers.component';
import { NewbookComponent,NewbookComponentForm } from './components/newbook/newbook.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from 'src/material/dialog';
import { MatFormFieldModule } from 'src/material/form-field';
import { MatMenuModule } from 'src/material/menu';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';



@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    TopbarComponent,
    DashBoardComponent,
    DropdownCompnentComponent,
    BookscomponentComponent,
    BooksOnLendComponent,
    OurusersComponent,
    NewbookComponent,
    NewbookComponentForm,
    LendABook,
    BookDetailView   
  ],
  imports: [
    CommonModule,
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    MatDialogModule,
    MatFormFieldModule,
    HttpClientModule,
    MatMenuModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    RouterModule.forRoot([
      { path: '', component: BookscomponentComponent},
      { path: 'dashboard', component: DashBoardComponent},
      { path: 'all-books', component: BookscomponentComponent},
      { path: 'books-on-lend', component: BooksOnLendComponent},
      { path: 'ourusers', component: OurusersComponent},
      { path: 'redzone', component: DashBoardComponent},


      { path: '**', component: AppComponent}
    ]), BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
