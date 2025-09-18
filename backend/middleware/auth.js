const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Decode the token to get the userId
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // --- THIS IS THE FIX ---
    // Fetch the full user object from the database using the ID from the token.
    // .select('-password') ensures the hashed password is not included.
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User associated with this token not found.' });
    }

    // Attach the complete user object to the request.
    // Now req.user.name and req.user.email will be available everywhere.
    req.user = user; 
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is invalid or expired.' });
  }
};

module.exports = auth;
