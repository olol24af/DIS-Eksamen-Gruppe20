const { v2: cloudinary } = require('cloudinary');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'XXXX';
const apiKey = process.env.CLOUDINARY_API_KEY || 'XXXX';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'XXXX';
const heroPublicId = process.env.CLOUDINARY_HERO_PUBLIC_ID || 'XXXX';

const isPlaceholder = (value) => !value || value === 'XXXX';
const isConfigured = ![cloudName, apiKey, apiSecret].some(isPlaceholder);

if (isConfigured) {
	cloudinary.config({
		cloud_name: cloudName,
		api_key: apiKey,
		api_secret: apiSecret,
		secure: true,
	});
}

const getHeroImageUrl = () => {
	if (!isConfigured || isPlaceholder(heroPublicId)) {
		return '';
	}

	return cloudinary.url(heroPublicId, {
		fetch_format: 'auto',
		quality: 'auto',
		flags: 'progressive',
	});
};

module.exports = {
	getHeroImageUrl,
};
