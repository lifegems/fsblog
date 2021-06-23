import { useState, useEffect, useContext } from "react"
import moment from "moment"
import { Box, Button, Card, CardBody, CardFooter, CardHeader, DateInput, Grid, List, ResponsiveContext, Select, Table, TableBody, TableHeader, TableRow, TableCell, Text, TextInput } from "grommet"
import { Add, CaretNext, CaretPrevious, ChapterNext, ChapterPrevious, FastForward, FormDown, FormNext, FormView, Hide, Print, Trash } from "grommet-icons"
import {getFormattedWeek, getWeeksInMonth} from '../lib/dates'

const MONTH_NAMES = [
   [
      { name: 'January',  number: 1 },
      { name: 'February', number: 2 },
      { name: 'March',    number: 3 }
   ],
   [
      { name: 'April', number: 4 },
      { name: 'May',   number: 5 },
      { name: 'June',  number: 6 }
   ],
   [
      { name: 'July',      number: 7 },
      { name: 'August',    number: 8 },
      { name: 'September', number: 9 }
   ],
   [
      { name: 'October',  number: 10 },
      { name: 'November', number: 11 },
      { name: 'December', number: 12 }
   ]
]

export default function CalendarMonthSelector({ onChange = (newDate) => {}, onTitle = (newTitle) => {}, onSelect, useWeeks = false }) {
   const [selectedDate, setDate] = useState(moment());
   const [selectedWeek, setWeek] = useState(0);
   const [weeks, setWeeks] = useState([]);

   useEffect(() => {
      let currentDate = moment();
      setDate(currentDate);
      onTitle(getDateText(currentDate));
      
      let newWeeks = getWeeksInMonth(currentDate);
      let weekIndex = newWeeks.map(d => d.firstDay.week()).indexOf(currentDate.week());
      setWeeks(newWeeks);
      if (weekIndex > -1) setWeek(weekIndex);
   }, []);

   function selectMonth(monthNumber) {
      let updatedDate = moment(selectedDate).month(monthNumber - 1);
      if (onSelect) {
         onSelect();
      }
      updateDate(updatedDate, true);
   }

   function nextMonth() {
      let updatedDate = moment(selectedDate).add(1, 'month');
      updateDate(updatedDate, true);
   }
   
   function previousMonth() {
      let updatedDate = moment(selectedDate).subtract(1, 'month');
      updateDate(updatedDate, true);
   }
   
   function nextYear() {
      let updatedDate = selectedDate.add(1, 'year');
      updateDate(updatedDate, true);
   }
   
   function previousYear() {
      let updatedDate = selectedDate.subtract(1, 'year');
      updateDate(updatedDate, true);
   }

   function updateDate(newDate, setToFirstWeek) {
      let newWeeks = getWeeksInMonth(newDate);
      if (setToFirstWeek) {
         newDate = newWeeks[0].firstDay;
      }
      setWeeks(newWeeks);

      let weekIndex = newWeeks.map(d => d.firstDay.week()).indexOf(newDate.week());
      if (weekIndex > -1) setWeek(weekIndex);

      setDate(newDate);
      onChange(newDate);
      onTitle(getDateText(newDate));
   }

   function getDateText(newDate) {
      if (useWeeks) {
         let formattedWeek = getFormattedWeek(newDate);
         return `${formattedWeek}, ${newDate.format("YYYY")}`;
      }
      return `${newDate.format("MMMM YYYY")}`;
   }

   function setToToday() {
      let updatedDate = moment();
      updateDate(updatedDate);
   }

   function clickWeek(index) {
      setWeek(index);
      let updatedDate = selectedDate.week(weeks[index].week);
      updateDate(updatedDate);
   }

   return (
      <Box direction="column">
         <Text className="font-bold text-center text-2xl">{getDateText(selectedDate)}</Text>
         <Box direction="row" justify="around" className="pt-3 pb-3 border-t border-b">
            <Button onClick={previousYear}>
               <ChapterPrevious />
            </Button>
            <Button onClick={previousMonth}>
               <CaretPrevious />
            </Button>
            {!useWeeks && <Text className="font-bold cursor-pointer text-blue-600" onClick={setToToday}>THIS MONTH</Text>}
            {useWeeks && <Text className="font-bold cursor-pointer text-blue-600" onClick={setToToday}>THIS WEEK</Text>}
            {false && <Text className="font-bold cursor-pointer text-blue-600" onClick={setToToday}>TODAY</Text>}
            <Button onClick={nextMonth}>
               <CaretNext />
            </Button>
            <Button onClick={nextYear}>
               <ChapterNext />
            </Button>
         </Box>
         <Box direction="column">
            {MONTH_NAMES.map((group,i) => (
               <Box direction="row" className="m-1" key={i}>
                  {group.map(month => (
                     <Box className="m-1 pt-5 pb-4 border rounded text-center cursor-pointer" style={{borderColor: month.number == selectedDate.format("M") ? 'green' : ''}} fill key={month.number} onClick={() => selectMonth(month.number)}>
                        <Text>{month.name}</Text>
                     </Box>
                  ))}
               </Box>
            ))}
         </Box>
         {useWeeks && <Box className="p-3">
            <List data={weeks} primaryKey="formatted" onClickItem={({index}) => clickWeek(index)} itemProps={{[selectedWeek]: {background: 'light-2'}}} />
         </Box>}
      </Box>
   )
}