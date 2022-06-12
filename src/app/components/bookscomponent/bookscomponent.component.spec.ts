import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookscomponentComponent } from './bookscomponent.component';

describe('BookscomponentComponent', () => {
  let component: BookscomponentComponent;
  let fixture: ComponentFixture<BookscomponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BookscomponentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BookscomponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
