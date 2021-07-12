const cheerio = require('cheerio');
const got = require('got');
const fs = require('fs');
import { supabase } from '../../api';
import moment from 'moment';

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
   let booklet = '';
   let body = [];

   if (!year || !week) {
      res.json(body);
      return;
   };

   if (!lang) {
      lang = 'en';
   }
   
   const { data } = await supabase
      .from('schedule_midweek_global')
      .select('*')
      .filter('language', 'eq', lang)
      .filter('week', 'eq', week)
      .filter('year', 'eq', year);
   
   body = {items:data};
   if (body && body.items && body.items.length > 0) {
      res.json(body);
      return;
   }

   if (lang == 'en') {
      booklet = `https://wol.jw.org/en/wol/meetings/r1/lp-e/${year}/${week}`;
   } else if (lang == 'hc') {
      booklet = `https://wol.jw.org/ht/wol/meetings/r60/lp-cr/${year}/${week}`;
   } else if (lang == 'es') {
      booklet = `https://wol.jw.org/es/wol/meetings/r4/lp-s/${year}/${week}`;
   }

   const response = await got(booklet);
   const $ = cheerio.load(response.body);
   const items = [];

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
   
   function processItem(section, elem, isHeader) {
      var text = $(elem).text();

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
            text: text.trim(),
            type: '',
            title,
            description,
            section,
            elemClass,
            order: 0,
            song: song ? song[0] : null,
            time: time,
            lesson: lesson ? lesson[0] : null,
            studentPart: false,
            householder: false,
            chairman: false,
            header: isHeader,
            reader: false,
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
         var engItems = getData().filter(i => i.elemClass == elemClass);
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

   [1,2,3,4].map(section => {
      if (section > 1) {
         processItem(section, $('h2').toArray()[section - 1], true);
      } else if (section === 1 && items.length === 0) {
         var item = $('header h2').text();
         items.push({
           text: item,
           type: 'WEEKLY',
           title: item,
           description: '',
           section: 0, 
           elemClass: 'p2',
           order: 0,
           song: null,
           time: 0,
           lesson: null,
           studentPart: false,
           householder: false,
           chairman: false,
           header: false,
           reader: false,
           week,
           year,
           language: lang
         });
      }
      $('#section' + section + ' > .pGroup > ul li').map((i, item) => processItem(section, item, false));
   });

   await supabase
      .from('schedule_midweek_global')
      .insert(items)

   body = {
      items
   };

   res.json(body);
}

function getData() {
   return [
      {
          "text": "DEUTERONOMY 13-15",
          "type": "WEEKLY",
          "title": "DEUTERONOMY 13-15",
          "description": "",
          "section": 0,
          "elemClass": "p2",
          "order": 0,
          "song": null,
          "time": 0,
          "lesson": null,
          "studentPart": false,
          "householder": false,
          "chairman": false,
          "header": false,
          "reader": false
      },
      {
          "text": "Song 38 and Prayer",
          "type": "PRAYER",
          "title": "Song 38 and Prayer",
          "description": null,
          "section": 1,
          "elemClass": "p3",
          "order": 2,
          "song": "Song 38",
          "time": 5,
          "lesson": null,
          "studentPart": false,
          "householder": false,
          "chairman": false,
          "header": false,
          "reader": false
      },
      {
          "text": "Opening Comments (1 min.)",
          "type": "COMMENTS",
          "title": "Opening Comments",
          "description": "",
          "section": 1,
          "elemClass": "p4",
          "order": 3,
          "song": null,
          "time": 1,
          "lesson": null,
          "studentPart": false,
          "householder": false,
          "chairman": true,
          "header": false,
          "reader": false
      },
      {
          "text": "TREASURES FROM GOD’S WORD",
          "type": "HEADER",
          "title": "TREASURES FROM GOD’S WORD",
          "description": null,
          "section": 2,
          "elemClass": "p5",
          "order": 4,
          "song": null,
          "time": 0,
          "lesson": null,
          "studentPart": false,
          "householder": false,
          "chairman": false,
          "header": true,
          "reader": false
      },
      {
          "text": "“How the Law Demonstrated Jehovah’s Concern for the Poor”: (10 min.)",
          "type": "TREASURES",
          "title": "“How the Law Demonstrated Jehovah’s Concern for the Poor”",
          "description": "",
          "section": 2,
          "elemClass": "p6",
          "order": 5,
          "song": null,
          "time": 10,
          "lesson": null,
          "studentPart": false,
          "householder": false,
          "chairman": false,
          "header": false,
          "reader": false
      },
      {
          "text": "Spiritual Gems: (10 min.)\nDe 14:21​—What can we learn from the prohibition in the Law not to boil a young goat in its mother’s milk? (w06 4/1 31)\n\nWhat spiritual gems from this week’s Bible reading would you like to share regarding Jehovah, the field ministry, or something else?",
          "type": "GEMS",
          "title": "Spiritual Gems",
          "description": "De 14:21​—What can we learn from the prohibition in the Law not to boil a young goat in its mother’s milk? (w06 4/1 31)\n\nWhat spiritual gems from this week’s Bible reading would you like to share regarding Jehovah, the field ministry, or something else?",
          "section": 2,
          "elemClass": "p7",
          "order": 6,
          "song": null,
          "time": 10,
          "lesson": null,
          "studentPart": false,
          "householder": false,
          "chairman": false,
          "header": false,
          "reader": false
      },
      {
          "text": "Bible Reading: (4 min.) De 13:1-18 (th study 5)",
          "type": "READING",
          "title": "Bible Reading",
          "description": "De 13:1-18",
          "section": 2,
          "elemClass": "p10",
          "order": 7,
          "song": null,
          "time": 4,
          "lesson": "th study 5",
          "studentPart": true,
          "householder": false,
          "chairman": false,
          "header": false,
          "reader": false
      },
      {
          "text": "APPLY YOURSELF TO THE FIELD MINISTRY",
          "type": "HEADER",
          "title": "APPLY YOURSELF TO THE FIELD MINISTRY",
          "description": null,
          "section": 3,
          "elemClass": "p11",
          "order": 8,
          "song": null,
          "time": 0,
          "lesson": null,
          "studentPart": false,
          "householder": false,
          "chairman": false,
          "header": true,
          "reader": false
      },
      {
          "text": "Return Visit Video: (5 min.) Discussion. Play the video Return Visit: Suffering​—1Jo 5:19. Stop the video at each pause, and ask the audience the questions that appear in the video.",
          "type": "VIDEO",
          "title": "Return Visit Video",
          "description": "Discussion. Play the video Return Visit: Suffering​—1Jo 5:19. Stop the video at each pause, and ask the audience the questions that appear in the video.",
          "section": 3,
          "elemClass": "p12",
          "order": 9,
          "song": null,
          "time": 5,
          "lesson": null,
          "studentPart": false,
          "householder": false,
          "chairman": true,
          "header": false,
          "reader": false
      },
      {
          "text": "Return Visit: (3 min.) Use the sample conversation. (th study 6)",
          "type": "DEMO",
          "title": "Return Visit",
          "description": "Use the sample conversation.",
          "section": 3,
          "elemClass": "p13",
          "order": 10,
          "song": null,
          "time": 3,
          "lesson": "th study 6",
          "studentPart": true,
          "householder": true,
          "chairman": false,
          "header": false,
          "reader": false
      },
      {
          "text": "Return Visit: (5 min.) Begin with the sample conversation. Offer a publication from the Teaching Toolbox. (th study 11)",
          "type": "DEMO",
          "title": "Return Visit",
          "description": "Begin with the sample conversation. Offer a publication from the Teaching Toolbox.",
          "section": 3,
          "elemClass": "p14",
          "order": 11,
          "song": null,
          "time": 5,
          "lesson": "th study 11",
          "studentPart": true,
          "householder": true,
          "chairman": false,
          "header": false,
          "reader": false
      },
      {
          "text": "LIVING AS CHRISTIANS",
          "type": "HEADER",
          "title": "LIVING AS CHRISTIANS",
          "description": null,
          "section": 4,
          "elemClass": "p15",
          "order": 12,
          "song": null,
          "time": 0,
          "lesson": null,
          "studentPart": false,
          "householder": false,
          "chairman": false,
          "header": true,
          "reader": false
      },
      {
          "text": "Song 7",
          "type": "SONG",
          "title": "Song 7",
          "description": null,
          "section": 4,
          "elemClass": "p16",
          "order": 13,
          "song": "Song 7",
          "time": 5,
          "lesson": null,
          "studentPart": false,
          "householder": false,
          "chairman": false,
          "header": false,
          "reader": false
      },
      {
          "text": "“Never Be Anxious”: (15 min.) Discussion. Play the video Love Never Fails Despite . . . Poverty​—Congo.",
          "type": "LIVING",
          "title": "“Never Be Anxious”",
          "description": "Discussion. Play the video Love Never Fails Despite . . . Poverty​—Congo.",
          "section": 4,
          "elemClass": "p17",
          "order": 14,
          "song": null,
          "time": 15,
          "lesson": null,
          "studentPart": false,
          "householder": false,
          "chairman": false,
          "header": false,
          "reader": false
      },
      {
          "text": "Congregation Bible Study: (30 min.) rr chap. 10 ¶13-17, boxes 10B and 10C",
          "type": "CBS_CONDUCTOR",
          "title": "Congregation Bible Study",
          "description": "rr chap. 10 ¶13-17, boxes 10B and 10C",
          "section": 4,
          "elemClass": "p18",
          "order": 15,
          "song": null,
          "time": 30,
          "lesson": null,
          "studentPart": false,
          "householder": false,
          "chairman": false,
          "header": false,
          "reader": true
      },
      {
          "text": "Concluding Comments (3 min.)",
          "type": "COMMENTS",
          "title": "Concluding Comments",
          "description": "",
          "section": 4,
          "elemClass": "p19",
          "order": 16,
          "song": null,
          "time": 3,
          "lesson": null,
          "studentPart": false,
          "householder": false,
          "chairman": false,
          "header": false,
          "reader": false
      },
      {
          "text": "Song 71 and Prayer",
          "type": "PRAYER",
          "title": "Song 71 and Prayer",
          "description": null,
          "section": 4,
          "elemClass": "p20",
          "order": 17,
          "song": "Song 71",
          "time": 5,
          "lesson": null,
          "studentPart": false,
          "householder": false,
          "chairman": false,
          "header": false,
          "reader": false
      }
  ]
}