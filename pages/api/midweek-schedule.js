const cheerio = require('cheerio');
const got = require('got');
const fs = require('fs');

/**
 * Use https://codesandbox.io/s/cheerio-playground-forked-pfij3?file=/src/index.js as a playground
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
module.exports = async (req, res) => {
   res.setHeader('Access-Control-Allow-Origin', '*');
   const { year, week } = req.query;
   let body = [];

   if (!year || !week) {
      res.json(body);
      return;
   };
   const booklet = `https://wol.jw.org/en/wol/meetings/r1/lp-e/${year}/${week}`;
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
       description: description,
       section, elemClass,
       order: 0,
       song: song ? song[0] : null,
       time: time,
       lesson: lesson ? lesson[0] : null,
       studentPart: false,
       householder: false,
       chairman: false,
       header: isHeader,
       reader: false
     }
     addTypeData(item);
   
     if (item.type !== 'GEMS1' && item.type !== 'GEMS2') {
       item.order = items.length + 1;
       items.push(item);
     }
   }
   
   // processItem(0, $('#p2'), false);
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
           reader: false
         });
      }
      $('#section' + section + ' > .pGroup > ul li').map((i, item) => processItem(section, item, false));
   });

   body = {
      items
   };

   res.json(body);
}
