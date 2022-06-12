import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurusersComponent } from './ourusers.component';

describe('OurusersComponent', () => {
  let component: OurusersComponent;
  let fixture: ComponentFixture<OurusersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OurusersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OurusersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
