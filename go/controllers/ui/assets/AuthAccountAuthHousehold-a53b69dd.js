import{V as n,o as i,c as a,fT as o,A as s,gs as d,gt as c,C as l,D as u,gu as h,gv as A,gw as p,gx as m,bO as v,cK as g,gy as y}from"./index-09c2e996.js";const f={delete:async(t,e)=>n.delete(`/api/v1/auth/households/${t}/members/${e}`).then(async()=>{await i.validate(),e===a.data().id&&o.clearRefreshed(),s.setLayoutAppAlert({message:e===a.data().id?a.translate(d):a.translate(c)})}).catch(r=>{s.setLayoutAppAlert({message:r.message})}),inviteAccept:async t=>n.read(`/api/v1/auth/households/${a.data().id}/invites/${t}`,{}).then(async e=>l(e)?e:(o.clearRefreshed(),await a.read(),await i.validate(),u.read(a.data().primaryAuthHouseholdID,void 0,!0))).then(e=>l(e)?e:e!==void 0?(u.set(e),s.setLayoutAppAlert({message:a.translate(h)}),e):u.new()),inviteCreate:async t=>n.create(`/api/v1/auth/households/${t.authHouseholdID}/invites`,t).then(e=>{if(l(e))return e;t.child?s.setLayoutAppAlert({message:a.translate(A)}):s.setLayoutAppAlert({message:a.translate(p)})}),inviteDelete:async(t,e)=>n.delete(`/api/v1/auth/households/${t}/invites/${e}`).then(async()=>{s.setLayoutAppAlert({message:a.translate(m)})}).catch(r=>{s.setLayoutAppAlert({message:r.message})}),is:t=>t!==null,new:()=>({authAccountID:null,authHouseholdID:null,child:!1,color:v.Default,created:null,emailAddress:"",id:null,inviteToken:"",name:"",permissions:g.new(),updated:null}),update:async t=>n.update(`/api/v1/auth/households/${t.authHouseholdID}/members/${t.id}`,t).then(()=>{s.setLayoutAppAlert({message:a.translate(y)})})};export{f as A};
