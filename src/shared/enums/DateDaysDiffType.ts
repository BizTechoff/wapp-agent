import { ValueListFieldType } from 'remult'

@ValueListFieldType()
export class DateDaysDiffType {
  static future = new DateDaysDiffType('future', 'עתידי')   // Green - future dates
  static recent = new DateDaysDiffType('recent', 'אחרון')   // Bold - recent (0-7 days ago)
  static past = new DateDaysDiffType('past', 'עבר')         // Black - older dates

  constructor(public id: string, public caption: string) {}
}
