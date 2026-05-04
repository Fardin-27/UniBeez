declare module "react-calendar" {
  import type { ComponentType, MouseEvent } from "react";

  export interface CalendarProps {
    onClickDay?: (value: Date, event: MouseEvent<HTMLButtonElement>) => void;
    tileClassName?:
      | string
      | string[]
      | ((props: {
          activeStartDate: Date;
          date: Date;
          view: string;
        }) => string | string[] | null | undefined);
    minDate?: Date;
    value?: Date | Date[] | null;
  }

  const Calendar: ComponentType<CalendarProps>;
  export default Calendar;
}
