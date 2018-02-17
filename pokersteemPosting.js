var steem = require('steem');
var pokerevaluator = require('poker-evaluator');
var requesthandler = require('./lib/requesthandler.js');
// 
var constants = require('./config.json')

// rpc.dist.one
steem.api.setOptions({ url: 'https://api.steemit.com' });

var tag1 = process.argv[2];

Date.prototype.yyyymmdd = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('');
};

var date = new Date();

var title = 'Voting Game!!!!! Five Poker!!!!!-' + date.yyyymmdd() + '-Round ' + tag1;
var permlink = date.yyyymmdd() + '-' + tag1;
var boardCards = shuffleRandom(52);
var totalCards = Object.keys(pokerevaluator.CARDS);
var card1 = totalCards[boardCards[0] - 1];
var card2 = totalCards[boardCards[1] - 1];
var card3 = totalCards[boardCards[2] - 1];

var content = '';
content += constants.postingImage2;

content += '<h1>Just vote, Play game and receive SBD.</h1>';
content += '<br>';
content += '<br>';
content += '<h1>Join Rule</h1>';
content += '<br>';
content += '- If you are interested in participating, vote this posting.';
content += '<br>';
content += '- This post will be posted 8 times a day.';
content += '<br>';
content += '- You can participate in all games that are not closed.';
content += '<br>';
content += '- It can be seen through the title. The closed game has the title "[Close]".';
content += '<br>';
content += '- The validity of the posting game is valid for 24 hours, and after that, you can not participate this game round.';
content += '<br>';
content += '- Game results will be updated after 24 hours.';
content += '<br>';
content += '- Less than $0.01 voting may not be able to participate.';
content += '<br>';
content += '<br>';
content += '<h1>Winner Reward</h1>';
content += '<br>';
content += '<h4>1st Place</h4><br>';
content += '- Send 70% of the reward SBD of this article after payout.';
content += '<br>';
content += '<h4>2nd Place</h4><br>';
content += '- Send 20% of the reward SBD of this article after payout.';
content += '<br>';
content += '<h4>3rd Place</h4><br>';
content += '- Send 5% of the reward SBD of this article after payout.';
content += '<br>';
content += '<h4>And so on..</h4><br>'
content += '- We will consider additional rewards for main decks such as Straight Flush, Four of a kind, and Full House in the future.';
content += '<br>';
content += '- (The remaining 5% is used for development and maintenance.)';
content += '<br>';
content += '- If there are less than 3 participants, the compensation will only be paid for the number of participants.';
content += '<br>';
content += '<br>';
content += '<h1>Game Rule</h1>';
content += '<br>';
content += '- Participants can not intervene in the game (automatic progression).';
content += '<br>';
content += '- 5 cards in total.';
content += '<br>';
content += '- Three community cards are given at the same time as posting.';
content += '<br>';
content += '- Game participants will receive two random cards at the result posting, and will compete for a total of five cards, including three community cards.';
content += '<br>';
content += '<h4>- There will be additional opportunities depending on the amount of voting.</h4>';
content += '<br>';
content += '- $0.01 ~ $0.249 >>> 1 time';
content += '<br>';
content += '- $0.25 ~ $0.499 >>> 2 times';
content += '<br>';
content += '- $0.50 ~ $0.749 >>> 3 times';
content += '<br>';
content += '- $0.75 ~ $0.999 >>> 4 times';
content += '<br>';
content += '- over $1.00 >>> 5times(Max)';
content += '<br>';
content += '- The poker winner follows the usual poker rules.';
content += '<br>';
content += '<br>';
content += '<h4>Rewards and game rules may change depending on the situation.</h4>';
content += '<br>';
content += '<br>';

content += '<h1>Community Card</h1>';
content += '<br />';
content += constants[card1];
content += constants[card2];
content += constants[card3];

var param = new Array();
param.push({permlink : permlink, card1 : card1, card2 : card2, card3 : card3});

steem.broadcast.comment(
        constants.posting, // posting wif
        '', // author, leave blank for new post
        constants.category, // first tag
        constants.author, // username
        permlink, // permlink
        title, // Title
        content, // Body of post
        // json metadata (additional tags, app name, etc)
        { tags: ['money', 'steemit', 'gaming', 'game'], app: '' },
        function (err, result) {
          if (err)
            console.log('Failure! ' + err);
          else{
            // save posting content to database
            requesthandler('CRT-POKERPOSTING', param, function(err, val1){
            	if(err) {
                  console.log('DB Failure! ' + err);
            	} else {
                    console.log('Success');      
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
 
