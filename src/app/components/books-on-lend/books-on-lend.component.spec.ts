import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BooksOnLendComponent } from './books-on-lend.component';

describe('BooksOnLendComponent', () => {
  let component: BooksOnLendComponent;
  let fixture: ComponentFixture<BooksOnLendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BooksOnLendComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BooksOnLendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
