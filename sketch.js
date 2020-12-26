let dotenv = require('dotenv').config();
let Twit = require('twit');
let EventSource = require('eventsource');
let fetch = require('node-fetch');
// let Twitter = require('twitter');

const tweetInterval = 12000;
const emojiTrackerURL = 'https://api.emojitracker.com/v1/rankings';
const streamEndpoint = "https://stream.emojitracker.com";
let evsource = new EventSource(`${streamEndpoint}/subscribe/eps`);
const MAX_CHARS = 280;
let emojiJSONarray;

let client = new Twit({
    consumer_key: process.env.api_key,
    consumer_secret: process.env.api_key_secret,
    access_token: process.env.access_token,
    access_token_secret:  process.env.access_token_secret,
})
function indexFromId(id){
    for(let i = 0; i < emojiJSONarray.length; i++){
        if(emojiJSONarray[i].id == id){
            return i;
        }
    }
    return -1;
}
function checkArray(array){
    for(let i = 0; i < array.length - 1; i++){
        if(array[i].score < array[i + 1].score){
            return false
        }
    }
    return true
}
async function setup(){
    if(dotenv.error) throw dotenv.error;
    console.log(dotenv.parsed);
    emojiJSONarray = await fetch(emojiTrackerURL).then(response => response.json());
    console.log(emojiJSONarray, emojiJSONarray.length, checkArray(emojiJSONarray))
    evsource.onmessage = function(event) {
        const updates = JSON.parse(event.data);
        for (const [k, v] of Object.entries(updates)) {
            // console.log(`Emoji with id ${k} got score increase of ${v}`);
            let index = indexFromId(k);
            emojiJSONarray[index].score += v;
        }
    }
}
function getTweetBody(emoji) {
    let string = new Date().toLocaleString() + ' ';
    while(string.length < MAX_CHARS){
        string += emoji;
    }
    return string;
}
async function postTweet(){
    emojiJSONarray.sort((a, b) => b.score - a.score);
    // console.log(emojiJSONarray, checkArray(emojiJSONarray));
    let lastEmoji = emojiJSONarray[emojiJSONarray.length - 1].char;
    console.log("lastEmoji", lastEmoji);
    let tweet = getTweetBody(lastEmoji);
    client.post('statuses/update', { status: tweet }, function(err, data, response) {
        if(err) {
            throw  err;
        }else{
            console.log('tweeted: ' + tweet);
        }
    // console.log(data);
    // console.log(response);
})
}

setup();
setInterval(postTweet, tweetInterval);
 
 
//
//  tweet 'hello world!'
//