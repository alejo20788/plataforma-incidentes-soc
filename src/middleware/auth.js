const jwt = require('jsonwebtoken');
const verificarToken = (req,res,next) => {
 const match = /^Bearer (\S+)$/i.exec(req.get('authorization') || '');
 if (!match) return res.status(401).json({data:null,error:'Acceso no autorizado: Falta el token JWT.'});
 try { req.usuario = jwt.verify(match[1],process.env.JWT_SECRET,{algorithms:['HS256']}); next(); }
 catch { return res.status(403).json({data:null,error:'Token inválido o expirado.'}); }
};
const verificarRol = roles => (req,res,next) => !req.usuario || !roles.includes(req.usuario.rol) ? res.status(403).json({data:null,error:'Permisos insuficientes para ejecutar esta acción.'}) : next();
module.exports={verificarToken,verificarRol};
