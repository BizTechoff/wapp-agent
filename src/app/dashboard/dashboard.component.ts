import { Component, OnInit, OnDestroy } from '@angular/core'
import { remult } from 'remult'
import { MessageRequest } from '../messages/message-request'
import { MessageStatus } from '../../shared/enums/MessageStatus'
import { terms } from '../terms'

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  terms = terms

  // Stats
  totalMessages = 0
  sentCount = 0
  deliveredCount = 0
  readCount = 0
  failedCount = 0
  pendingCount = 0
  successRate = 0

  // Recent failures
  recentFailures: MessageRequest[] = []

  // LiveQuery subscriptions
  private subscriptions: (() => void)[] = []

  async ngOnInit() {
    await this.loadStats()
    this.setupLiveQuery()
  }

  ngOnDestroy() {
    // Clean up all subscriptions
    this.subscriptions.forEach(unsub => unsub())
  }

  async loadStats() {
    const repo = remult.repo(MessageRequest)

    // Get counts by status
    const messages = await repo.find({ limit: 10000 })

    this.totalMessages = messages.length
    this.sentCount = messages.filter(m => m.status === MessageStatus.sent).length
    this.deliveredCount = messages.filter(m => m.status === MessageStatus.delivered).length
    this.readCount = messages.filter(m => m.status === MessageStatus.read).length
    this.failedCount = messages.filter(m => m.status === MessageStatus.failed).length
    this.pendingCount = messages.filter(m =>
      m.status === MessageStatus.queued || m.status === MessageStatus.sending
    ).length

    this.calculateSuccessRate()

    // Get recent failures
    this.recentFailures = await repo.find({
      where: { status: MessageStatus.failed },
      orderBy: { createDate: 'desc' },
      limit: 5
    })
  }

  setupLiveQuery() {
    // LiveQuery for pending messages
    const pendingSub = remult.repo(MessageRequest)
      .liveQuery({
        where: {
          status: [MessageStatus.queued, MessageStatus.sending]
        },
        limit: 100
      })
      .subscribe(info => {
        this.pendingCount = info.items.length
        this.calculateSuccessRate()
      })
    this.subscriptions.push(pendingSub)

    // LiveQuery for recent failures
    const failedSub = remult.repo(MessageRequest)
      .liveQuery({
        where: { status: MessageStatus.failed },
        orderBy: { createDate: 'desc' },
        limit: 5
      })
      .subscribe(info => {
        this.recentFailures = info.applyChanges(this.recentFailures)
        this.failedCount = info.items.length
        this.calculateSuccessRate()
      })
    this.subscriptions.push(failedSub)
  }

  calculateSuccessRate() {
    const total = this.sentCount + this.deliveredCount + this.readCount + this.failedCount
    if (total > 0) {
      this.successRate = Math.round(((this.sentCount + this.deliveredCount + this.readCount) / total) * 100)
    } else {
      this.successRate = 0
    }
  }

  async refresh() {
    await this.loadStats()
  }

  getTimeAgo(date: Date): string {
    if (!date) return ''
    const now = new Date()
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)

    if (diff < 60) return `${diff} שניות`
    if (diff < 3600) return `${Math.floor(diff / 60)} דקות`
    if (diff < 86400) return `${Math.floor(diff / 3600)} שעות`
    return `${Math.floor(diff / 86400)} ימים`
  }
}
