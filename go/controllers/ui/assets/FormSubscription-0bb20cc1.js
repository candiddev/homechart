import{a8 as p,D as n,dt as u,az as H,c as a,h8 as s,m as o,o as S,F as d,K as y,h9 as w,fN as i,d6 as F,H as W,ha as C,aY as h,r as P,h2 as g,ah as c,ai as f,hb as x,C as D,hc as R,hd as T,he as A,hf as $,hg as k,hh as _,hi as E,hj as L,hk as O,P as q,hl as N,hm as G,A as M,hn as J,ho as Y,hp as j,b as z}from"./index-09c2e996.js";import{P as l}from"./Payment-7ef1bf2a.js";import{T as B}from"./TitleTabsAuthHouseholds-59423851.js";function V(){const t={authHousehold:p(n.new()),expires:e=>u.data().cloud?H.fromString(n.findID(e).subscriptionExpires).toString(a.data().preferences.formatDateOrder,a.data().preferences.formatDateSeparator):s.findID(e).subscriptionExpires===null?"Unknown":H.fromString(s.findID(e).subscriptionExpires).toString(a.data().preferences.formatDateOrder,a.data().preferences.formatDateSeparator),loaded:!1,password:"",processor:e=>u.data().cloud?n.findID(e).subscriptionProcessor:s.findID(e).subscriptionProcessor,showPassword:!1};l.prices.map(e=>{if(e.monthly!==""&&!t.loaded){t.loaded=!0,o.redraw();return}});async function m(){await l.readPaddle().catch(()=>{})}let b;return{oninit:async e=>{t.loaded=l.prices().monthly!=="",b=n.data.map(async()=>{if(t.authHousehold.id===null){const r=e.attrs.authHouseholdID===null?a.data().primaryAuthHouseholdID:e.attrs.authHouseholdID;if(u.data().cloud)t.authHousehold=p(n.findID(r));else{for(const I of S.data().permissionsHouseholds)await s.read(I.authHouseholdID).catch(()=>{});t.authHousehold=p(s.findID(r))}}if(u.data().cloud||s.findID(t.authHousehold.id)!==null)return m();o.redraw()}),t.loaded=!0},onremove:()=>{b.end(!0)},view:e=>o(z,{loaded:t.loaded,title:{name:!u.data().cloud&&s.findID(e.attrs.authHouseholdID).id===null?a.translate(j):void 0,tabs:B()}},[u.data().cloud||s.findID(e.attrs.authHouseholdID).id!==null?[o(d,{input:{disabled:!0,oninput:()=>{},type:"text",value:y.subscriptionProcessors[t.processor(e.attrs.authHouseholdID)]},name:a.translate(w),tooltip:""}),o(d,{input:{disabled:!0,oninput:()=>{},type:"text",value:t.processor(e.attrs.authHouseholdID)===i.PaddleLifetime?a.translate(F):t.expires(e.attrs.authHouseholdID)},name:a.translate(W),tooltip:""}),t.processor(e.attrs.authHouseholdID)===i.None?o("p#subscription",{style:{filter:"var(--filter_light)","font-weight":"var(--font-weight_bold)","max-width":"var(--width_input)","padding-top":"10px","text-align":"center"}},a.translate(C)):[],o("div.Form__buttons",[o(h,{accent:!0,name:`${a.translate(P)} ${a.translate(g)}`,onclick:async()=>(setTimeout(async()=>{await s.readJWT(e.attrs.authHouseholdID)},1e3),l.cancel(e.attrs.authHouseholdID)),permitted:c.permitted(f.Auth,!0,e.attrs.authHouseholdID)&&t.processor(e.attrs.authHouseholdID)!==i.None&&t.processor(e.attrs.authHouseholdID)!==i.PaddleLifetime,requireOnline:!0}),o(h,{icon:"add",iconTop:!0,name:`${a.translate(x)}
${l.prices().monthly}`,onclick:async()=>t.processor(e.attrs.authHouseholdID)===i.PaddleYearly?l.update(e.attrs.authHouseholdID,i.PaddleMonthly):l.createPaddle(e.attrs.authHouseholdID,i.PaddleMonthly).then(r=>{if(D(r))return r;window.location.href=r.url}).catch(()=>{}),permitted:c.permitted(f.Auth,!0,e.attrs.authHouseholdID)&&l.prices().monthly!==""&&t.processor(e.attrs.authHouseholdID)===i.None,primary:!0,requireOnline:!0,target:"_blank"}),o(h,{icon:"all_inclusive",iconTop:!0,name:`${a.translate(R)}
${l.prices().lifetime}`,onclick:async()=>l.createPaddle(e.attrs.authHouseholdID,i.PaddleLifetime).then(r=>{if(D(r))return r;window.location.href=r.url}),permitted:c.permitted(f.Auth,!0,e.attrs.authHouseholdID)&&l.prices().lifetime!==""&&t.processor(e.attrs.authHouseholdID)!==i.PaddleLifetime,primary:!0,requireOnline:!0,target:"_blank"})]),o(d,{input:{oninput:r=>{t.authHousehold.subscriptionReferrerCode=r,setTimeout(async()=>{if(t.authHousehold.subscriptionReferrerCode===r)return u.data().cloud?n.update(t.authHousehold):s.update(t.authHousehold)},500)},type:"text",value:t.authHousehold.subscriptionReferrerCode},name:a.translate(T),tooltip:a.translate(A)}),[o(d,{input:{oninput:r=>{localStorage.removeItem("token"),t.authHousehold.subscriptionReferralCode=r,setTimeout(async()=>{if(t.authHousehold.subscriptionReferralCode===r)return u.data().cloud?n.update(t.authHousehold):s.update(t.authHousehold)},500)},type:"text",value:t.authHousehold.subscriptionReferralCode},name:a.translate($),tooltip:a.translate(k)}),o("p#referral",{style:{filter:"var(--filter_light)","font-weight":"var(--font-weight_bold)","max-width":"var(--width_input)","padding-top":"5px","text-align":"center"}},`${t.authHousehold.subscriptionReferralCount===0?"":`${a.translate(_)} ${t.authHousehold.subscriptionReferralCount} ${a.translate(E)}.`}${t.authHousehold.subscriptionProcessor===i.PaddleLifetime?"":`  ${a.translate(L)} ${10-t.authHousehold.subscriptionReferralCount} ${a.translate(O)}: https://web.homechart.app/signup?referral=${t.authHousehold.subscriptionReferralCode}`}`)]]:[],u.data().cloud||s.findID(e.attrs.authHouseholdID).id===null?[o(d,{input:{disabled:!u.data().cloud,oninput:r=>{r===""?t.authHousehold.selfHostedID=null:t.authHousehold.selfHostedID=r,setTimeout(async()=>{if(t.authHousehold.selfHostedID===r||t.authHousehold.selfHostedID===null)return n.update(t.authHousehold)},500)},type:"text",value:u.data().cloud?t.authHousehold.selfHostedID===null?"":t.authHousehold.selfHostedID:n.findID(e.attrs.authHouseholdID).id},name:a.translate(q),tooltip:a.translate(N)}),u.data().cloud?[]:[o(h,{name:a.translate(G),onclick:async()=>navigator.clipboard.writeText(`${n.findID(e.attrs.authHouseholdID).id}`).then(()=>{M.setLayoutAppAlert({message:a.translate(J)}),window.open("https://web.homechart.app/subscription","_blank")}),permitted:!0,primary:!0,requireOnline:!0}),o(h,{name:a.translate(Y),onclick:async()=>s.read(e.attrs.authHouseholdID).then(async()=>(await s.readJWT(e.attrs.authHouseholdID),t.authHousehold=p(s.findID(e.attrs.authHouseholdID)),m())),permitted:c.permitted(f.Auth,!0,e.attrs.authHouseholdID),primary:!0,requireOnline:!0})]]:[]])}}export{V as F};
