import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageStatusesDialogComponent } from './manage-statuses-dialog.component';

describe('ManageStatusesDialogComponent', () => {
  let component: ManageStatusesDialogComponent;
  let fixture: ComponentFixture<ManageStatusesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageStatusesDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ManageStatusesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
