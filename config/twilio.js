const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC9e176e8e83124f1675e0314d31cbccb9';
const authToken = process.env.TWILIO_AUTH_TOKEN || '804ee8717a4da23f55baa2997ff9c91a';
const fromNumber = process.env.TWILIO_FROM_NUMBER || '+19789513852';

const isPlaceholder = (value) => value === 'XXXX' || value === '' || typeof value === 'undefined';
const isTwilioConfigured = ![accountSid, authToken, fromNumber].some(isPlaceholder);

let client = null;
if (isTwilioConfigured) {
	client = twilio(accountSid, authToken, { lazyLoading: true });
}

const sendTextMessage = async ({ to, body }) => {
	if (!isTwilioConfigured) {
		throw new Error('Twilio credentials are not configured.');
	}

	if (!to) {
		throw new Error('A recipient phone number is required to send a text message.');
	}

	return client.messages.create({
		to,
		from: fromNumber,
		body,
	});
};

module.exports = {
	sendTextMessage,
	isTwilioConfigured,
	fromNumber,
};
