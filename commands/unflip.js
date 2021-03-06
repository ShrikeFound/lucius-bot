const {shuffle} = require('../dealer.js')
module.exports = {
  name: 'unflip',
  description: "Places a number of cards from the discard pile back unto the deck. Useful for when we flip a card too many but don't want to waste a Joker. Omitting a number will unflip one (1) card by default.",
  async execute(bot, message, args) {

    if (!message.channel.guild) {
      message.reply("Please try this command in a text channel.")
      return
    }

    console.log("flipping..");
    let numFlips = args.join(" ").match(/\d+/)
    if (!numFlips || !(args.join(" ").match(/\d+/)[0] > 0)) {
      numFlips = 1;
    } else {
      numFlips = numFlips[0]
    }
    const flippedCards = []
    console.log(numFlips)
    const admin = require('firebase-admin');
    const guildID = message.channel.guild.id
    const channelString = `channels/${guildID}`
    let db = admin.database();
    let channelRef = db.ref(channelString);


    channelRef.once('value', (data) => {
      if (data.val().fate_deck) {
        deckRef = db.ref(channelString + "/fate_deck")
        
        for (let i = 0; i < numFlips; i++) {
          deckRef.once('value', (snapshot) => {
            let fateDeck = snapshot.val();
            fateDeck.hand = snapshot.val().hand || []
            fateDeck.discard = snapshot.val().discard || []
            fateDeck.cards = snapshot.val().cards || []
            if (fateDeck.discard.length <= 0) return;
            flippedCard = fateDeck.discard.shift();
            flippedCards.push(flippedCard);
            fateDeck.hand.unshift(flippedCard)
            deckRef.update(fateDeck)
          });
          
        }

        deckRef.once('value', (snapshot) => {
          let cards = snapshot.val().cards || [];
          const hand = snapshot.val().hand;
          cards = hand.concat(cards)
          deckRef.update({ "hand": [] })
          deckRef.update({ "cards": cards })
        })

      } else {
        //whoops. error code of some sort.
        console.log("couldn't find a deck to unflip...");
      }
    }).then((results) => {
      console.log(flippedCards);
      const replyContent = flippedCards.map((card) => {
        if (card.value == 0 || card.value == 14) {
          return `**${card.suit}** (${card.value})`
        } else {
          return `${card.value} of ${card.suit}`
        }
      })
      message.reply(`You unflipped:${replyContent}`);
    });

  }
}
