import * as Moment from 'moment';
import { extendMoment } from 'moment-range';

function getFormattedWeekName(firstDate, lastDate) {
   const firstMonth = firstDate.format("MMMM");
   const firstDay = firstDate.format("D");
   const lastMonth = lastDate.format("MMMM");
   const lastDay = lastDate.format("D");
   if (firstMonth != lastMonth) {
      return `${firstMonth} ${firstDay}-${lastMonth} ${lastDay}`;
   }
   return `${firstMonth} ${firstDay}-${lastDay}`;
}

export function getWeeksInMonth(momentDate) {
   const moment = extendMoment(Moment);

   const year = momentDate.format("YYYY");
   const month = momentDate.format("M") - 1;
   const startDate = moment([year, month]);

   const firstDay = moment(startDate).startOf('month')
   const endDay = moment(startDate).endOf('month')

   const monthRange = moment.range(firstDay, endDay)
   const weeks = [];
   const days = Array.from(monthRange.by('day'));
   days.forEach(it => {
      if (!weeks.includes(it.week())) {
         weeks.push(it.week());
      }
   })

   const calendar = []
   weeks.forEach(week => {
      let firstWeekDay = moment([year, month]).week(week).day(1);
      let lastWeekDay = moment([year, month]).week(week).day(7);

      if (!lastWeekDay.isSame(firstWeekDay, 'year')) {
         firstWeekDay = firstWeekDay.add(1, 'year');
         lastWeekDay = lastWeekDay.add(1, 'year');
      }
      
      if (!firstWeekDay.isSame(momentDate, 'month')) {
         return false;
      }

      calendar.push({
         week,
         firstDay: firstWeekDay,
         lastDay: lastWeekDay,
         formatted: getFormattedWeekName(firstWeekDay, lastWeekDay)
      });
   })

   return calendar;
}

export function getFormattedWeek(momentDate) {
   let weeks = getWeeksInMonth(momentDate);
   let weekIndex = weeks.map(d => d.firstDay.week()).indexOf(momentDate.week());
   return weeks[weekIndex].formatted;
}