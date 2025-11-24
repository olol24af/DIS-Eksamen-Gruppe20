const { sendTextMessage, isTwilioConfigured } = require('../config/twilio');

const availabilityMessage = ({ fullName }) =>
	`Hi ${fullName || 'there'}! A space just opened up for the DIS-Eksamen-Gruppe20 retreat. Reply to confirm your reservation.`;

const sendAvailabilityNotification = async ({ fullName, phone }) => {
	if (!phone) {
		throw new Error('Cannot send availability notification without a phone number.');
	}

	const body = availabilityMessage({ fullName });
	return sendTextMessage({ to: phone, body });
};

module.exports = {
	sendAvailabilityNotification,
	isTwilioConfigured,
};
