import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownCompnentComponent } from './dropdown-compnent.component';

describe('DropdownCompnentComponent', () => {
  let component: DropdownCompnentComponent;
  let fixture: ComponentFixture<DropdownCompnentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DropdownCompnentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DropdownCompnentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
