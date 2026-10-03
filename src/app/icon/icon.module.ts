import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablerIconsModule } from 'angular-tabler-icons';
import { tablerIconsUsados } from './tabler-icons';

@NgModule({
  declarations: [],
  imports: [
    TablerIconsModule.pick(tablerIconsUsados),
    CommonModule
  ],
  exports: [TablerIconsModule]
})
export class IconModule { }
