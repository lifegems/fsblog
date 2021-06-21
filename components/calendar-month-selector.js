import { useState, useEffect, useContext } from "react"
import moment from "moment"
import { Box, Button, Card, CardBody, CardFooter, CardHeader, DateInput, Grid, List, ResponsiveContext, Select, Table, TableBody, TableHeader, TableRow, TableCell, Text, TextInput } from "grommet"
import { Add, CaretNext, CaretPrevious, ChapterNext, ChapterPrevious, FastForward, FormDown, FormNext, FormView, Hide, Print, Trash } from "grommet-icons"
import {getWeeksInMonth} from '../lib/dates'

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

export default function CalendarMonthSelector({ value, onChange, onSelect, useWeeks = false }) {
   const [selectedMonth, setMonth] = useState(moment().format("M"));
   const [selectedYear, setYear] = useState(moment().format("YYYY"));
   const [selectedWeek, setWeek] = useState(0);
   const [weeks, setWeeks] = useState([]);

   useEffect(() => {
      let currentDate = moment(value);
      setMonth(currentDate.format("M"));
      setYear(currentDate.format("YYYY"));
      setWeeks(getWeeksInMonth(currentDate));
   }, [value]);

   function selectMonth(monthNumber) {
      setMonth(monthNumber);
      let monthWeeks = getWeeksInMonth(moment(monthNumber + ' ' + selectedYear, "M YYYY"));
      setWeeks(monthWeeks);
      if (onSelect) {
         onSelect();
      }
      updateDate(monthNumber, selectedYear);
   }

   function nextMonth() {
      let updatedDate = moment(selectedMonth + ' ' + selectedYear, "M YYYY").add(1, 'month');
      if (selectedMonth == 12) {
         setYear(updatedDate.format("YYYY"));
      }
      setMonth(updatedDate.format("M"));
      updateDate(updatedDate.format("M"), updatedDate.format("YYYY"));
   }
   
   function previousMonth() {
      let updatedDate = moment(selectedMonth + ' ' + selectedYear, "M YYYY").subtract(1, 'month');
      if (selectedMonth == 1) {
         setYear(updatedDate.format("YYYY"));
      }
      setMonth(updatedDate.format("M"));
      updateDate(updatedDate.format("M"), updatedDate.format("YYYY"));
   }
   
   function nextYear() {
      let updatedDate = moment(selectedMonth + ' ' + selectedYear, "M YYYY").add(1, 'year');
      setYear(updatedDate.format("YYYY"));
      updateDate(updatedDate.format("M"), updatedDate.format("YYYY"));
   }
   
   function previousYear() {
      let updatedDate = moment(selectedMonth + ' ' + selectedYear, "M YYYY").subtract(1, 'year');
      setYear(updatedDate.format("YYYY"));
      updateDate(updatedDate.format("M"), updatedDate.format("YYYY"));
   }

   function updateDate(month, year) {
      let updatedDate = moment(month + " " + year, "M YYYY");
      setWeeks(getWeeksInMonth(moment(month + ' ' + year, "M YYYY")));
      if (onChange) {
         onChange(updatedDate);
      }
   }

   function setToToday() {
      let updatedDate = moment();
      setMonth(updatedDate.format("M"));
      setYear(updatedDate.format("YYYY"));
      updateDate(updatedDate.format("M"), updatedDate.format("YYYY"));
   }

   function clickWeek(index) {
      setWeek(index);
   }

   return (
      <Box direction="column">
         <Text className="font-bold text-center text-2xl">{moment(selectedMonth, "M").format("MMMM")} {selectedYear}</Text>
         <Box direction="row" justify="around" className="pt-3 pb-3 border-t border-b">
            <Button onClick={previousYear}>
               <ChapterPrevious />
            </Button>
            <Button onClick={previousMonth}>
               <CaretPrevious />
            </Button>
            <Text className="font-bold cursor-pointer text-blue-600" onClick={setToToday}>TODAY</Text>
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
                     <Box className="m-1 pt-5 pb-4 border rounded text-center cursor-pointer" style={{borderColor: month.number == selectedMonth ? 'green' : ''}} fill key={month.number} onClick={() => selectMonth(month.number)}>
                        <Text>{month.name}</Text>
                     </Box>
                  ))}
               </Box>
            ))}
         </Box>
         {useWeeks && <Box className="p-3">
            <List data={weeks} primaryKey="formatted" onClickItem={({index}) => clickWeek(index)} />
         </Box>}
      </Box>
   )
}