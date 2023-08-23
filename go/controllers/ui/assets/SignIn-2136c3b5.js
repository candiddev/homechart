import{V as u,A as o,m as t,dt as n,gk as m,ew as S,c5 as c,F as s,c as e,hT as h,hU as I,e as i,j as w,hV as v,hW as y,k as l,hX as W,hY as A,fB as k,fC as G,hZ as g,h_ as C,aY as d,gn as H,gm as P,eW as p,h$ as _,i0 as $,i1 as L,i2 as O,i3 as T,i4 as E,i5 as V,i6 as F,C as f,ah as b,b as q}from"./index-09c2e996.js";import{O as x}from"./Or-b4de5444.js";import{O as M}from"./OIDCButtons-0f7ed6f9.js";function R(a){return document.getElementById(`form${a===""?"":`-${a}`}`).checkValidity()}function j(){const a={demo:!1,formPasswordVisibility:!1,hostname:"",initSelfHosted:!1,loaded:!1,referral:!1,selfHostedServer:!1,timer:0};return{oninit:async()=>{document.title="Homechart - Sign In",a.hostname=await u.getHostname(),o.isSessionAuthenticated()&&t.route.set("/home",{},{replace:!0}),await n.read(),await m.readProviders(),!n.data().cloud&&a.hostname===""&&(a.initSelfHosted=!0),a.demo=n.data().demo===!0,a.loaded=!0,t.redraw()},view:()=>a.loaded?t(q,{center:!0,loaded:a.loaded,onsubmit:async()=>{if(e.data().tosAccepted=!0,R("")){if(t.route.get().includes("/signin"))return e.createSession(e.data(),a.hostname).then(async r=>{if(f(r)){if(r.message==="Incorrect passcode"){e.data().totpEnabled=!0;return}return o.setLayoutAppAlert(r),r}return b.signIn()});if(t.route.get().includes("/signup"))return e.createAccount({...e.data(),subscriptionReferrerCode:localStorage.getItem("referral")===null?"":localStorage.getItem("referral")},a.hostname).then(async r=>f(r)?r:b.signIn().then(()=>{}))}}},[a.initSelfHosted?[]:t("i.SignIn__selfhosted#self-hosted",{class:a.selfHostedServer?"SignIn__selfhosted--enabled":void 0,onclick:()=>{a.selfHostedServer=!a.selfHostedServer}},"settings"),t(S),a.selfHostedServer||c().hostname!==""&&c().hostname!=="https://web.homechart.app"?t(s,{input:{oninput:async r=>{clearTimeout(a.timer),a.hostname=r,a.timer=window.setTimeout(async()=>{r===a.hostname&&(u.setHostname(r),await n.read(!0),await m.readProviders(!0),t.redraw())},500)},type:"url",value:a.hostname},name:e.translate(h),tooltip:e.translate(I)}):[],t(s,{input:{autocomplete:"username",oninput:r=>{e.data().emailAddress=r},required:!0,type:"text",value:e.data().emailAddress},name:e.translate(i),tooltip:""}),t(s,{input:{autocomplete:"current-password",oninput:r=>{e.data().password=r},required:!0,type:a.formPasswordVisibility?"text":"password",value:e.data().password},name:e.translate(w),tooltip:""}),t.route.get().includes("/signin")?t("div.SignIn__forgot.GlobalLink",{id:"forgot-password",onclick:async()=>e.createReset(e.data()).catch(r=>{o.setLayoutAppAlert({message:r.message==="Item not found"?e.translate(v):r.message})})},t("span",e.translate(y))):[],t(l,{name:e.translate(W),onclick:()=>{a.formPasswordVisibility=!a.formPasswordVisibility},value:a.formPasswordVisibility}),t(l,{name:e.translate(A),onclick:()=>{e.data().rememberMe=!e.data().rememberMe},value:e.data().rememberMe===void 0?!1:e.data().rememberMe}),e.data().totpEnabled!==void 0&&e.data().totpEnabled?t(s,{input:{autocomplete:"one-time-code",inputmode:"numeric",oninput:r=>{e.data().totpCode=r},required:!0,type:"text",value:e.data().totpCode},name:e.translate(k),tooltip:e.translate(G)}):[],t.route.get().includes("/signup")?t(l,{name:`${e.translate(g)}?`,onclick:()=>{a.referral=!a.referral},value:a.referral}):[],a.referral?t(s,{input:{oninput:r=>{localStorage.setItem("referral",r)},type:"text",value:localStorage.getItem("referral")===null?"":localStorage.getItem("referral")},name:e.translate(g),tooltip:e.translate(C)}):[],t("div.SignIn__buttons",[t(d,{name:t.route.get().includes("/signin")?`${e.translate(H)} ${e.translate(i)}`:`${e.translate(P)} ${e.translate(i)}`,permitted:n.data().version!=="",requireOnline:!0,submit:!0}),n.data().version===""?[]:t(x),t(M,{disabled:!1,or:!0}),t(d,{href:t.route.get().includes("/signin")?"/signup":"/signin",name:t.route.get().includes("/signin")?e.translate(p):e.translate(_),options:{state:{key:Date.now()}},permitted:n.data().version!=="",requireOnline:!0,secondary:!0}),t(d,{accent:!0,href:"/demo",name:e.translate($),permitted:a.demo,requireOnline:!0})]),t.route.get().includes("/signup")?t("p.SignIn__terms",{id:"terms"},[t("span",`${e.translate(L)} ${e.translate(p)}, ${e.translate(O)} `),t("a.GlobalLink",{href:"/about/terms",target:"_blank"},e.translate(T)),t("span",` ${e.translate(E)} `),t("a.GlobalLink",{href:"/about/privacy",target:"_blank"},e.translate(V))]):[],t(F)]):[]}}export{j as SignIn};
