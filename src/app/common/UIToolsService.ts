import { Injectable, NgZone } from "@angular/core"
import { MatSnackBar } from "@angular/material/snack-bar"
import { UserDetailsModalComponent } from "../users/user-details-modal/user-details-modal.component"
import { TenantDetailsComponent } from "../tenants/tenant-details/tenant-details.component"
import { MessageDetailsComponent } from "../messages/message-details/message-details.component"
import { ProviderDetailsComponent } from "../providers/provider-details/provider-details.component"
import { YesNoQuestionComponent } from "./components/yes-no-question/yes-no-question.component"
import { openDialog } from "./openDialog"
import { terms } from "../terms"
import { BusyService } from "./components/wait/busyService"


export function extractError(err: any): string {
  if (typeof err === 'string') return err
  if (err.modelState) {
    if (err.message) return err.message
    for (const key in err.modelState) {
      if (err.modelState.hasOwnProperty(key)) {
        const element = err.modelState[key]
        return key + ': ' + element
      }
    }
  }
  if (err.rejection) return extractError(err.rejection)
  if (err.httpStatusCode == 403) return 'terms.unauthorizedOperation'
  if (err.message) {
    let r = err.message
    if (err.error && err.error.message) r = err.error.message
    return r
  }
  if (err.error) return extractError(err.error)

  return JSON.stringify(err)
}

@Injectable()
export class UIToolsService {

  constructor(
    zone: NgZone,
    private snackBar: MatSnackBar,
    public busy: BusyService
  ) {
    this.mediaMatcher.addListener((mql) =>
      zone.run(() => ''.toString())
    )
  }

  info(info: string): any {
    this.snackBar.open(info, terms.close, { duration: 4000 })
  }

  async error(err: any, taskId?: string) {
    const message = extractError(err)
    if (message == 'Network Error') return
    return await openDialog(
      YesNoQuestionComponent,
      (d) =>
      (d.args = {
        message,
        isQuestion: false,
      })
    )
  }

  private mediaMatcher: MediaQueryList = matchMedia(`(max-width: 720px)`)

  isScreenSmall() {
    return this.mediaMatcher.matches
  }

  async yesNoQuestion(question: string, isQuestion = false) {
    return await openDialog(
      YesNoQuestionComponent,
      (d) => (d.args = { message: question, isQuestion: isQuestion }),
      (d) => d.okPressed
    )
  }

  async confirmDelete(of: string) {
    return await this.yesNoQuestion(
      terms.areYouSureYouWouldLikeToDelete + ' ' + of + '?',
      true
    )
  }

  async openUserDetailsModal(userId = '') {
    return await openDialog(
      UserDetailsModalComponent,
      (d) => d.args = { userId: userId },
      (d) => d?.changed || false
    )
  }

  // wapp.agent dialogs
  async openTenantDetails(tenantId = '') {
    return await openDialog(
      TenantDetailsComponent,
      (d) => d.args = { tenantId: tenantId },
      (d) => d?.changed || false
    )
  }

  async openMessageDetails(messageId = '') {
    return await openDialog(
      MessageDetailsComponent,
      (d) => d.args = { messageId: messageId },
      (d) => false
    )
  }

  async openIncomingMessageDetails(incomingId = '') {
    return await openDialog(
      MessageDetailsComponent,
      (d) => d.args = { messageId: '', incomingId: incomingId },
      (d) => false
    )
  }

  async openProviderDetails(providerId = '') {
    return await openDialog(
      ProviderDetailsComponent,
      (d) => d.args = { providerId: providerId },
      (d) => d?.changed || false
    )
  }
}
