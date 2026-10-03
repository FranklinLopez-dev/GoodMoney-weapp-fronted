import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/core/auth/auth.service';
import { SelectSearchAsyncComponent } from 'src/app/shared/components/select-search-async/select-search-async.component';
import { Positions } from 'src/app/core/models';

@Component({
    selector: 'register-step-position',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MaterialModule,
        NgxMatSelectSearchModule,
        SelectSearchAsyncComponent
    ],
    template: `
    <div class="auth-section">
      <h2 class="auth-section__title">Ocupación y/o profesión</h2>
      <p class="auth-section__hint">Cuéntanos a qué te dedicas, indique su ocupación y/o profesión actual para fines de registro.</p>
    </div>

    <div [formGroup]="group">
        <app-select-search-async class="w-100"
          label="Ocupación y/o profesión"
          [items]="filteredPositions"
          valueKey="id"
          labelKey="description"
          [control]="position"
          (search)="loadPositions($event)">
        </app-select-search-async>
    </div>
  `
})
export class StepPositionComponent implements OnInit {

    @Input({ required: true }) group!: FormGroup;
    authService = inject(AuthService);

    get position() {
        return this.group.get('positionId') as FormControl;
    }

    positions = computed(() =>
        this.authService.authTable()?.positions ?? []
    );
    filteredPositions: Positions[] = [];

    ngOnInit() {
        this.filteredPositions = this.positions();
    }

    loadPositions = (search: string) => {
        this.filteredPositions = this.positions().filter(p =>
            p.description.toLowerCase().includes(search.toLowerCase())
        );
    };

}