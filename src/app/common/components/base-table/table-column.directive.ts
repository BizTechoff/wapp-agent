import { Directive, Input, TemplateRef } from '@angular/core'

@Directive({
  selector: '[appTableColumn]',
  standalone: false
})
export class TableColumnDirective {
  @Input() header?: string
  @Input() field!: string
  @Input() sortable?: boolean

  constructor(public template: TemplateRef<any>) {}
}
