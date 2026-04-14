import { ErrorHandler, NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { HomeComponent } from './home/home.component'
import { ShowDialogOnErrorErrorHandler } from './common/showDialogOnErrorErrorHandler'
import { AdminGuard, AuthenticatedGuard, NotAuthenticatedGuard } from './users/authGuard'
import { SilentRedirectComponent } from './users/silent-redirect.component'
import { UserListComponent } from './users/user-list/user-list.component'
import { terms } from './terms'

// wapp.agent components
import { DashboardComponent } from './dashboard/dashboard.component'
import { TenantListComponent } from './tenants/tenant-list/tenant-list.component'
import { MessageListComponent } from './messages/message-list/message-list.component'
import { ProviderListComponent } from './providers/provider-list/provider-list.component'

const defaultRoute = 'home'
const routes: Routes = [
  {
    path: defaultRoute,
    component: HomeComponent,
    canActivate: [NotAuthenticatedGuard],
    data: { name: terms.home }
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthenticatedGuard],
    data: { name: terms.dashboard, icon: 'dashboard', group: 'main', description: 'סטטיסטיקות ומעקב חי' }
  },
  {
    path: 'tenants',
    component: TenantListComponent,
    canActivate: [AdminGuard],
    data: { name: terms.tenants, icon: 'business', group: 'main', description: 'ניהול לקוחות' }
  },
  {
    path: 'messages',
    component: MessageListComponent,
    canActivate: [AuthenticatedGuard],
    data: { name: terms.messages, icon: 'message', group: 'main', description: 'הודעות יוצאות ונכנסות' }
  },
  {
    path: 'providers',
    component: ProviderListComponent,
    canActivate: [AdminGuard],
    data: { name: terms.providers, icon: 'settings_input_antenna', group: 'admin', description: 'הגדרות ספקי WhatsApp' }
  },
  {
    path: 'accounts',
    component: UserListComponent,
    canActivate: [AdminGuard],
    data: { name: terms.userAccounts, icon: 'admin_panel_settings', group: 'admin', description: 'ניהול חשבונות והרשאות' }
  },
  { path: '', component: SilentRedirectComponent, pathMatch: 'full' },
  { path: '**', component: SilentRedirectComponent }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  providers: [
    AdminGuard,
    { provide: ErrorHandler, useClass: ShowDialogOnErrorErrorHandler },
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
