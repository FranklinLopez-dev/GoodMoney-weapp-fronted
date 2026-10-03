import { Routes } from '@angular/router';
import { ChatsResolver } from './chats.resolver';
import { ChatsComponent } from './chats.component';


export const ChatsRoutes: Routes = [
    {
        path: '',
        component: ChatsComponent,
        data: {
            title: 'Chats',
        },
        resolve: {
            preload: ChatsResolver
        }
    }
];
