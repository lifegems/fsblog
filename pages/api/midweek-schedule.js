const cheerio = require('cheerio');
const got = require('got');
import { supabase } from '../../api';
import moment from 'moment';

let $;
let engData = [];

async function getScheduleFromDB(year, week, lang) {
   const { data } = await supabase
      .from('schedule_midweek_global')
      .select('*')
      .filter('language', 'eq', lang)
      .filter('week', 'eq', week)
      .filter('year', 'eq', year);
   return data;
}

function getSourceURL(year, week, lang) {
   switch (lang) {
      case 'en': return `https://wol.jw.org/${lang}/wol/meetings/r1/lp-e/${year}/${week}`;
      case 'es': return `https://wol.jw.org/${lang}/wol/meetings/r4/lp-s/${year}/${week}`;
      case 'hc': return `https://wol.jw.org/${lang}/wol/meetings/r60/lp-cr/${year}/${week}`;
      default: return '';
   }
}

async function getScheduleFromSource(year, week, lang) {
   let src = getSourceURL(year, week, lang);
   if (!src) return [];
   const response = await got(src);
   $ = cheerio.load(response.body);
   let items = [];
   [1,2,3,4].map(section => mapSection(section, items, week, year, lang));
   return items;
}

function newItem() {
   return {
      text: '',
      type: '',
      title: '',
      description: '',
      section: 0,
      elemClass: '',
      order: 0,
      song: null,
      time: 0,
      lesson: null,
      studentPart: false,
      householder: false,
      chairman: false,
      header: false,
      reader: false,
      week: 0,
      year: 0,
      language: ''
   }
}

function processItem(section, elem, isHeader, lang, items, week, year) {
   var text = $(elem).text().trim();

   if (lang === 'en') {
      var elemClass = isHeader ? $(elem)[0].attribs.id : $(elem)[0].children[0].attribs.id;
      var song = text.match(/Song\s[0-9]+/gi);
      var lesson = text.match(/th\sstudy\s[0-9]+/gi);
      var timestamp = text.match(/([0-9]+)\smin\./gi);
      var time = timestamp ? parseInt(timestamp[0].split(' ')[0]) : 0;
      var title = text.split(':')[0].trim();
      var description = text.split('min.)');
      description = description.length > 1 ? description[1].split('(th')[0].trim() : null;
   
      var item = {
         ...newItem(),
         text,
         title,
         description,
         section,
         elemClass,
         song: song ? song[0] : null,
         time: time,
         lesson: lesson ? lesson[0] : null,
         header: isHeader,
         week,
         year,
         language: lang
      }
      addTypeData(item);
   
      if (item.type !== 'GEMS1' && item.type !== 'GEMS2') {
         item.order = items.length + 1;
         items.push(item);
      }
   } else {
      var elemClass = isHeader ? $(elem)[0].attribs.id : $(elem)[0].children[0].attribs.id;
      var engItems = engData.filter(i => i.elemClass == elemClass);
      if (engItems && engItems.length == 0) {
         return false;
      }
      var engItem = engItems[0];
      var title = text.split(':')[0].trim(); //TODO check other languages to see if alternate symbols are used.
      var description = text.split('.)'); //TODO fix for languages that spell this differently --- text.split('.min)');
      description = description.length > 1 ? description[1].split('(th')[0].trim() : null;
   
      var item = {
         text: text.trim(),
         type: engItem.type,
         title,
         description,
         section,
         elemClass,
         order: engItem.order,
         song: engItem.song,
         time: engItem.time,
         lesson: engItem.lesson,
         studentPart: engItem.studentPart,
         householder: engItem.householder,
         chairman: engItem.chairman,
         header: isHeader,
         reader: engItem.reader,
         week,
         year,
         language: lang
      }
   
      if (item.type !== 'GEMS1' && item.type !== 'GEMS2') {
         item.order = items.length + 1;
         items.push(item);
      }
   }
}

function addTypeData(item) {
   if (item.elemClass === "p3" && item.text.match(/prayer/gi)) {
      item.type = 'PRAYER';
      item.time += 5;
   } else if (item.elemClass === "p4") {
      item.type = 'COMMENTS';
      item.chairman = true;
      item.title = item.text.split('(')[0].trim();
   } else if (item.text.match(/TREASURES|MINISTRY|CHRISTIANS/g)) {
      item.type = 'HEADER';
   } else if (item.elemClass === "p6") {
      item.type = 'TREASURES';
   } else if (item.elemClass === "p7") {
      item.type = 'GEMS';
   } else if (item.elemClass === "p8") {
      item.type = 'GEMS1';
   } else if (item.elemClass === "p9" && item.text.length === item.title.length) {
      item.type = 'GEMS2';
   } else if (item.text.match(/Song/gi) && !item.text.match(/Prayer/gi)) {
      item.type = 'SONG';
      item.time += 5;
   } else if (item.section === 2 && item.title === 'Bible Reading') {
      item.type = 'READING';
      item.studentPart = true;
   } else if (item.section === 3 && item.title.indexOf('Video') > -1) {
      item.type = 'VIDEO';
      item.chairman = true;
   } else if (item.section === 3 && ['Initial Call','Return Visit','Bible Study'].indexOf(item.title) > -1) {
      item.type = 'DEMO';
      item.studentPart = true;
      item.householder = true;
   } else if (item.section === 3 && item.title === 'Talk') {
      item.type = 'TALK';
      item.studentPart = true;
   } else if (item.section === 4 && !item.title.match(/Congregation Bible Study/gi) && !item.title.match(/Song [0-9]+ and Prayer/gi) && !item.title.match(/Concluding Comments/gi)) {
      item.type = 'LIVING';
   } else if (item.section === 4 && item.title.match(/Congregation Bible Study/gi)) {
      item.type = 'CBS_CONDUCTOR';
      item.reader = true;
   } else if (item.section === 4 && item.title.match(/Concluding Comments/gi)) {
      item.type = 'COMMENTS';
      item.title = item.text.split('(')[0].trim();
   } else if (item.section === 4 && item.song) {
      item.type = 'PRAYER';
      item.time += 5;
   }
}

function mapSection(section, items, week, year, lang) {
   if (section > 1) {
      processItem(section, $('h2').toArray()[section - 1], true, lang, items, week, year);
   } else if (section === 1 && items.length === 0) {
      var title = $('header h2').text();
      items.push({
         ...newItem(),
         text: title,
         type: 'WEEKLY',
         title: title,
         elemClass: 'p2',
         week,
         year,
         language: lang
      });
   }
   $('#section' + section + ' > .pGroup > ul li').map((i, item) => processItem(section, item, false, lang, items, week, year));
}

async function saveItemsToDB(data) {
   await supabase
      .from('schedule_midweek_global')
      .insert(data);
}

/**
 * Use https://codesandbox.io/s/cheerio-playground-forked-pfij3?file=/src/index.js as a playground
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
module.exports = async (req, res) => {
   res.setHeader('Access-Control-Allow-Origin', '*');
   let { year, week, lang } = req.query;
   let body = {items:[]};
   let items = [];

   if (!year || year < 2021 || year > 2030 || !week || week < 0 || week > 52) {
      res.json({...body, message: 'Invlid week or year parameters'});
      return;
   };

   if (!lang || ['en','es','hc'].indexOf(lang) == -1) {
      res.json({...body, message: 'Invlid lang parameter'});
      return;
   }

   if (lang == 'en') {
      let data = await getScheduleFromDB(year, week, lang);
      if (!data || data.length == 0) {
         data = await getScheduleFromSource(year, week, lang);
      }
      items = data;
   } else {
      let data = await getScheduleFromDB(year, week, lang);
      if (!data || data.length == 0) {
         engData = await getScheduleFromDB(year, week, 'en');
         if (!engData || engData.length == 0) {
            engData = await getScheduleFromSource(year, week, 'en');
         }
         await saveItemsToDB(engData);
         data = await getScheduleFromSource(year, week, lang);
      }
      items = data;
   }
   
   await saveItemsToDB(items);

   body = {
      items
   };

   res.json(body);
}
