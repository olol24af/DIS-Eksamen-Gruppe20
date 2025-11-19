const path = require('path');

exports.index = (req, res) => {
  // Demonstrate cookie usage: set or increment a simple 'visited' cookie
  try {
    const visits = req.cookies && req.cookies.visited ? Number(req.cookies.visited) : 0;
    res.cookie('visited', String(visits + 1), { httpOnly: true, sameSite: 'lax' });
  } catch (err) {
    // If cookie parsing fails for some reason, continue without blocking
  }

  res.sendFile(path.join(__dirname, '../views/index.html'));
};
