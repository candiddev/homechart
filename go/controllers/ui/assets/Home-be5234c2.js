import{az as C,S as b,A as d,a0 as y,aB as m,bD as i,bB as l,bC as u,bF as L,m as t,b as k,c as n,dO as P,by as _,I as w,dP as B,a9 as v,bQ as J,aa as T,cH as R,a as W,dQ as H,Z as $,aP as j,ba as E,dR as I,D as M,dS as D}from"./index-09c2e996.js";import{C as A}from"./CalendarDayEvent-2f2e8467.js";import{G as F}from"./GetHelp-610c77dd.js";function Z(){function N(){return{view:a=>{const r=M.findMember(a.attrs.authAccountID);return t("div.Home__change",[t("p",[t("span",`${r.name===""?r.emailAddress:r.name} `),t(D,{value:` ${a.attrs.change}: `})]),t(D,{value:a.attrs.names.join(", ")})])}}}const e=C.now(),O=b({updated:"",change:""});let s;return{oncreate:()=>{d.getSessionDisplay()===y.XLarge&&d.toggleLayoutAppMenuOpen(!0)},oninit:()=>{s=b.lift((a,r,G,Q,x)=>{const o=[],c=m.findDateRange(e,e)();c[e.toJSON()]!==void 0&&o.push(...c[e.toJSON()]);const p=i.findDateRange(e,e)();p[e.toJSON()]!==void 0&&o.push(...p[e.toJSON()]);const g=l.findDateRange(e,e)();g[e.toJSON()]!==void 0&&o.push(...g[e.toJSON()]);const S=u.findDateRange(e,e)();return S[e.toJSON()]!==void 0&&o.push(...S[e.toJSON()]),o.sort((f,h)=>f.timestampStart===h.timestampStart?0:f.timestampStart>h.timestampStart?1:-1)},m.data,i.data,l.data,L.data,u.data),d.setLayoutApp({...F(),breadcrumbs:[],toolbarActionButtons:[]})},onremove:()=>{s.end(!0)},view:()=>t("div.Home#home",[t("div.Home__contents",[t(k,{title:{name:n.translate(P)},wrap:!0},m.isLoaded()&&i.isLoaded()&&l.isLoaded()&&u.isLoaded()?s().length>0?s().map(a=>t(A,{date:e,event:a,loaded:!0})):[t("div.Home__nothing",[t(_,{classes:"Home__icon",icon:w.NotFound}),t("p.Home__agenda",n.translate(B))])]:[...Array(5)].map(()=>t(A,{date:e,event:i.new(),loaded:!1}))),t("div.Home__right",[v.data().length>0?t("div.Home__bookmarks",[t(J,{name:n.translate(T)}),t("div.Home__bookmarks-buttons",v.data().map(a=>a.home?t(a.link.startsWith("/")?t.route.Link:"a",{class:"Button Home__bookmarks-button",href:a.link,id:`bookmark${R(a.name)}`,target:a.link.startsWith("/")?void 0:"_blank"},[a.iconLink===""?t(_,{icon:a.iconName}):t("img",{src:a.iconLink}),t("span",a.name)]):null))]):[],t(W,{actions:[],data:H.table(),filters:[],getKey:a=>`${a.id}`,id:"changes",loaded:H.isLoaded(),noFilters:!0,noNewButton:!0,staticColumns:!0,tableColumns:[{formatter:a=>$.fromString(`${a.updated}`).toPrettyString(n.data().preferences.formatDateOrder,n.data().preferences.formatDateSeparator,n.data().preferences.formatTime24),name:n.translate(j),property:"updated"},{name:n.translate(E),property:"change",render:N}],tableColumnsNameEnabled:O,title:{name:n.translate(I)}})])])])}}export{Z as Home};
