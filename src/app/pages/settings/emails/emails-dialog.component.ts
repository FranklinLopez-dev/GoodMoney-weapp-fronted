import { Component, Inject, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, catchError, debounceTime, finalize, of, switchMap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { EmailsService } from './emails.service';
import { EmailsStore } from './emails.store';
import { noRepetido } from 'src/app/shared/validators/no-repetido.validator';
import { EmailTemplate } from 'src/app/core/models/settings/email.model';
import { UtilsService } from 'src/app/core/services/common/utils.service';
import { BLOQUES, GrupoVariables } from './email-variables';

/** Las variables se insertan pulsando una ficha: un nombre mal escrito no da error, sale vacío en el correo. */
@Component({
  selector: 'app-emails-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TablerIconsModule],
  template: `
  <div class="editor">

    <header class="editor__cabecera">
      <div>
        <h2 class="editor__titulo">{{ isEdit ? 'Editar plantilla' : 'Nueva plantilla' }}</h2>
        <p class="editor__bajada">
          Los cambios se ven a la derecha al momento. Nada se guarda hasta que pulses Guardar.
        </p>
      </div>

      <button mat-icon-button type="button" (click)="cerrar()" aria-label="Cerrar">
        <i-tabler name="x"></i-tabler>
      </button>
    </header>

    <div class="editor__cuerpo" [formGroup]="form">

      <!-- Izquierda: los datos y el HTML -->
      <section class="editor__form">

        <label class="campo">
          <span class="campo__etiqueta">Código<span class="campo__req">*</span></span>
          <input class="campo__input" formControlName="code" placeholder="Ej. OPERATION_CREATED" />
          @if(form.controls.code.touched && form.controls.code.errors?.['required']) {
          <span class="campo__error">Completa este campo antes de guardar.</span>
          } @else if(form.controls.code.touched && form.controls.code.errors?.['repetido']) {
          <span class="campo__error">Ya existe una plantilla con este código.</span>
          } @else {
          <span class="campo__ayuda">Identifica la plantilla desde el backend. No se traduce.</span>
          }
        </label>

        <label class="campo">
          <span class="campo__etiqueta">Asunto<span class="campo__req">*</span></span>
          <input class="campo__input" formControlName="subject" />
          @if(form.controls.subject.touched && form.controls.subject.errors?.['required']) {
          <span class="campo__error">Completa este campo antes de guardar.</span>
          } @else {
          <span class="campo__ayuda">Es lo primero que ve el cliente en su bandeja.</span>
          }
        </label>

        <!-- Paleta de variables: se pulsa y se inserta donde está el cursor. -->
        <div class="variables">
          <p class="variables__titulo">Insertar variable</p>

          @for (grupo of grupos(); track grupo.group) {
          <div class="variables__grupo">
            <span class="variables__nombre">{{ grupo.group }}</span>
            <div class="variables__fichas">
              @for (v of grupo.variables; track v.name) {
              <button type="button" class="variable" [title]="v.description"
                (click)="insertarVariable(v.name)">
                {{ v.name }}
              </button>
              }
            </div>
          </div>
          }

          <div class="variables__grupo">
            <span class="variables__nombre">Bloques</span>
            <div class="variables__fichas">
              @for (b of bloques; track b.nombre) {
              <button type="button" class="variable variable--bloque" [title]="b.descripcion"
                (click)="insertar(b.plantilla)">
                {{ b.nombre }}
              </button>
              }
            </div>
          </div>
        </div>

        <label class="campo">
          <span class="campo__etiqueta">HTML de correo<span class="campo__req">*</span></span>
          <textarea #areaHtml class="campo__input campo__area" rows="16" formControlName="htmlBody"
            spellcheck="false"></textarea>
          @if(form.controls.htmlBody.touched && form.controls.htmlBody.errors?.['required']) {
          <span class="campo__error">Completa este campo antes de guardar.</span>
          }
        </label>

      </section>

      <!-- Derecha: el resultado -->
      <section class="editor__previa">
        <div class="editor__previa-barra">
          <span class="editor__previa-titulo">Vista previa</span>

          @if (renderizando()) {
          <span class="editor__previa-estado">Actualizando…</span>
          } @else if (errorPrevia()) {
          <span class="editor__previa-estado editor__previa-estado--error">{{ errorPrevia() }}</span>
          } @else {
          <span class="editor__previa-estado">Con datos de ejemplo</span>
          }
        </div>

        <!--
          El srcdoc va sin sanear a propósito: el saneador de Angular borra todos
          los atributos de estilo, que es justo de lo que vive un correo — la
          previa salía con la estructura bien pero sin marca, sin colores ni
          anchos. Quien neutraliza el HTML aquí es el sandbox vacío: origen
          opaco, sin scripts, sin formularios y sin poder navegar ni tocar el
          panel.
        -->
        <iframe class="editor__iframe" [srcdoc]="htmlPrevia()" title="Vista previa del correo"
          sandbox=""></iframe>
      </section>

    </div>

    <footer class="editor__pie">
      <div class="editor__prueba">
        <mat-form-field appearance="outline" class="editor__prueba-campo">
          <mat-label>Enviar prueba a</mat-label>
          <input matInput type="email" [value]="correoPrueba()"
            (input)="correoPrueba.set($any($event.target).value)" />
        </mat-form-field>

        <button mat-stroked-button type="button" [disabled]="enviando()" (click)="enviarPrueba()">
          {{ enviando() ? 'Enviando…' : 'Enviar prueba' }}
        </button>
      </div>

      <div class="editor__acciones">
        <button mat-button type="button" (click)="cerrar()">Cancelar</button>
        <button mat-flat-button class="editor__guardar" type="button"
          [disabled]="guardando()" (click)="guardar()">
          {{ guardando() ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </footer>

  </div>
  `,
  styleUrls: ['./emails-dialog.component.scss']
})
export class EmailsDialogComponent {

  @ViewChild('areaHtml') areaHtml?: ElementRef<HTMLTextAreaElement>;

  private fb = inject(FormBuilder);
  private service = inject(EmailsService);
  private toastr = inject(ToastrService);
  private sanitizer = inject(DomSanitizer);

  readonly guardando = signal(false);
  readonly enviando = signal(false);
  readonly renderizando = signal(false);
  readonly errorPrevia = signal<string | null>(null);
  readonly htmlPrevia = signal<SafeHtml>('');
  readonly correoPrueba = signal('');

  readonly bloques = BLOQUES;

  isEdit = false;

  private emailsStore = inject(EmailsStore);

  form = this.fb.nonNullable.group({
    id: [null as any],
    companyId: [null as any],
    code: ['', [Validators.required,
      noRepetido(() => this.emailsStore.items(), 'code', () => this.data?.id)]],
    subject: ['', Validators.required],
    htmlBody: ['', Validators.required]
  });

  /** El catálogo lo sirve el API (PENDIENTES.md #3): a mano no tenía relación real con los DTOs. */
  readonly codigo = signal('');
  readonly grupos = toSignal(
    toObservable(this.codigo).pipe(
      debounceTime(300),
      switchMap(codigo => this.service.getVariables(codigo).pipe(
        // Un error acá no debe apagar el stream, o cambiar el código más tarde ya no recargaría la paleta.
        catchError(() => of([] as GrupoVariables[]))
      ))
    ),
    { initialValue: [] as GrupoVariables[] }
  );

  constructor(
    public appData: UtilsService,
    private dialogRef: MatDialogRef<EmailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EmailTemplate | null
  ) {
    this.isEdit = !!data;

    if (data) {
      this.form.patchValue(data as any);
      this.codigo.set(data.code ?? '');
    }

    this.correoPrueba.set(this.appData.profile()?.email ?? '');

    this.form.controls.code.valueChanges.subscribe(v => this.codigo.set(v ?? ''));

    // Se espera a que deje de teclear: cada render es una llamada al servidor, que es quien sabe interpretar Liquid.
    this.form.controls.htmlBody.valueChanges
      .pipe(debounceTime(600))
      .subscribe(() => this.refrescarPrevia());

    this.refrescarPrevia();
  }

  insertarVariable(nombre: string): void {
    this.insertar(`{{ ${nombre} }}`);
  }

  /** Inserta en la posición del cursor, no al final del documento. */
  insertar(texto: string): void {
    const area = this.areaHtml?.nativeElement;
    const actual = this.form.controls.htmlBody.value ?? '';

    if (!area) {
      this.form.controls.htmlBody.setValue(actual + texto);
      return;
    }

    const ini = area.selectionStart ?? actual.length;
    const fin = area.selectionEnd ?? actual.length;

    this.form.controls.htmlBody.setValue(actual.slice(0, ini) + texto + actual.slice(fin));

    // Deja el cursor detrás de lo insertado, para poder seguir escribiendo.
    queueMicrotask(() => {
      area.focus();
      area.selectionStart = area.selectionEnd = ini + texto.length;
    });
  }

  private refrescarPrevia(): void {
    const html = this.form.controls.htmlBody.value;

    if (!html?.trim()) {
      this.pintar('');
      this.errorPrevia.set(null);
      return;
    }

    this.renderizando.set(true);

    this.service.preview(html)
      .pipe(finalize(() => this.renderizando.set(false)))
      .subscribe({
        next: res => {
          this.pintar(res.html);
          this.errorPrevia.set(null);
        },
        // Un Liquid mal cerrado lo detecta el servidor: se avisa sin romper la edición ni perder lo escrito.
        error: err => this.errorPrevia.set(
          typeof err?.error === 'string' ? err.error : 'No se pudo interpretar la plantilla')
      });
  }

  /** Ver el comentario del iframe: el aislamiento lo pone el sandbox, no el saneador. */
  private pintar(html: string): void {
    this.htmlPrevia.set(html ? this.sanitizer.bypassSecurityTrustHtml(html) : '');
  }

  enviarPrueba(): void {
    const html = this.form.controls.htmlBody.value;
    const code = this.form.controls.code.value;
    const correo = this.correoPrueba().trim();

    if (!html || !code) {
      this.toastr.warning('Completa el código y el HTML antes de enviar la prueba.');
      return;
    }

    if (!correo) {
      this.toastr.warning('Indica a qué correo mandamos la prueba.');
      return;
    }

    this.enviando.set(true);

    this.service.sendPreviewEmail(code, html, correo)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: () => this.toastr.success('Correo enviado correctamente'),
        error: () => this.toastr.error('No se pudo enviar la prueba')
      });
  }

  guardar(): void {
    if (this.guardando()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.form.updateValueAndValidity();
      this.toastr.warning('Completa los campos obligatorios antes de guardar.');
      return;
    }

    this.guardando.set(true);
    const payload = this.form.getRawValue();

    // Tipado explícito: `update` y `create` devuelven observables distintos y la unión no es invocable.
    const peticion: Observable<any> = this.isEdit
      ? this.service.update(payload.id!, payload as any)
      : this.service.create(payload as any);

    peticion.pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (res: any) => {
          this.toastr.success(this.isEdit ? 'Plantilla actualizada' : 'Plantilla creada');
          this.dialogRef.close(this.isEdit ? payload : res);
        },
        error: () => this.toastr.error('No se pudo guardar la plantilla')
      });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
