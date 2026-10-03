import { Component, computed, inject, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/core/auth/auth.service';
import { SelectSearchAsyncComponent } from 'src/app/shared/components/select-search-async/select-search-async.component';
import { Activities } from 'src/app/core/models';

@Component({
    selector: 'register-juridico-step5-activity',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MaterialModule,
        NgxMatSelectSearchModule,
        SelectSearchAsyncComponent
    ],
    template: `
    <div class="auth-section">
      <h2 class="auth-section__title">Actividad económica</h2>
      <p class="auth-section__hint">Cuéntanos a qué te dedicas, indique la actividad económica actual para fines de registro.</p>
    </div>

    <div [formGroup]="group">
        <app-select-search-async class="w-100"
          label="Actividad económica"
          [items]="filteredActivities"
          valueKey="id"
          labelKey="description"
          [control]="activity"
          (search)="loadActivities($event)">
        </app-select-search-async>
    </div>
  `
})
export class JuridicoStep5ActivityComponent implements OnInit {

    @Input({ required: true }) group!: FormGroup;
    authService = inject(AuthService);

    get activity() {
        return this.group.get('activityId') as FormControl;
    }

    activities = computed(() =>
        this.authService.authTable()?.activities ?? []
    );
    filteredActivities: Activities[] = [];

    ngOnInit() {
        this.filteredActivities = this.activities();
    }

    loadActivities = (search: string) => {
        this.filteredActivities = this.activities().filter(a =>
            a.description.toLowerCase().includes(search.toLowerCase())
        );
    };

}