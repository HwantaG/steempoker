var steem = require('steem');
var pokerevaluator = require('poker-evaluator');
var forEach = require('async-foreach').forEach;
var arraySort = require('array-sort');
var constants = require('./config.json')
var requesthandler = require('./lib/requesthandler.js');    // DB query library(private source)

steem.api.setOptions({ url: 'https://api.steemit.com' });

var chanceMaxVoting = 1;
var chanceUnitVoting = 0.25;
//[ '2c','2d','2h','2s','3c','3d','3h','3s','4c','4d','4h','4s','5c','5d','5h','5s','6c','6d','6h','6s','7c','7d','7h','7s','8c','8d','8h','8s','9c','9d','9h','9s','tc','td','th','ts','jc','jd','jh','js','qc','qd','qh','qs','kc','kd','kh','ks','ac','ad','ah','as' ]
var totalCards = Object.keys(pokerevaluator.CARDS);
var author = constants.author;    // pokersteem
var permlink;
// community cards
var card1 = -1;
var card2 = -1;
var card3 = -1;
// rank list
var ranking = new Array();
// under $0.01 voter list
var cutList = new Array();

var param = new Array();

console.log('===============================================================');

var content;
// get posting info and community cards from database
requesthandler('LST-POKERPOSTINGCARDS', param, function(err, val1){
  if(err){
  
  } else {
    if(val1.length == 0) return;
    permlink = val1[0].permlink;
    card1 = val1[0].card1;
    card2 = val1[0].card2;
    card3 = val1[0].card3;
    var voting = val1[0].voting;
    
    // get voter list
    steem.api.getContent(author, permlink, function(err, result) {
      if(err){
       
      } else {
        content = result;
        console.log(content);

        forEach(result.active_votes, function(value, index, arr) {
          console.log(value.voter);
          
          // except pokersteem
          if(value.voter == 'pokersteem') continue;

          // cancel voter ignore
          if(value.percent == "0") continue;

          // get voting list
          var voteSBD = value.rshares / content.vote_rshares * content.pending_payout_value.split(' ')[0];
          console.log("vote SDB : " + voteSBD);

          // check under $0.01
          if(voteSBD >= 0.01){
            // iterate by voting amount
            for(var shuffleCnt = 0 ; voteSBD > 0 && shuffleCnt <= chanceMaxVoting / chanceUnitVoting; voteSBD -= chanceUnitVoting, shuffleCnt++){
              var boardCards = shuffleRandom(52);
              var card4 = -1;
              var card5 = -1;
              
              for(var i = 0 ; i < boardCards.length ; i++){
                // ignore same community cards
                if(totalCards[boardCards[i] - 1] != card1 && totalCards[boardCards[i] - 1] != card2 && totalCards[boardCards[i] - 1] != card3){
                  // assign user 2 cards
                  if(card4 == -1) card4 = totalCards[boardCards[i] - 1];
                  else if(card5 == -1) {
                    card5 = totalCards[boardCards[i] - 1];
                    break;
                  }
                }
              }
              
              var cards = {card1 : card1, card2 : card2, card3: card3, card4 : card4, card5 : card5};
              // scoring cards
              var voteresult = pokerevaluator.evalHand([card1, card2, card3, card4, card5]);
              
              ranking.push({voter : value, cards : cards, result : voteresult});
            }
          }else{
            cutList.push(value.voter);
          }
        }, allDone);
      }
    });
  }
});

function shuffleRandom(n){
  var ar = new Array();
  var temp;
  var rnum;
  for(var i=1; i<=n; i++){
    ar.push(i);
  }
  
  for(var i=0; i< ar.length ; i++)
  {
    rnum = Math.floor(Math.random() *n);
    temp = ar[i];
    ar[i] = ar[rnum];
    ar[rnum] = temp;
  }
  
  return ar;
}
 
function allDone(notAborted, arr) {
  // game close title
  var title = '[Closed]' + content.title;

  // nobody over $0.01
  if(ranking.length == 0){
    var param = new Array();
    param.push({permlink : permlink});
    console.log('title : ' + title);
    console.log('empty voter');
    var body = content.body;
    body += "<br>";
    body += "<br>";
    body += "<br>";
    body += "<p>=======================================================</p>";
    body += "<h1>Game Result..!!</h1>"
    body += "<br>";
    
    if(cutList.length == 0){
      body += '<h1>No voters..!!</h1>';
    }else{
      body += "<table style='width:100%' textalign='center'>";
      body += "<tr align=center>";
      body += "<th>Rank</th>"
      body += "<th>User</th>";
      body += "<th>Cards</th>"; 
      body += "<th>Result</th>";
      body += "</tr>";

      for(var i=0; i<cutList.length; i++){
        body += "<tr>";
        body += "<td align=center>-</td>";
        body += "<td align=center>" + cutList[i] + "</td>";
        body += "<td align=center>Under $0.01</td> ";
        body += "<td align=center></td>";
        body += "</tr>";
      }

      body += "</table>";
    }

    steem.broadcast.comment(
      constants.posting, // posting wif
      '', // author, leave blank for new post
      content.category, // first tag
      content.author, // username
      permlink, // permlink
      title, // Title
      body, // Body of post
      // json metadata (additional tags, app name, etc)
      content.json_metadata,
      function (err, result) {
        if (err)
          console.log('Result Comment Failure! ' + err);
        else{
          requesthandler('UPD-POKERPOSTINGRESULT', param, function(err, val1){
              if(err) {
                console.log(err);
              } else {
                
              }
          });
        }
      });          

    return;
  }

  // sort by ranking
  arraySort(ranking, 'result.value', {reverse: true});
  console.log(ranking);

  var body = content.body;
  console.log(body);
  var paramresult = new Array();   
  
  body += "<br>";
  body += "<br>";
  body += "<br>";
  body += "<p>=======================================================</p>";
  body += "<h1>Game Result..!!</h1>"
  body += "<br>";

  body += "<table style='width:100%' textalign='center'>";
  body += "<tr align=center>";
  body += "<th>Rank</th>"
  body += "<th>User</th>";
  body += "<th>Cards</th>"; 
  body += "<th>Result</th>";
  body += "</tr>";

  // append ranking list
  for(var i = 0 ; i < ranking.length ; i++){
    body += "<tr>";
    body += "<td align=center>" + (i + 1) + "</td>";
    body += "<td align=center>" + ranking[i].voter.voter + "</td>";
    body += "<td align=center>" + constants[ranking[i].cards.card4] + constants[ranking[i].cards.card5]+ "</td> ";
    body += "<td align=center>" + ranking[i].result.handName + "</td>";
    body += "</tr>";
    paramresult.push({permlink : permlink, 
                rank : i + 1, 
                voter : ranking[i].voter.voter, 
                card4 : ranking[i].cards.card4, 
                card5 : ranking[i].cards.card5, 
                handname : ranking[i].result.handName,
                value : ranking[i].result.value
    });
  }

  for(var i=0; i<cutList.length; i++){
    body += "<tr>";
    body += "<td align=center>-</td>";
    body += "<td align=center>" + cutList[i] + "</td>";
    body += "<td align=center>Under $0.01</td> ";
    body += "<td align=center></td>";
    body += "</tr>";
  }

  body += "</table>";
  // console.log(body);

  // post result
  steem.broadcast.comment(
    constants.posting, // posting wif
    '', // author, leave blank for new post
    content.category, // first tag
    content.author, // username
    permlink, // permlink
    title, // Title
    body, // Body of post
    // json metadata (additional tags, app name, etc)
    content.json_metadata,
    function (err, result) {
      if (err)
        console.log('Result Comment Failure! ' + err);
      else{
        // save result to DB
        requesthandler('CRT-POKERRESULT', paramresult, function(err, val1){
            if(err) {
              console.log('Save Failure!! ' + err);
            } else {
              var paramresulttag = new Array();
              paramresulttag.push({permlink : permlink});
              // update posting status
              requesthandler('UPD-POKERPOSTINGRESULT', paramresulttag, function(err, val1){
                  if(err) {
                    console.log('Update Failure! ' + err);
                    // if fail delete result
                    requesthandler('DLT-POKERESULT', paramresulttag, function(err, val1){
                      if(err){
                        console.log('delete Failure! ' + err);
                      }
                      else{
                        console.log('delete poker result Success');
                      }
                    });
                  } else {
                    // posting success
                    console.log('Posting Result Success');
                  }
              });
            }
        });
      }
  });
}