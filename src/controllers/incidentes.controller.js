const {PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const sendError=(res,status,error)=>res.status(status).json({data:null,error});
const { validarIncidente } = require('../services/incidentes.service');
const { directory, borrarTemporal } = require('../middleware/evidencias');
const path = require('node:path');
const fs = require('node:fs');
const login=async(req,res,next)=>{
 try {
  const {usuario,password}=req.body||{};
  if(typeof usuario!=='string'||typeof password!=='string') return sendError(res,400,'Usuario y contraseña son obligatorios.');
  const users={admin:{id:2,rol:'ADMINISTRADOR',hash:process.env.ADMIN_PASSWORD_HASH},analista:{id:1,rol:'ANALISTA',hash:process.env.ANALISTA_PASSWORD_HASH}};
  const record=users[usuario.trim()];
  // Comparación constante incluso si el usuario no existe.
  const fallback='$2b$12$6trfXcxd9Aj9J9G4W0GpiOHXCDV6gW4B1xJXGZwxSQEMULm1RiJva';
  const correct=await bcrypt.compare(password,(record&&record.hash)||fallback);
  if(!record||!correct) return sendError(res,401,'Credenciales inválidas.');
  const token=jwt.sign({id:record.id,rol:record.rol},process.env.JWT_SECRET,{expiresIn:'1h',algorithm:'HS256'});
  res.json({data:{token,rol:record.rol},error:null});
 } catch(e){next(e);}
};
const listar=async(req,res,next)=>{try{res.json({data:await prisma.incidente.findMany({orderBy:{createdAt:'desc'}}),error:null});}catch(e){next(e);}};
const metadata = file => file ? {evidenciaNombre: path.basename(file.originalname).slice(0,180), evidenciaArchivo: file.filename} : {};
const crear=async(req,res,next)=>{
 try {
  const v=validarIncidente(req.body);
  if(v.error){borrarTemporal(req.file);return sendError(res,400,v.error);}
  const item=await prisma.incidente.create({data:{...v.data,...metadata(req.file)}});
  res.status(201).json({data:item,error:null});
 }catch(e){borrarTemporal(req.file);next(e);}
};
const actualizar=async(req,res,next)=>{
 try {
  const v=validarIncidente(req.body);
  if(v.error){borrarTemporal(req.file);return sendError(res,400,v.error);}
  const existing=await prisma.incidente.findUnique({where:{id:req.params.id}});
  if(!existing){borrarTemporal(req.file);return sendError(res,404,'Incidente no encontrado.');}
  const item=await prisma.incidente.update({where:{id:req.params.id},data:{...v.data,...metadata(req.file)}});
  if(req.file && existing.evidenciaArchivo) borrarTemporal({path:path.join(directory,existing.evidenciaArchivo)});
  res.json({data:item,error:null});
 }catch(e){borrarTemporal(req.file);next(e);}
};
const eliminar=async(req,res,next)=>{
 try {
  const existing=await prisma.incidente.findUnique({where:{id:req.params.id}});
  if(!existing)return sendError(res,404,'Incidente no encontrado.');
  await prisma.incidente.delete({where:{id:req.params.id}});
  if(existing.evidenciaArchivo) borrarTemporal({path:path.join(directory,existing.evidenciaArchivo)});
  res.json({data:{message:'Incidente eliminado con éxito.'},error:null});
 }catch(e){next(e);}
};
const descargarEvidencia=async(req,res,next)=>{
 try {
  const item=await prisma.incidente.findUnique({where:{id:req.params.id}});
  if(!item?.evidenciaArchivo)return sendError(res,404,'Evidencia no encontrada.');
  const file=path.join(directory,path.basename(item.evidenciaArchivo));
  if(!fs.existsSync(file))return sendError(res,404,'Archivo no disponible.');
  res.set('X-Content-Type-Options','nosniff');
  res.download(file,item.evidenciaNombre || 'evidencia',err=>{if(err && !res.headersSent)next(err);});
 }catch(e){next(e);}
};
module.exports={login,listar,crear,actualizar,eliminar,descargarEvidencia};
