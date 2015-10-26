'use strict';

const Client = require( './Client' );
const notifier = require('node-notifier');
const path = require('path');
const websocket = require('./websocket');
const Log = require('./utils/Log');
const Loader = require('./Loader');
let runtime = require('./utils/Runtime');

class ChatBot {
	static start() {
		// Load core commands
		Loader.loadCoreCommands( ( coreCommands ) => {
			// coreCommands is returned as an object with
			// each message type as an array
			runtime.coreCommands = coreCommands;

			// Load plugin commands
			Loader.loadPluginCommands( ( pluginCommands ) => {
				runtime.pluginCommands = pluginCommands;

				// Load the client (connects to server)
				let chat = new Client( runtime.credentials );

				// Run any start up commands
				ChatBot.runStartupCommands( chat );

				// Start the websocket server
				websocket.start( chat );

				// Start listening for stanzas
				ChatBot.listenForStanzas( chat );
			} );
		} );
	}

	/**
	 * Run any of the 'startup' type commands
	 * for both core and plugin commands.
	 * @return {void}
	 */
	static runStartupCommands( chat ) {
		// Loop through each startup core commands, and run the action
		runtime.coreCommands.startup.forEach( function( command ) {
			command.action( chat );
		});

		// Loop through each startup plugin commands, and run the action
		runtime.pluginCommands.startup.forEach( function( command ) {
			command.action( chat );
		});
	}

	/**
	 * Listen for incoming stanzas and run
	 * matching commands.
	 * @param  {Client} chat
	 * @return {void}
	 */
	static listenForStanzas( chat ) {
		// Listen for incoming stanzas
		chat.listen( function( stanza ) {
			// Skip the initial messages when starting the bot
			if ( ChatBot.isStartingUp() ) {
				return;
			}

			// Grab the incoming stanza, and parse it
			let parsedStanza = Client.parseStanza( stanza, runtime.credentials );
			if ( !parsedStanza ) {
				return;
			}

			parsedStanza.ranCommand = null;

			// Run the incoming stanza against
			// the core commands for the stanza's type.
			let coreCommandsForStanzaType = runtime.coreCommands[ parsedStanza.type ];

      coreCommandsForStanzaType.forEach( ( command ) => {
        ChatBot.runCommand( command, parsedStanza, chat );
      } );

			// Run the incoming stanza against
			// the plugin commands for the stanza's type.
			let pluginCommandsForStanzaType = runtime.pluginCommands[ parsedStanza.type ];
			if ( pluginCommandsForStanzaType ) {
				pluginCommandsForStanzaType.forEach( ( command ) => {
					ChatBot.runCommand( command, parsedStanza, chat);
				} );
			}

      console.log(parsedStanza.ranCommand);
			// If the user ran a command, update the command log
			if ( parsedStanza.ranCommand ) {
				Client.updateLatestCommandLog( parsedStanza );
			}
      else {
        // Send a terminal notification on new message
        if(!parsedStanza.user.isBot()) {
          notifier.notify({
            title: parsedStanza.user.username,
            message: parsedStanza.message,
            icon: path.join(__dirname, 'assets/Such_doge_Large.png'), // absolute path (not balloons) 
          }, function (err, response) {
            // response is response from notification 
          });
        }
      }

			Log.log( JSON.stringify( parsedStanza, null, 4 ) );
		} );
	}

	/**
	 * Runs a passed-in command, if the regex matches
	 * and the rateLimiting criteria matches.
	 * @param  {obj} command
	 * @param  {obj} parsedStanza
	 * @param  {Client} chat
	 * @param  {boolean} ranCommand
	 * @return {void}
	 */
	static runCommand( command, parsedStanza, chat, ranCommand ) {
		try {
			var regexMatched = command.regex && command.regex.test( parsedStanza.message );
			var ignoreRateLimiting = command.ignoreRateLimiting;
			var passesRateLimiting = !parsedStanza.rateLimited || ( parsedStanza.rateLimited && ignoreRateLimiting );

			if ( regexMatched && passesRateLimiting && !ignoreRateLimiting ) {
				parsedStanza.ranCommand = true;
				command.action( chat, parsedStanza );
			}
		} catch ( e ) {
			console.trace( 'ERROR', e );
		}
	}

	/**
	 * Returns a boolean based on the startup state of the bot.
	 * @return {Boolean}
	 */
	static isStartingUp() {
		const messageTime = new Date().getTime();
		if ( messageTime - runtime.startUpTime < 5000 ) { // 5 seconds
			Log.log('Starting up, skipping message');
			return true;
		}

		return false;
	}
}

module.exports = ChatBot;
