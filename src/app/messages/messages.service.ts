import { Injectable } from '@angular/core'
import { remult } from 'remult'
import { MessageRequest } from './message-request'
import { IncomingMessage } from './incoming-message'
import { MessagesController } from '../../shared/controllers/MessagesController'

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  outgoingRepo = remult.repo(MessageRequest)
  incomingRepo = remult.repo(IncomingMessage)

  async getOutgoingMessages(limit = 100) {
    return await this.outgoingRepo.find({
      orderBy: { createDate: 'desc' },
      limit,
      include: { tenant: true }
    })
  }

  async getIncomingMessages(limit = 100) {
    return await this.incomingRepo.find({
      orderBy: { receivedDate: 'desc' },
      limit,
      include: { tenant: true }
    })
  }

  async getMessageById(id: string) {
    return await this.outgoingRepo.findId(id)
  }

  async getIncomingById(id: string) {
    return await this.incomingRepo.findId(id)
  }

  async save(message: MessageRequest) {
    return await this.outgoingRepo.save(message)
  }

  async delete(message: MessageRequest) {
    return await this.outgoingRepo.delete(message)
  }

  async deleteIncoming(message: IncomingMessage) {
    return await this.incomingRepo.delete(message)
  }
}
