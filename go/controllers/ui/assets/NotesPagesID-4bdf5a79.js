import{S as u,eh as s,ei as r,m as t,c as o,d7 as y,i as h,A as D,I as i,ej as I,ah as d,ai as g,F as c,af as A,cf as N,en as w,eo as $,cS as k,cT as H,ep as V,el as S,eq as G,a5 as L,C as W,r as F,d8 as T,b as O,bQ as q,Z as f,cH as C,dS as _,ef as x,em as B,er as j}from"./index-09c2e996.js";import{G as E}from"./GetHelp-610c77dd.js";function M(){const e={edit:u(!1),id:u(null),lift:u(),notesPage:s.new(),notesPageVersion:r.new(),parentID:u(""),version:u(null)};return{oninit:async()=>{e.lift=u.lift((p,a,n,P,b,m)=>{if(!n||e.notesPage.id===null)if(b!==""){const l=s.findID(t.route.param().parentID);e.notesPage.authAccountID=l.authAccountID,e.notesPage.authHouseholdID=l.authHouseholdID,e.notesPage.parentID=l.id}else P!==null&&(e.notesPage=s.findID(P));if(!n||e.notesPageVersion.id===null){const l=r.findNotesPageIDLatest(e.notesPage.id);m!==null?e.notesPageVersion=r.findID(m):e.notesPageVersion.updated!==l.updated&&(e.notesPageVersion=l)}const v=[{link:"/notes",name:o.translate(y)},...s.isLoaded()?[{name:e.notesPage.name===""?o.translate(h):e.notesPage.name}]:[]];e.notesPage.name===""&&(t.route.param().tag==="personal"||o.data().primaryAuthHouseholdID===null?e.notesPage.authAccountID=o.data().id:e.notesPage.authHouseholdID=o.data().primaryAuthHouseholdID),D.setLayoutApp({...E("notes"),breadcrumbs:v,toolbarActionButtons:[{icon:i.Notes,name:o.translate(I),onclick:()=>{e.edit(!1),t.route.set(`/notes/${e.notesPage.authAccountID===null?"household":"personal"}/new`,{edit:"",parentID:e.notesPage.id},{state:{key:Date.now()}})},permitted:d.permitted(g.Notes,!0,e.notesPage.authHouseholdID),requireOnline:!0}]}),t.redraw()},s.data,r.data,e.edit,e.id,e.parentID,e.version),t.route.param().version===void 0?e.version(null):e.version(t.route.param().version),t.route.param().id===void 0?e.id(null):e.id(t.route.param().id),t.route.param().parentID!==void 0&&e.parentID(t.route.param().parentID),t.route.param().tag==="personal"?e.notesPage.authAccountID=o.data().id:e.notesPage.authHouseholdID=o.data().primaryAuthHouseholdID,t.route.param().edit!==void 0&&e.edit(!0)},onremove:()=>{e.lift.end(!0)},view:()=>{const p=s.isLoaded()&&r.isLoaded();return e.edit()?t(O,{forceWide:!0,loaded:p,onsubmit:async()=>{if(t.route.param().id==="new"){let a=null;return s.create(e.notesPage).then(async n=>W(n)?n:(a=n.id,e.notesPageVersion.notesPageID=n.id,e.notesPageVersion.updated=null,r.create(e.notesPageVersion,!0))).then(()=>{t.route.set(`/notes/${e.notesPage.authHouseholdID===null?"personal":"household"}/${a}`,void 0,{state:{key:Date.now()}}),t.redraw()})}await s.update(e.notesPage),e.notesPageVersion.body!==r.findID(e.notesPageVersion.id).body&&(e.notesPageVersion.updated=null,await r.create(e.notesPageVersion)),t.route.set(`/notes/${e.notesPage.authHouseholdID===null?"personal":"household"}/${e.notesPage.id}`,void 0,{state:{key:Date.now()}})},title:{buttonLeft:{icon:i.Cancel,name:o.translate(F),onclick:async()=>{t.route.set(`/notes/${t.route.param().tag}${e.notesPage.id===null?"":`/${e.notesPage.id}`}`,{},{state:{key:Date.now()}})},permitted:d.permitted(g.Notes,!0,e.notesPage.authHouseholdID),requireOnline:!0},buttonRight:{icon:i.Save,name:o.translate(T),permitted:d.permitted(g.Notes,!0,e.notesPage.authHouseholdID),primary:!0,requireOnline:!0,submit:!0},name:e.notesPage.name===""?`${o.translate(h)} ${o.translate(I)}`:e.notesPage.name},wrap:!0},[t(c,{input:{oninput:a=>{e.notesPage.name=a},required:!0,type:"text",value:e.notesPage.name},name:o.translate(A),tooltip:o.translate(N)}),t(w,{oninput:a=>{e.notesPage.color=a},value:e.notesPage.color}),t($,{oninput:a=>{e.notesPage.icon=a},value:e.notesPage.icon}),t(c,{input:{datalist:s.tagNames(),icon:i.Tag,type:"text",value:e.notesPage.tags},name:o.translate(k),tooltip:o.translate(H)}),t(V,{name:o.translate(S),onselect:a=>{switch(a){case"personal":e.notesPage.authAccountID=o.data().id,e.notesPage.authHouseholdID=null,e.notesPage.parentID=null;break;case"household":e.notesPage.authAccountID=null,e.notesPage.authHouseholdID=o.data().primaryAuthHouseholdID,e.notesPage.parentID=null;break;default:const n=s.findID(a);if(n.id===e.notesPage.id)return;e.notesPage.authAccountID=n.authAccountID,e.notesPage.authHouseholdID=n.authHouseholdID,e.notesPage.parentID=n.id}},options:s.getColorNamesIDs(),tooltip:o.translate(G),value:e.notesPage.parentID===null?e.notesPage.authAccountID===null?"household":"personal":e.notesPage.parentID}),t(c,{name:o.translate(L),textArea:{oninput:a=>{e.notesPageVersion.body=a},required:!0,value:e.notesPageVersion.body},tooltip:"Page contents"})]):t("div.NotesPageID",[t(q,{buttonLeft:{accent:!0,icon:e.notesPage.deleted===null?i.Delete:i.DeleteForever,name:e.notesPage.deleted===null?"Delete":"Delete Forever",onclick:async()=>{if(e.notesPage.deleted===null){const a=s.findID(t.route.param().id);return a.deleted=f.now().toString(),s.update(a).then(()=>{a.authAccountID===null?t.route.set("/notes/household"):t.route.set("/notes/personal")})}return s.delete(e.notesPage.id).then(()=>{t.route.set(`/notes/${t.route.param().tag}`)})},permitted:d.permitted(g.Notes,!0,e.notesPage.authHouseholdID),requireOnline:!0},buttonRight:{icon:e.notesPage.deleted===null&&t.route.param().version===void 0?i.Edit:i.Restore,name:e.notesPage.deleted===null&&t.route.param().version===void 0?"Edit":"Restore",onclick:async()=>{if(e.notesPage.deleted!==null||t.route.param().version!==void 0)return t.route.param().version!==void 0&&await r.create(e.notesPageVersion),e.notesPage.deleted=null,s.update(e.notesPage).then(()=>{e.edit(!1),t.route.set(`/notes/${e.notesPage.authAccountID===null?"household":"personal"}/${t.route.param().id}`,{},{state:{key:Date.now()}})});t.route.set(`/notes/${e.notesPage.authAccountID===null?"household":"personal"}/${e.notesPage.id}?edit`,{},{state:{key:Date.now()}})},permitted:d.permitted(g.Notes,!0,e.notesPage.authHouseholdID),primary:t.route.param().version!==void 0||e.notesPage.deleted!==null,requireOnline:!0},loaded:p,name:e.notesPage.name===""?"New Page":e.notesPage.name}),p?[t("div.NotesPageID__body",{id:"notes-body"},[e.notesPageVersion.body.match(/#+ \w/)===null?[]:t("div.NotesPageID__toc",{id:"toc"},[t("p","On this page:"),t("div",e.notesPageVersion.body.split(`
`).reduce((a,n)=>(n.startsWith("```")?a.codeBlock=!a.codeBlock:!a.codeBlock&&n.includes("# ")&&a.components.push(t("a.GlobalLink",{href:`${t.parsePathname(t.route.get()).path}#h${C(n)}`},[`${"-".repeat(n.split("#").length-2)} `,t("span",n.split("# ")[1])])),a),{codeBlock:!1,components:[]}).components)]),t("div",t(_,{value:e.notesPageVersion.body}))]),t("div.GlobalFooter",[e.notesPage.tags.length>0?t(x,{disabled:!0,icon:i.Tag,name:"tags",type:"text",value:e.notesPage.tags,valueLinkPrefix:"/notes/"}):[],t("span.NotesPageID__modified",{id:"updated"},[`${o.translate(B)}: `,t(t.route.Link,{href:`/notes/${t.route.param().tag}/${t.route.param().id}/versions`},D.formatCivilDate(f.fromString(e.notesPageVersion.updated).toCivilDate().toJSON()))])])]:t(j)])}}}export{M as NotesPagesID};
