import { APP_INITIALIZER, ErrorHandler, LOCALE_ID, NgModule } from '@angular/core'
import { registerLocaleData } from '@angular/common'
import localeHe from '@angular/common/locales/he'
import { FormsModule } from '@angular/forms'

// Register Hebrew locale
registerLocaleData(localeHe)
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatListModule } from '@angular/material/list'
import { MatMenuModule } from '@angular/material/menu'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatSelectModule } from '@angular/material/select'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { remult } from 'remult'
import { Remult } from 'remult'

// Common
import { HomeComponent } from './home/home.component'
import { BaseInputFieldComponent } from './common/components/base-input-field/base-input-field.component'
import { YesNoQuestionComponent } from './common/components/yes-no-question/yes-no-question.component'
import { BaseTableComponent } from './common/components/base-table/base-table.component'
import { TableColumnDirective } from './common/components/base-table/table-column.directive'
import { UIToolsService } from './common/UIToolsService'
import { BusyService } from './common/components/wait/busyService'
import { AdminGuard, AuthenticatedGuard, NotAuthenticatedGuard } from './users/authGuard'
import { RouteHelperService } from './common/routeHelperService'
import { ShowDialogOnErrorErrorHandler } from './common/showDialogOnErrorErrorHandler'
import { setMatDialog } from './common/openDialog'
import { MatDialog } from '@angular/material/dialog'
import { SignInController } from './users/SignInController'
import { UserDetailsModalComponent } from './users/user-details-modal/user-details-modal.component'
import { UserListComponent } from './users/user-list/user-list.component'

// wapp.agent components
import { DashboardComponent } from './dashboard/dashboard.component'
import { TenantListComponent } from './tenants/tenant-list/tenant-list.component'
import { TenantDetailsComponent } from './tenants/tenant-details/tenant-details.component'
import { MessageListComponent } from './messages/message-list/message-list.component'
import { MessageDetailsComponent } from './messages/message-details/message-details.component'
import { ProviderListComponent } from './providers/provider-list/provider-list.component'
import { ProviderDetailsComponent } from './providers/provider-details/provider-details.component'

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    BaseInputFieldComponent,
    YesNoQuestionComponent,
    BaseTableComponent,
    TableColumnDirective,
    UserDetailsModalComponent,
    UserListComponent,
    // wapp.agent
    DashboardComponent,
    TenantListComponent,
    TenantDetailsComponent,
    MessageListComponent,
    MessageDetailsComponent,
    ProviderListComponent,
    ProviderDetailsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule
  ],
  providers: [
    UIToolsService,
    BusyService,
    NotAuthenticatedGuard,
    AuthenticatedGuard,
    AdminGuard,
    RouteHelperService,
    { provide: ErrorHandler, useClass: ShowDialogOnErrorErrorHandler },
    { provide: APP_INITIALIZER, useFactory: initApp, multi: true },
    { provide: APP_INITIALIZER, useFactory: initMatDialog, deps: [MatDialog], multi: true },
    { provide: LOCALE_ID, useValue: 'he' },
    { provide: Remult, useValue: remult }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

export function initMatDialog(dialog: MatDialog) {
  return () => {
    setMatDialog(dialog)
  }
}

export function initApp() {
  const loadCurrentUserBeforeAppStarts = async () => {
    await remult.initUser()
  }
  return loadCurrentUserBeforeAppStarts
}
