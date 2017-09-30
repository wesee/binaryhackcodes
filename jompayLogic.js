'use strict';


// --------------- Helpers to build responses which match the structure of the necessary dialog actions -----------------------

function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message, responseCard) {
	return {
		sessionAttributes,
		dialogAction: {
			type: 'ElicitSlot',
			intentName,
			slots,
			slotToElicit,
			message,
			responseCard,
		},
	};
}

function confirmIntent(sessionAttributes, intentName, slots, message, responseCard) {
	return {
		sessionAttributes,
		dialogAction: {
			type: 'ConfirmIntent',
			intentName,
			slots,
			message,
			responseCard,
		},
	};
}

function close(sessionAttributes, fulfillmentState, message, responseCard) {
	return {
		sessionAttributes,
		dialogAction: {
			type: 'Close',
			fulfillmentState,
			message,
			responseCard,
		},
	};
}

function delegate(sessionAttributes, slots) {
	return {
		sessionAttributes,
		dialogAction: {
			type: 'Delegate',
			slots,
		},
	};
}



// ---------------- Helper Functions --------------------------------------------------

// build a message for Lex responses
function buildMessage(messageContent) {
	return {
		contentType: 'PlainText',
		content: messageContent
	};
}

function isValidBiller(name) {
    var billers = ['celcom', 'maxis', 'tmnet', 'tnb', 'tenaga', 'airasia', 'syabas'];
    return billers.indexOf(name.toLowerCase()) !== -1   ;
}

// --------------- Functions that control the skill's behavior -----------------------

/**
 * Performs dialog management and fulfillment for processing payment request.
 */
 
 function payBill(intentRequest, callback) {
 	const outputSessionAttributes = intentRequest.sessionAttributes;
	const source = intentRequest.invocationSource;
	
	if (source === 'DialogCodeHook') {
		// perform validation on the slot values we have
		const slots = intentRequest.currentIntent.slots;		
		
		const name = (slots.name ? slots.name : null);
		const amount = (slots.amount ? slots.amount : null);
		const date = (slots.date ? slots.date : null);
		
		if (name ===  null && amount === null && date === null) {

			callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name,
				slots, 'name', buildMessage("Welcome to My JomPAY Chat Bot.  What is the biller's name?")));
		}
		
		// check valid biller
		if (name) {
		    if (! isValidBiller(name)) {
		        
    			callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name,
    				slots, 'name', buildMessage(name + " is not a valid biller.  What is the biller's name?")));
		    }
		}
		
		// check payment date
        if (date) {
            var now = new Date();

            console.log(">>> date <<< " + date);
            console.log(">>> now <<< " + now);
            
            now.setHours(0, 0, 0, 0);
            
            if (Date.parse(date) < now) {
                
    			callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name,
    				slots, 'date', buildMessage("Your payment date " + date + " is in the past.  When (yyyy-mm-dd) do you want to pay?")));
            }
        }
        
		// if we've come this far, then we simply defer to Lex
		callback(delegate(outputSessionAttributes, slots));
		return;
		
	}
	
	callback(close(outputSessionAttributes, 'Fulfilled', {
		contentType: 'PlainText',
		content: 'Great!  Your payment request has been processed.  Thanks for using My JomPAY Bot!'
	}));	
 }
 

// --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {

	console.log('dispatch userId=${intentRequest.userId}, intent=${intentRequest.currentIntent.name}');

	const name = intentRequest.currentIntent.name;

	// dispatch to the intent handlers
	if (name === 'jompayPayBill') {
		return payBill(intentRequest, callback);
	}
	throw new Error('Intent with name ${name} not supported');
}

// --------------- Main handler -----------------------

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {

	console.log(JSON.stringify(event));

	try {
		console.log('event.bot.name=${event.bot.name}');

		// fail if this function is for a different bot
		if (event.bot.name !== 'JomPAYBot') {
		     callback('Invalid Bot Name');
		}
		dispatch(event, (response) => callback(null, response));
	} catch (err) {
		callback(err);
	}
};
