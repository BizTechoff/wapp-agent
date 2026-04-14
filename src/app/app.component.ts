import { Component, OnInit, ViewChild } from '@angular/core'
import { MatSidenav } from '@angular/material/sidenav'
import { ActivatedRoute, Route, Router } from '@angular/router'

import { User } from './users/user'
import { remult } from 'remult'
import { RouteHelperService } from './common/routeHelperService'
import { UIToolsService } from './common/UIToolsService'
import { terms } from './terms'
import { SignInController } from './users/SignInController'
import { UpdatePasswordController } from './users/UpdatePasswordController'

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    public router: Router,
    public activeRoute: ActivatedRoute,
    private routeHelper: RouteHelperService,
    public uiService: UIToolsService
  ) { }
  terms = terms
  remult = remult

  async signIn() {
  }

  ngOnInit(): void {
  }

  openBusinessWebSite() {
    window?.open(`https://biztechoff.co.il/`, '_blank')
  }

  signOut() {
    SignInController.signOut()
    remult.user = undefined
    this.router.navigate([`/${'home'}`]);
  }

  async updateInfo() {
    let user = (await remult.repo(User).findId(remult.user!.id))!
  }

  async changePassword() {
    const updatePassword = new UpdatePasswordController()
  }

  sidebarGroups = [
    { key: 'main', label: 'ראשי' },
    { key: 'admin', label: 'ניהול' }
  ]

  getRoutesForGroup(groupKey: string): Route[] {
    return this.router.config.filter(r =>
      this.shouldDisplayRoute(r) && r.data?.['group'] === groupKey
    )
  }

  routeName(route: Route) {
    let name = route.path
    if (route.data && route.data['name']) name = route.data['name']
    return name
  }

  currentTitle() {
    if (this.activeRoute!.snapshot && this.activeRoute!.firstChild)
      if (this.activeRoute.snapshot.firstChild!.data!['name']) {
        return this.activeRoute.snapshot.firstChild!.data['name']
      } else {
        if (this.activeRoute.firstChild.routeConfig)
          return this.activeRoute.firstChild.routeConfig.path
      }
    return 'wapp.agent'
  }

  doesNotRequireLogin() {
    return this.activeRoute?.snapshot?.firstChild?.data?.['noLogin']
  }

  shouldDisplayRoute(route: Route) {
    if (
      !(
        this.routeName(route) &&
        (route.path || '').indexOf(':') < 0 &&
        (route.path || '').indexOf('**') < 0 &&
        !route.data?.['hide']
      )
    )
      return false
    return this.routeHelper.canNavigateToRoute(route)
  }

  @ViewChild('sidenav') sidenav!: MatSidenav
  routeClicked() {
    if (this.uiService.isScreenSmall()) this.sidenav.close()
  }
}
