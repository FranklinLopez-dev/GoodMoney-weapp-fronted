import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { FallbackImgDirective } from '../../directives/fallback-img.directive';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-select-search-async',
  standalone: true,
  imports: [
    TablerIconsModule,
    ReactiveFormsModule,
    MaterialModule,
    NgxMatSelectSearchModule,
    FallbackImgDirective
  ],
  templateUrl: './select-search-async.component.html',
  styleUrls: ['./select-search-async.component.scss']
})
export class SelectSearchAsyncComponent<T extends Record<string, any>>
  implements OnInit, OnDestroy {

  @Input({ required: true }) label!: string;
  @Input() placeholder = 'Buscar...';
  @Input() create = false;
  @Input({ required: true }) items: T[] = [];
  @Input({ required: true }) valueKey!: string;
  @Input({ required: true }) labelKey!: string;
  @Input() imageKey?: string;
  @Input() imageAltKey?: string;
  @Input({ required: true }) control!: FormControl;
  @Output() search = new EventEmitter<string>();
  @Output() selectionChange = new EventEmitter<T>();
  @Output() save = new EventEmitter<T>();

  searchControl = new FormControl('');
  loading = false;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.loading = true;
        this.search.emit(value ?? '');
      });

    this.control.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const selected = this.items.find(
          item => this.resolve(item, this.valueKey) === value
        );
        if (selected) {
          this.selectionChange.emit(selected);
        }
      });
  }

  stopLoading(): void {
    this.loading = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  resolve(obj: any, path: string): any {
    return path.split('.').reduce((o, k) => o?.[k], obj);
  }

  getSelectedItem(): T | null {
    const value = this.control?.value;
    if (value == null) return null;

    return this.items.find(
      item => this.resolve(item, this.valueKey) === value
    ) ?? null;
  }

}