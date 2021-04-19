const { json } = require('express');
var express = require('express');
const db = require('../middleware/db');
var router = express.Router();
const crypt = require('../middleware/crypt');

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.session.user){
    return res.render('index', { title: 'Rubenson' });
  }

  return res.render('login');
});

/* GET addStudent page. */
router.get('/add', function(req, res, next) {
  if(req.session.user){
    return res.render('add', { title: 'Add Student' });
  }

  return res.render('add');
});

router.get('/add-mockdata', async function(req, res){
  //Sql line: INSERT INTO Student VALUES(NULL, "email@email.com", "first1", "m1", "last1", "8318318310", NULL, NULL, NULL, 11, "current")
  let query = "INSERT INTO Student VALUES(NULL,?,?,?,?,?,NULL,NULL,NULL,?,?)"
  //to add another mockdata point copy the sample values and replace them with your values
  // sample values: ["email@email.com", "first1", "m1", "last1", "8318318310", 11, "current"]
  let mockdata = [
    ["email@email.com", "first1", "m1", "last1", "8318318310", 11, "current"],
    ["email2@email.com", "John", "middle", "Smith", "8318318311", 13, "Former"]
  ]

  for(n in mockdata){
    // checks if the row is already in the db
    let info = await db.query(db.pool, "SELECT * FROM Student WHERE student_email=?", mockdata[n][0]).catch((err) => {
      return []
    });

    // if the mockdata row is not in the db insert it
    if(Array.isArray(info) && !info.length){
      await db.query(db.pool, query, mockdata[n]).catch((err) => {
        console.log(err);
      });
    }
  }

  return res.json({success: true});
})

module.exports = router;
