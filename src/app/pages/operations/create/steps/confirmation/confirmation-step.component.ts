import {
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { OperationCreateStore } from '../../store/operation-create.store';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { OperationsService } from '../../../operations.service';
import { OperationsRealtimeService } from '../../../operations-realtime.service';

@Component({
  selector: 'app-confirmation-step',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TablerIconsModule],
  templateUrl: './confirmation-step.component.html',
  styleUrls: ['./confirmation-step.component.scss']
})
export class ConfirmationStepComponent {
  @Input({ required: true }) form!: FormGroup;

  @Output() finish = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  public store = inject(OperationCreateStore);
  private service = inject(OperationsService);
  private toastr = inject(ToastrService);
  private realtime = inject(OperationsRealtimeService);   

  readonly quote = computed(() => this.store.quote());
  readonly accounts = computed(() => this.store.accounts());
  readonly transfer = computed(() => this.store.transfer());
  loading = signal(false);

  ngOnInit(): void {
    this.initFormControls();
  }

  initFormControls() {
    if (this.form.contains('voucherCode')) return;
    this.form.addControl('voucherCode', this.fb.control(null, Validators.required));
    this.form.addControl('voucherImage', this.fb.control(null, Validators.required));
    this.form.addControl('preview', this.fb.control(null, Validators.required));
  }

  get f() {
    return this.form.controls;
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.form.get('voucherImage')?.setValue(file);

    const reader = new FileReader();
    reader.onload = () => {
      this.form.get('preview')?.setValue(reader.result as string);
    }
    reader.readAsDataURL(file);
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const payload = {
      id: Number(this.transfer()?.operationId),
      companyBankId: this.transfer()?.companyBank?.id,
      codeOperation: this.form.value.voucherCode,
      operationImageByte: this.form.value.preview?.split(',')[1] ?? null
    };

    this.service.update(payload as any).pipe(
      finalize(() => {
        this.loading.set(false);
      })
    )
      .subscribe({
        next: (response) => {
          if (response == 'OK') {
            this.realtime.addNewOperation();
            this.toastr.success(
              'Voucher enviado correctamente',
              'Operación confirmada'
            );
            this.finish.emit();
          } else {
            this.toastr.warning(response, "Advertencia");
          }
        }
      });
  }
}
