const escapeHtml = (input = '') => {
	return String(input).replace(/[&<>"']/g, (char) => {
		switch (char) {
			case '&':
				return '&amp;';
			case '<':
				return '&lt;';
			case '>':
				return '&gt;';
			case '"':
				return '&quot;';
			case '\'':
				return '&#39;';
			default:
				return char;
		}
	});
};

exports.renderErrorPage = ({ title, message, status, stack }) => {
	const safeTitle = escapeHtml(title);
	const safeMessage = escapeHtml(message);
	const safeStatus = typeof status === 'number' ? status : '';
	const safeStack = stack ? escapeHtml(stack) : '';

	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <link rel="stylesheet" href="/stylesheets/style.css" />
  </head>
  <body>
    <header>
      <h1>${safeTitle}</h1>
      <p>We couldn't complete that request.</p>
    </header>
    <main>
      <section>
        <h2>${safeMessage}</h2>
        ${safeStatus ? `<p>Status: ${safeStatus}</p>` : ''}
        ${safeStack ? `<pre>${safeStack}</pre>` : ''}
        <a href="/">Return to booking page</a>
      </section>
    </main>
  </body>
</html>`;
};
