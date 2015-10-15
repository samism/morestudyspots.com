var express = require('express');
var fs = require('fs');
var router = express.Router();

router.get('/', function(req, res, next) {
    var vm = {
        title: "Spots",
        studySpots: JSON.parse(fs.readFileSync('spot-file.json', 'utf8'))
    };


    res.render('spots', vm);
});

module.exports = router;
