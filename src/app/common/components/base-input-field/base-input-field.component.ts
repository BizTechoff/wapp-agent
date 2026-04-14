import { Component, Input, forwardRef, ViewChild, ElementRef, AfterViewChecked } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'

@Component({
  selector: 'app-base-input-field',
  standalone: false,
  templateUrl: './base-input-field.component.html',
  styleUrls: ['./base-input-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BaseInputFieldComponent),
      multi: true
    }
  ]
})
export class BaseInputFieldComponent implements ControlValueAccessor, AfterViewChecked {
  @Input() label = ''
  @Input() type: 'text' | 'password' | 'email' | 'number' | 'tel' | 'date' | 'textarea' | 'select' = 'text'
  @Input() required = false
  @Input() disabled = false
  @Input() placeholder = ''
  @Input() options: { id: string, caption: string }[] = []
  @Input() rows = 3
  @Input() maxLength = 10000

  @ViewChild('textareaEl') textareaEl?: ElementRef<HTMLTextAreaElement>

  value: any = ''
  isFocused = false
  private needsResize = false

  private onChange: (value: any) => void = () => {}
  private onTouched: () => void = () => {}

  ngAfterViewChecked(): void {
    if (this.needsResize) {
      this.autoResize()
      this.needsResize = false
    }
  }

  autoResize(): void {
    const ta = this.textareaEl?.nativeElement
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = ta.scrollHeight + 'px'
  }

  get hasValue(): boolean {
    if (this.type === 'select') {
      return this.value !== null && this.value !== undefined && this.value !== ''
    }
    return this.value !== null && this.value !== undefined && this.value !== ''
  }

  get shouldFloatLabel(): boolean {
    if (this.type === 'select') return true
    return this.isFocused || this.hasValue
  }

  get selectValue(): string {
    if (!this.value) return ''
    return this.value.id || ''
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement
    this.value = input.value
    this.onChange(this.value)
  }

  onSelect(event: Event): void {
    const id = (event.target as HTMLSelectElement).value
    const selected = this.options.find(o => o.id === id) || null
    this.value = selected
    this.onChange(selected)
  }

  onFocus(): void {
    this.isFocused = true
  }

  onBlur(): void {
    this.isFocused = false
    this.onTouched()
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.value = value ?? ''
    if (this.type === 'textarea') {
      this.needsResize = true
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled
  }
}
