var express = require('express');
var router = express.Router();
var textToSpeech = require('../helpers/tts');

/* GET home page. */
router.post('/', function(req, res, next) {

  textToSpeech(req.body.text, req.body.voice)
  .then(result => {
    res.json(result);    
  })
  .catch(err => {
    res.json({});
  });


});
router.get('/', function(req, res, next) {

  res.send("HELLLLOOO")


});
module.exports = router;
