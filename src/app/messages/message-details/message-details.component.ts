import { Component, OnInit } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'
import { remult } from 'remult'
import { MessageRequest } from '../message-request'
import { IncomingMessage } from '../incoming-message'
import { MessagesService } from '../messages.service'
import { terms } from '../../terms'

@Component({
  selector: 'app-message-details',
  standalone: false,
  templateUrl: './message-details.component.html',
  styleUrls: ['./message-details.component.scss']
})
export class MessageDetailsComponent implements OnInit {
  terms = terms
  message?: MessageRequest
  incomingMessage?: IncomingMessage
  isIncoming = false
  args: { messageId: string; incomingId?: string } = { messageId: '' }

  constructor(
    private dialogRef: MatDialogRef<MessageDetailsComponent>,
    private messagesService: MessagesService
  ) {}

  async ngOnInit() {
    if (this.args.incomingId) {
      this.incomingMessage = (await this.messagesService.getIncomingById(this.args.incomingId))!
      this.isIncoming = true
    } else if (this.args.messageId) {
      this.message = (await this.messagesService.getMessageById(this.args.messageId))!
      this.isIncoming = false
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

  formatDate(date: Date | undefined): string {
    if (!date) return '-'
    return new Date(date).toLocaleString('he-IL')
  }

  close() {
    this.dialogRef.close()
  }
}
