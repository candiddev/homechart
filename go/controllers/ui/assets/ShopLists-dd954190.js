import{S as o,m as n,eP as l,A as m,c as e,ds as b,hz as c,ab as d,hF as h,af as y,T as s,hN as f,al as S,aC as g,ap as C,aN as L,a as A,b2 as p}from"./index-09c2e996.js";import{F}from"./Filter-01c23926.js";import{T as k}from"./TableColumnHousehold-f6fe7c15.js";import{G as I}from"./GetHelp-610c77dd.js";function N(){const a={columns:o({name:"",shopItemCount:"",personal:"",budgetCategoryID:""}),sort:o({formatter:t=>t.name,invert:!1,property:"name"})};let r;return{oninit:async()=>{p.spanStart("ShopLists"),r=o.lift((t,i,u)=>(n.redraw(),F.array(t,i,u)),l.data,a.columns,a.sort),m.setLayoutApp({...I("shop"),breadcrumbs:[{link:"/shop/items",name:e.translate(b)},{name:e.translate(c)}],toolbarActionButtons:[d().newShopList]}),p.spanEnd("ShopLists")},onremove:()=>{r.end(!0)},view:()=>n(A,{actions:[],data:r(),editOnclick:t=>{m.setLayoutAppForm(h,t)},filters:[],loaded:l.isLoaded(),sort:a.sort,tableColumns:[{formatter:t=>t.name,linkFormatter:t=>`/shop/lists/${t.id}`,linkRequireOnline:!0,name:e.translate(y),property:"name",type:s.Link},{name:e.translate(f),noFilter:!0,property:"shopItemCount"},{formatter:t=>t.authAccountID!==null,name:e.translate(S),noFilter:!0,property:"personal",type:s.Checkbox},{formatter:t=>g.findIDHeaderName(t.budgetCategoryID),linkFormatter:()=>"/budget/categories",name:`${e.translate(C)} ${e.translate(L)}`,noFilter:!0,property:"budgetCategoryID",type:s.Link},k()],tableColumnsNameEnabled:a.columns})}}export{N as ShopLists};
