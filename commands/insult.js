'use strict';

const Say = require('../utils/Say');

const insults = [
	'Lick my tasty anus!',
	'You\'re so ugly you look like an xmetrix!',
  'Hey retard fuck off!',
  'You have a small cock!',
  'Is a virgin!',
  'You\'re gf is ugly',
  'Are you even bout that life',
  'You can\'t even get an ugly okcupid\'s bitch to suck you',
  'You have fat tits',
  'You\'re mom is so fat that i need to roll two times to get out of her',
  'You\'re mom such a slut, she don\'t need the internet... she\'s already world wide'
];

/**
 * Commands:
 *
 * !insult {username} - Insults the specified user
 */

module.exports = [{
	name: '!insult {username}',
	help: 'Throws a random insult at the specified user.',
    types: ['message'],
    regex: /^(!|\/)insult\s\@(\w|\d)+$/,
    action: function( chat, stanza ) {
        var insultIndex = Math.round( Math.random() * (insults.length - 1) );
        var username = stanza.message.substr( stanza.message.indexOf( '@' ) + 1 );
        var insult = 'Hey @' + username + '! ' + insults[ insultIndex ];
        chat.sendMessage( insult );
        Say.say( insult )
    }
}]
