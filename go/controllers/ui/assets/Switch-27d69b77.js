import{A as o,c as t,m as a,F as s,D as r,o as i,ah as u,b as m}from"./index-09c2e996.js";import{G as c}from"./GetHelp-610c77dd.js";function h(){return{oninit:async()=>{o.setLayoutApp({...c(),breadcrumbs:[{name:"Switch Account"}],toolbarActionButtons:[]})},onremove:async()=>t.load().then(()=>{a.redraw()}),view:()=>a(m,{title:{}},[a(s,{name:"Select Child",select:{oninput:async e=>{const n=r.findMember(e);return i.data().authAccountID=n.id,u.switch()},options:r.findMemberNames(null,!0).filter(e=>e!==t.data().name),required:!0,value:t.data().name===""?t.data().emailAddress:t.data().name},tooltip:""})])}}export{h as Switch};
