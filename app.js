// Simple Express server (added to provide a local HTTP endpoint)
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Example in-repo value endpoint
app.get('/', (req, res) => {
	res.send('Hello from DIS-Eksamen-Gruppe20');
});

app.get('/api/value', (req, res) => {
	// preserve original example value
	const a = 2;
	res.json({ a });
});

app.listen(port, () => {
	console.log(`Server listening on http://localhost:${port}`);
});

console.log("hej Team :D");

console.log("celine er lidt klog")

console.log("oliver er knap så klog")

console.log("OST")

console.log("oli er langsom") 