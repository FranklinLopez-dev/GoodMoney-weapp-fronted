import {
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnChanges,
  Output,
  EventEmitter
} from '@angular/core';
import { NavItem } from './nav-item';
import { Router } from '@angular/router';
import { NavService } from '../../../../../services/nav.service';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { TranslateModule } from '@ngx-translate/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { canShowNavItem } from './nav-permissions.util';

// Modulos de Material sueltos: `MaterialModule` reexporta 35 y los arrastra al bundle inicial.
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-nav-item',
  imports: [TranslateModule, TablerIconsModule, MatListModule, MatIconModule, CommonModule],
  templateUrl: './nav-item.component.html',
  styleUrls: [],
  animations: [
    trigger('indicatorRotate', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4,0.0,0.2,1)')
      ),
    ]),
  ],
})
export class AppNavItemComponent implements OnChanges {
  @Output() toggleMobileLink: any = new EventEmitter<void>();
  @Output() notify: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() selectedIcon: string;
  expanded: any = false;
  disabled: any = false;
  twoLines: any = false;
  @HostBinding('attr.aria-expanded') ariaExpanded = this.expanded;
  @Input() item: NavItem | any;
  @Input() depth: any;

  constructor(public navService: NavService, public router: Router, private auth: AuthStore, private el: ElementRef<HTMLElement>) {
    if (this.depth === undefined) {
      this.depth = 0;
    }
  }

  ngOnChanges() {
    const url = this.navService.currentUrl();
    if (this.item.route && url) {
      this.expanded = url.indexOf(`/${this.item.route}`) === 0;
      this.ariaExpanded = this.expanded;
    }
  }

  canShow(item: NavItem): boolean {
    return canShowNavItem(item, this.auth);
  }

  onItemSelected(item: NavItem) {
    if (!item.children || !item.children.length) {
      this.router.navigate([item.route]);
    }
    if (item.children && item.children.length) {
      this.expanded = !this.expanded;
      if (this.expanded) {
        // Tras el render del @if: los hijos de un ítem del fondo abren fuera del visor del ng-scrollbar.
        setTimeout(() => {
          this.el.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
    }
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
    if (!this.expanded) {
      if (window.innerWidth < 1024) {
        this.notify.emit();
      }
    }
  }

  onSubItemSelected(item: NavItem) {
    if (!item.children || !item.children.length) {
      if (this.expanded && window.innerWidth < 1024) {
        this.notify.emit();
      }
    }
  }

  isDirectlyActive(item: NavItem): boolean {
    return !!item.route && this.router.isActive(item.route, true);
  }

  isChildActive(item: NavItem): boolean {
    if (!item.children) return false;
    return item.children.some(
      (child) => this.isDirectlyActive(child) || this.isChildActive(child)
    );
  }
}
