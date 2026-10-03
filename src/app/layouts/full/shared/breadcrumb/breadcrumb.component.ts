import { Component, inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { Router, NavigationEnd, ActivatedRoute, Data } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ProfilesUserStore } from 'src/app/pages/security/users/profiles/profiles.store';
import { UtilsService } from 'src/app/core/services/common/utils.service';

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterModule, TablerIconsModule],
  templateUrl: './breadcrumb.component.html',
  styleUrls: [],
})
export class AppBreadcrumbComponent {

  pageInfo: Data | any = Object.create(null);
  private profilesStore = inject(ProfilesUserStore);
  myurl: any = this.router.url.slice(1).split('/');
  constructor(
    private router: Router,
    private service: UtilsService,
    private activatedRoute: ActivatedRoute,
    private titleService: Title
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .pipe(map(() => this.activatedRoute))
      .pipe(
        map((route) => {
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        })
      )
      .pipe(filter((route) => route.outlet === 'primary'))
      .pipe(mergeMap((route) => route.data))
      .pipe(takeUntilDestroyed())
      .subscribe((event) => {
        const exchangeRate = event['exchange'];
        const profile = event['profile'];

        if (event['title'] === 'Perfiles') {
          const user = this.profilesStore.user();

          this.pageInfo = {
            ...event,
            title: user
              ? `Perfiles: ${user.names}`
              : 'Perfiles'
          };
        } else if (event['title'] === 'Perfil') {

          if (profile === null) {
            this.pageInfo = {
              ...event,
              title: 'Nuevo Perfil'
            };

          } else if (profile?.id) {
            this.pageInfo = {
              ...event,
              title: 'Editar Perfil'
            };

          } else {
            this.pageInfo = event;
          }

        } else if (
          event['title'] === 'Tipo de cambio' &&
          exchangeRate
        ) {
          this.pageInfo = {
            ...event,
            title: `Tipo de cambio: PC ${exchangeRate.priceCompra} - PV ${exchangeRate.priceVenta}`
          };
        } else if (
          event['title'] === 'Cambiar' &&
          this.service.profile()
        ) {
          this.pageInfo = {
            ...event,
            title: this.service.profile()?.names ?? 'Cambiar dólares'
          };
        } else {
          this.pageInfo = event;
        }

        this.titleService.setTitle(this.pageInfo.title + ' - GOOD MONEY');
      });
  }
}
