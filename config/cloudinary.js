const { v2: cloudinary } = require('cloudinary');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'due1wvnsp';
const apiKey = process.env.CLOUDINARY_API_KEY || '338986482619835';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '0_QNJnXpRFGHCKS6ckkc6EbhGtk';
const heroPublicId = process.env.CLOUDINARY_HERO_PUBLIC_ID || 'samples/coffee';

cloudinary.config({
	cloud_name: cloudName,
	api_key: apiKey,
	api_secret: apiSecret,
	secure: true,
});

const getHeroImageUrl = () =>
	cloudinary.url(heroPublicId, {
		fetch_format: 'auto',
		quality: 'auto',
		flags: 'progressive',
	});

module.exports = {
	getHeroImageUrl,
};
