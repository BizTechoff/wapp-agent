import { Component, OnInit, OnDestroy } from '@angular/core'
import { remult } from 'remult'
import { MessageRequest } from '../message-request'
import { IncomingMessage } from '../incoming-message'
import { MessagesService } from '../messages.service'
import { UIToolsService } from '../../common/UIToolsService'
import { terms } from '../../terms'

@Component({
  selector: 'app-message-list',
  standalone: false,
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.scss']
})
export class MessageListComponent implements OnInit, OnDestroy {
  terms = terms
  MessageRequest = MessageRequest
  IncomingMessage = IncomingMessage

  outgoingMessages: MessageRequest[] = []
  incomingMessages: IncomingMessage[] = []
  loading = true
  activeTab: 'outgoing' | 'incoming' = 'outgoing'

  // LiveQuery subscription
  private subscription?: () => void

  constructor(
    private messagesService: MessagesService,
    private ui: UIToolsService
  ) {}

  async ngOnInit() {
    await this.loadMessages()
    this.setupLiveQuery()
  }

  ngOnDestroy() {
    this.subscription?.()
  }

  async loadMessages() {
    this.loading = true
    try {
      this.outgoingMessages = await this.messagesService.getOutgoingMessages()
      this.incomingMessages = await this.messagesService.getIncomingMessages()
    } finally {
      this.loading = false
    }
  }

  setupLiveQuery() {
    // LiveQuery for outgoing messages
    this.subscription = remult.repo(MessageRequest)
      .liveQuery({
        orderBy: { createDate: 'desc' },
        limit: 100,
        include: { tenant: true }
      })
      .subscribe(info => {
        this.outgoingMessages = info.applyChanges(this.outgoingMessages)
      })
  }

  switchTab(tab: 'outgoing' | 'incoming') {
    this.activeTab = tab
  }

  async viewOutgoing(message: MessageRequest) {
    await this.ui.openMessageDetails(message.id)
  }

  async viewIncoming(message: IncomingMessage) {
    // Mark as read
    if (!message.isRead) {
      message.isRead = true
      await remult.repo(IncomingMessage).save(message)
    }
    await this.ui.openIncomingMessageDetails(message.id)
  }

  async deleteOutgoing(message: MessageRequest) {
    if (await this.ui.confirmDelete(message.mobile)) {
      await this.messagesService.delete(message)
      await this.loadMessages()
    }
  }

  async deleteIncoming(message: IncomingMessage) {
    if (await this.ui.confirmDelete(message.mobile)) {
      await this.messagesService.deleteIncoming(message)
      await this.loadMessages()
    }
  }

  getStatusClass(status: any): string {
    switch (status?.id) {
      case 'sent':
      case 'delivered':
      case 'read':
        return 'status-success'
      case 'failed':
        return 'status-failed'
      case 'queued':
      case 'sending':
        return 'status-pending'
      default:
        return ''
    }
  }
}
