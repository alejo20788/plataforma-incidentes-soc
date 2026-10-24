export const Modelo = {
 incidentes:[],token:null,rol:null,
 async request(path,options={}) {
  const headers={...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),...(this.token?{Authorization:`Bearer ${this.token}`}:{})};
  const res=await fetch(path,{...options,headers:{...headers,...options.headers}});
  const json=await res.json();
  if(!res.ok||json.error)throw new Error(json.error||`Error HTTP ${res.status}`);
  return json.data;
 },
 async login(usuario,password){const data=await this.request('/api/login',{method:'POST',body:JSON.stringify({usuario,password})});this.token=data.token;this.rol=data.rol;return data;},
 logout(){this.token=null;this.rol=null;this.incidentes=[];},
 async cargarIncidentesIniciales(){this.incidentes=await this.request('/api/incidentes');return this.incidentes;},
 obtenerIncidentes(){return [...this.incidentes];},
 async guardarIncidente(nuevo){const data=await this.request('/api/incidentes',{method:'POST',body:this.formData(nuevo)});this.incidentes.unshift(data);return data;},
 async actualizarIncidente(id,datos){const data=await this.request(`/api/incidentes/${encodeURIComponent(id)}`,{method:'PUT',body:this.formData(datos)});this.incidentes=this.incidentes.map(i=>i.id===id?data:i);return data;},
 formData(datos){const form=new FormData();for(const key of ['tipo','fecha','prioridad','descripcion','estado'])form.append(key,datos[key]);if(datos.evidencia)form.append('evidencia',datos.evidencia);return form;},
 async descargarEvidencia(id,nombre){const response=await fetch(`/api/incidentes/${encodeURIComponent(id)}/evidencia`,{headers:{Authorization:`Bearer ${this.token}`}});if(!response.ok)throw new Error('No se pudo descargar la evidencia.');const blob=await response.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=nombre||'evidencia';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},
 async eliminarIncidente(id){await this.request(`/api/incidentes/${encodeURIComponent(id)}`,{method:'DELETE'});this.incidentes=this.incidentes.filter(i=>i.id!==id);}
};
