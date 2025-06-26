import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EphSettingsComponent } from './eph-settings.component';

describe('EphSettingsComponent', () => {
  let component: EphSettingsComponent;
  let fixture: ComponentFixture<EphSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EphSettingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EphSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
