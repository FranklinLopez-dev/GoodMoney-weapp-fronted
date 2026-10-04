import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { MatDialog } from '@angular/material/dialog';
import { navItems } from '../sidebar/sidebar-data';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/core/auth/auth.service';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { AppSettings } from 'src/app/config';
import { MatDividerModule } from '@angular/material/divider';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { UtilsService } from 'src/app/core/services/common/utils.service';
import { environment } from 'src/environments/environment';
import { SocketService } from 'src/app/services/socket.service';
import { ToastrService } from 'ngx-toastr';
import { NotificationsService } from 'src/app/pages/notifications/notifications.service';
import { ChatsService } from 'src/app/pages/chats/chats.service';
import { Notifications } from 'src/app/core/models';
import { operationIdDeNotificacion, rutaDeNotificacion } from 'src/app/pages/notifications/notification-link';

interface notifications {
  id: number;
  icon: string;
  color: string;
  title: string;
  time: string;
  subtitle: string;
}

interface inbox {
  id: number;
  bgcolor: string;
  imagePath: string;
  title: string;
  time: string;
  subtitle: string;
}

interface profiledd {
  id: number;
  title: string;
  link: string;
  icon?: string;
  new?: boolean;
  /** Entrada de cerrar sesión; se identifica por esta bandera, no por `id`. */
  logout?: boolean;
}

interface apps {
  id: number;
  icon: string;
  color: string;
  title: string;
  subtitle: string;
  link: string;
}

// Módulos de Material sueltos: `MaterialModule` reexporta 35 y los mete en
// el bundle inicial.
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { ArchivoPrivadoPipe } from 'src/app/shared/pipes/archivo-privado.pipe';

@Component({
  selector: 'app-header',
  imports: [ArchivoPrivadoPipe, 
    RouterModule,
    CommonModule,
    NgScrollbarModule,
    TablerIconsModule,
    MatToolbarModule,
    MatMenuModule,
    MatButtonModule,
    MatBadgeModule,
    FallbackImgDirective
  ],
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent {
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  showFiller = false;
  public readonly baseUrl = environment.apiUrl;

  public selectedLanguage: any = {
    language: 'English',
    code: 'en',
    type: 'US',
    icon: '/assets/images/flag/icon-flag-en.svg',
  };

  public languages: any[] = [
    {
      language: 'English',
      code: 'en',
      type: 'US',
      icon: '/assets/images/flag/icon-flag-en.svg',
    },
    {
      language: 'Español',
      code: 'es',
      icon: '/assets/images/flag/icon-flag-es.svg',
    },
    {
      language: 'Français',
      code: 'fr',
      icon: '/assets/images/flag/icon-flag-fr.svg',
    },
    {
      language: 'German',
      code: 'de',
      icon: '/assets/images/flag/icon-flag-de.svg',
    },
  ];

  @Output() optionsChange = new EventEmitter<AppSettings>();

  private authService = inject(AuthService);

  constructor(
    private settings: CoreService,
    private socket: SocketService,
    private router: Router,
    private toastr: ToastrService,
    public appData: UtilsService,
    private notificationsService: NotificationsService,
    private chatsService: ChatsService,
    public dialog: MatDialog,
    private translate: TranslateService
  ) {
    translate.setDefaultLang('en');
  }

  ngOnInit(): void {
    this.socket.start();

    this.socket.on<string>('ShowNotification', msg => this.addNotification(msg));
    this.socket.on<string>('ShowNotificationAdmin', msg => this.addNotification(msg));
    this.socket.on<string>('ShowNotificationRefresh', msg => this.addNotification(msg));
    this.socket.on<string>('ShowNotificationnMessage', msg => this.addChat(msg));
  }

  addNotification(msg: any): void {
    if (msg === 'OK') {
      this.toastr.info('Tienes una notificación.', 'Éxito');
      // Sin el subscribe el observable no se ejecuta y el globo no se actualiza.
      this.notificationsService.getNotificationsNotRead().subscribe(response => {
        if (response.notifications?.length) {
          this.notificationsService.show(
            response.notifications[0].nombresEnvia,
            response.notifications[0].message
          );
        }
      });
    }
  }

  /** No marca leída ni baja el globo: eso se decide en la bandeja. */
  abrirNotificacion(notification: Notifications): void {
    const ruta = rutaDeNotificacion(notification);
    const operationId = operationIdDeNotificacion(notification);

    this.router.navigate(
      [ruta],
      operationId && ruta === '/operations'
        ? { queryParams: { operationId } }
        : undefined
    );
  }

  addChat(msg: any): void {
    if (msg === 'OK') {
      this.toastr.info('Tienes un nuevo mensaje.', 'Éxito');
      this.chatsService.getChatsNotRead();
    }
  }


  onProfileMenuClick(profileItem: profiledd): void {
    if (profileItem.logout) {
      this.authService.logout();
    }
  }

  profile = this.appData.profile;

  /** Resalta el icono del header mientras se navega dentro de su sección. */
  enSeccion(prefijo: string): boolean {
    return this.router.url.startsWith(prefijo);
  }

  /** Primer nombre para el saludo en pantallas angostas. */
  primerNombre(): string {
    return this.profile()?.names?.trim().split(/\s+/)[0] ?? '';
  }

  /**
   * El perfil puede traer una ruta de foto que no existe: sin esto sale el
   * icono de imagen rota.
   */
  fotoRota = false;
  options = this.settings.getOptions();

  openDialog() {
    const dialogRef = this.dialog.open(AppSearchDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {

    });
  }

  changeLanguage(lang: any): void {
    this.translate.use(lang.code);
    this.selectedLanguage = lang;
  }

  setlightDark(theme: string) {
    this.options.theme = theme;
    this.emitOptions();
  }

  private emitOptions() {
    this.optionsChange.emit(this.options);
  }

  notifications: notifications[] = [
    {
      id: 1,
      icon: 'a-b-2',
      color: 'primary',
      time: '8:30 AM',
      title: 'Launch Admin',
      subtitle: 'Just see the my new admin!',
    },
    {
      id: 2,
      icon: 'calendar',
      color: 'secondary',
      time: '8:21 AM',
      title: 'Event today',
      subtitle: 'Just a reminder that you have event',
    },
    {
      id: 3,
      icon: 'settings',
      color: 'warning',
      time: '8:05 AM',
      title: 'Settings',
      subtitle: 'You can customize this template',
    },
    {
      id: 4,
      icon: 'a-b-2',
      color: 'success',
      time: '7:30 AM',
      title: 'Launch Templates',
      subtitle: 'Just see the my new admin!',
    },
    {
      id: 5,
      icon: 'exclamation-circle',
      color: 'error',
      time: '7:03 AM',
      title: 'Event tomorrow',
      subtitle: 'Just a reminder that you have event',
    },
  ];

  inbox: inbox[] = [
    {
      id: 1,
      bgcolor: 'bg-error',
      imagePath: '/assets/images/backgrounds/errorimg.svg',
      time: 'just now',
      title: 'Michell Flintoff',
      subtitle: 'You: Yesterdy was great...',
    },
    {
      id: 2,
      bgcolor: 'bg-primary',
      imagePath: '/assets/images/backgrounds/errorimg.svg',
      time: '5 mins ago',
      title: 'Bianca Anderson',
      subtitle: 'Nice looking dress you...',
    },
    {
      id: 3,
      bgcolor: 'bg-success',
      imagePath: '/assets/images/backgrounds/errorimg.svg',
      time: '10 mins ago',
      title: 'Andrew Johnson',
      subtitle: 'Sent a photo',
    },
    {
      id: 4,
      bgcolor: 'bg-warning',
      imagePath: '/assets/images/backgrounds/errorimg.svg',
      time: 'days ago',
      title: 'Marry Strokes',
      subtitle: 'If I don’t like something',
    },
    {
      id: 5,
      bgcolor: 'bg-success',
      imagePath: '/assets/images/backgrounds/errorimg.svg',
      time: 'year ago',
      title: 'Josh Anderson',
      subtitle: '$230 deducted from account',
    },
  ];

  profiledd: profiledd[] = [
    {
      id: 1,
      title: 'Mi perfil',
      icon: 'solar:user-circle-line-duotone',
      link: this.appData.profile()?.id ? ('/profiles/' + this.appData.profile()?.id) : '/profiles',
    },
    {
      id: 2,
      title: 'Cuentas bancarias',
      icon: 'solar:wallet-money-line-duotone',
      link: '/banks-accounts',
    },
    {
      id: 3,
      title: 'Mis operaciones',
      icon: 'solar:document-text-line-duotone',
      link: '/operations',
    },
    {
      id: 4,
      title: 'Cambiar dólares',
      icon: 'solar:refresh-circle-line-duotone',
      link: '/operations/create',
    },
    {
      id: 5,
      title: 'Libro de reclamaciones',
      icon: 'solar:clipboard-text-line-duotone',
      link: '/book-claims',
    },
    {
      id: 6,
      title: 'Seguridad de mi cuenta',
      icon: 'solar:lock-password-line-duotone',
      link: '/account/security',
    },
    {
      id: 7,
      title: 'Cerrar Sesión',
      icon: 'solar:logout-2-line-duotone',
      link: '/authentication/login',
      logout: true,
    },
  ];

  apps: apps[] = [
    {
      id: 1,
      icon: 'solar:chat-line-line-duotone',
      color: 'primary',
      title: 'Chat Application',
      subtitle: 'Messages & Emails',
      link: '/apps/chat',
    },
    {
      id: 2,
      icon: 'solar:checklist-minimalistic-line-duotone',
      color: 'secondary',
      title: 'Todo App',
      subtitle: 'Completed task',
      link: '/apps/todo',
    },
    {
      id: 3,
      icon: 'solar:bill-list-line-duotone',
      color: 'success',
      title: 'Invoice App',
      subtitle: 'Get latest invoice',
      link: '/apps/invoice',
    },
    {
      id: 4,
      icon: 'solar:calendar-line-duotone',
      color: 'error',
      title: 'Calendar App',
      subtitle: 'Get Dates',
      link: '/apps/calendar',
    },
    {
      id: 5,
      icon: 'solar:smartphone-2-line-duotone',
      color: 'warning',
      title: 'Contact Application',
      subtitle: '2 Unsaved Contacts',
      link: '/apps/contacts',
    },
    {
      id: 6,
      icon: 'solar:ticket-line-duotone',
      color: 'primary',
      title: 'Tickets App',
      subtitle: 'Create new ticket',
      link: '/apps/tickets',
    },
    {
      id: 7,
      icon: 'solar:letter-line-duotone',
      color: 'secondary',
      title: 'Email App',
      subtitle: 'Get new emails',
      link: '/apps/email/inbox',
    },
    {
      id: 8,
      icon: 'solar:book-2-line-duotone',
      color: 'warning',
      title: 'Courses',
      subtitle: 'Create new course',
      link: '/apps/courses',
    },
  ];

  ngOnDestroy(): void {
    this.socket.off('ShowNotification');
    this.socket.off('ShowNotificationAdmin');
    this.socket.off('ShowNotificationRefresh');
    this.socket.off('ShowNotificationnMessage');
  }

}

@Component({
  selector: 'search-dialog',
  imports: [
    RouterModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TablerIconsModule,
    FormsModule,
    MatDividerModule,
  ],
  templateUrl: 'search-dialog.component.html',
})
export class AppSearchDialogComponent {
  searchText: string = '';
  navItems = navItems;

  navItemsData = navItems.filter((navitem) => navitem.displayName);

}
