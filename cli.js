const mysql = require("mysql");
const inquirer = require("inquirer");
const fs = require("fs");



var logged;
var connection = mysql.createConnection({
    host: "10.50.50.199",
    port: 3306,
    user: "seth",
    password: "1",
    database: "scans_raw"
});

connection.connect(function(err) {
    if (err) throw err;
    domenu();
});




let domenu = async () => {
    const answer = await inquirer.prompt([{
        name:"query",
        type:"input",
        message:"name your export file"
    },
    {
        name: "operation",
        type: "list",
        message: "Would you like to [SEARCH FOR A TRACKING # TO SEE WHEN/IF IT SCANNED], [GET ALL SCANS FROM AN ENTERED TIME PERIOD]?",
        choices: ["SEARCH", "GET"]
      }]);
      var fileName = answer.query;
      if (answer.operation === "GET") {
        
        inquirer.prompt([{
            name: "begin",
            type: "input",
            message: "Enter Beginning Time (YYYY-MM-DD hh:mm) in 24 hour time"
          },
          {
            name: "end",
            type: "input",
            message: "Enter Ending Time (YYYY-MM-DD hh:mm) in 24 hour time"
          }
        ]).then(function(data){
              var begin = data.begin;
              var end = data.end;
            get(begin,end,fileName);
          })
    
      } else if (answer.operation === "SEARCH") {
        inquirer.prompt({
            name: "tracking",
            type: "input",
            message: "Enter Tracking #"
          }
          ).then(function(data){
              var track = data.tracking;
            search(track,fileName);
          })
  
      } else {
        connection.end(); //quit!
      }
  };

function get(beg,en, fileName) {
    console.log("Processing Query...\n");
    connection.query(`SELECT * FROM scans_raw WHERE timestamped 
    BETWEEN '${beg}' AND '${en}'`, function(err, res) {
      if (err) throw err
      var log = JSON.stringify(res)
      logged = JSON.parse(log);
      writeCSV(logged, fileName);
      connection.end();
    });
}

function search(track, fileName) {
    console.log("Processing Query...\n");
    connection.query(`SELECT * FROM scans_raw WHERE code='${track}'`, function(err, res) {
      if (err) {
          console.log("query failure")
          throw err; 
        }
      var log = JSON.stringify(res)
      logged = JSON.parse(log);
      if (logged.length===0){
          console.log("no scans found")
      } else {writeCSV(logged,fileName);}
      connection.end();
    });
}

function writeCSV(array, fileName) {
    var csv = 'number,sid,code,timestamped,scanner,shipper\n'
    for (var i = 0; i < array.length; i++) {
        var sid = array[i].sid;
        var code = array[i].code;
        var timestamped = array[i].timestamped;
        var scanner = array[i].scanner;
        var shipper = array[i].shipper;
        var string = `${i},${sid},${code},${timestamped},${scanner},${shipper}\n`;
        csv += string;
    }

    fs.writeFile(`${fileName}.csv`, csv, function(err) {

        if (err) {
          return console.log(err);
        }
      
        console.log("Success!");
      
    });
}