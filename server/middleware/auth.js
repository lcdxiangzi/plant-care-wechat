const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '访问令牌缺失'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'plant-care-secret');
    req.user = decoded;
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '访问令牌已过期'
      });
    }
    
    return res.status(401).json({
      code: 401,
      message: '无效的访问令牌'
    });
  }
};

module.exports = auth;