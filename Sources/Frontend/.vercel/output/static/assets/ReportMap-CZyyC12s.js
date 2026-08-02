const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-md05_OmU.js","assets/hooks-f72RoY0u.js","assets/index-fMDdQruM.js","assets/index-CIGW-MKW.css","assets/leaflet-src-DsIM1HYO.js"])))=>i.map(i=>d[i]);
import{bu as n,aS as v,bi as e,Y as P,a3 as I}from"./index-fMDdQruM.js";const y=18;function O({center:s,hasLocation:l,useMap:o}){const r=o();return n.useEffect(()=>{if(window.setTimeout(()=>r.invalidateSize(),0),l){const i=r.getZoom(),x=i&&i>13?i:y;r.flyTo(s,x,{animate:!0,duration:.8});return}r.setView(s,13,{animate:!0})},[s,l,r]),null}function R({useMapEvents:s,onChangeLocation:l}){return s({click(o){l&&l(o.latlng.lat,o.latlng.lng)}}),null}function V({mapCenter:s,hasLocation:l,markerDisplayed:o,latitude:r,longitude:i,address:x,locationLoading:j,onChangeLocation:d}){const[m,f]=n.useState("osm"),[h,u]=n.useState(!1),p=n.useRef(null);n.useEffect(()=>{const a=t=>{p.current&&!p.current.contains(t.target)&&u(!1)};return document.addEventListener("mousedown",a),()=>{document.removeEventListener("mousedown",a)}},[]);const[b,w]=n.useState(null),N=n.useMemo(()=>({dragend(a){const t=a.target;if(t!=null){const c=t.getLatLng();d&&d(c.lat,c.lng)}}}),[d]);if(n.useEffect(()=>{let a=!1;return Promise.all([v(()=>import("./index-md05_OmU.js"),__vite__mapDeps([0,1,2,3,4])),v(()=>import("./leaflet-src-DsIM1HYO.js").then(t=>t.l),__vite__mapDeps([4,2,3]))]).then(([t,c])=>{if(a)return;const T=c.default.divIcon({className:"",html:`
          <div style="position: relative; width: 32px; height: 42px;">
            <div style="
              position: absolute;
              left: 3px;
              top: 2px;
              width: 26px;
              height: 26px;
              border-radius: 50% 50% 50% 0;
              background: #0b5ed7;
              border: 3px solid #ffffff;
              box-shadow: 0 10px 22px rgba(11, 94, 215, 0.35);
              transform: rotate(-45deg);
              display: grid;
              place-items: center;
            ">
              <div style="
                width: 8px;
                height: 8px;
                border-radius: 9999px;
                background: #111111;
                transform: rotate(45deg);
              "></div>
            </div>
          </div>
        `,iconSize:[32,42],iconAnchor:[16,42],popupAnchor:[0,-42]});w({MapContainer:t.MapContainer,TileLayer:t.TileLayer,Marker:t.Marker,Popup:t.Popup,useMap:t.useMap,useMapEvents:t.useMapEvents,currentLocationIcon:T})}),()=>{a=!0}},[]),!b)return e.jsx("div",{className:"w-full h-full relative bg-slate-50 flex items-center justify-center rounded-lg border border-slate-200",children:e.jsx("span",{className:"text-slate-400 text-sm",children:"Đang tải bản đồ..."})});const{MapContainer:M,TileLayer:E,Marker:k,Popup:L,useMap:_,useMapEvents:z,currentLocationIcon:g}=b;return e.jsxs("div",{className:"w-full h-full relative",children:[e.jsx("div",{ref:p,className:"absolute top-3 right-3 flex flex-col items-end gap-2 text-xs",style:{zIndex:1e3},children:e.jsxs("div",{className:"relative",children:[e.jsx("button",{type:"button",onClick:()=>u(!h),className:"w-10 h-10 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-md flex items-center justify-center cursor-pointer transition text-slate-600",title:"Lớp bản đồ",children:e.jsx(P,{size:18})}),h&&e.jsxs("div",{className:"absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-[1100] text-left",children:[e.jsx("button",{type:"button",onClick:()=>{f("osm"),u(!1)},className:`w-full text-left px-3 py-2 text-xs transition ${m==="osm"?"bg-blue-50 text-blue-600 font-extrabold":"text-slate-700 hover:bg-slate-50 font-semibold"}`,children:"🗺️ Bản đồ (Google)"}),e.jsx("button",{type:"button",onClick:()=>{f("satellite"),u(!1)},className:`w-full text-left px-3 py-2 text-xs transition ${m==="satellite"?"bg-blue-50 text-blue-600 font-extrabold":"text-slate-700 hover:bg-slate-50 font-semibold"}`,children:"🛰️ Vệ tinh"})]})]})}),e.jsxs(M,{center:s,zoom:l?y:13,maxZoom:21,className:"w-full h-full",scrollWheelZoom:!0,dragging:!0,zoomControl:!0,attributionControl:!1,children:[e.jsx(O,{center:s,hasLocation:l,useMap:_}),e.jsx(R,{useMapEvents:z,onChangeLocation:d}),e.jsx(E,{attribution:"© Google Maps",maxZoom:21,maxNativeZoom:20,url:m==="osm"?"https://mt1.google.com/vt/lyrs=m&hl=vi&gl=VN&x={x}&y={y}&z={z}":"https://mt1.google.com/vt/lyrs=y&hl=vi&gl=VN&x={x}&y={y}&z={z}"}),o&&r!==null&&i!==null&&g&&e.jsx(k,{position:[r,i],icon:g,draggable:!0,eventHandlers:N,children:e.jsxs(L,{children:[e.jsx("strong",{children:"Vị trí hiện tại"}),e.jsx("p",{className:"text-sm mt-1",children:x||"Đã xác định bằng GPS"})]})})]}),!o&&e.jsx("div",{className:"absolute inset-x-4 top-4 rounded-lg border border-white/70 bg-white/95 p-4 shadow-sm z-[500]",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx(I,{className:"text-gov-blue shrink-0 mt-0.5",size:22}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-ink",children:"Đang chờ vị trí"}),e.jsx("p",{className:"text-sm text-ink-soft",children:j?"Hệ thống đang xin quyền GPS...":"Bấm Lấy lại vị trí để hiển thị ghim trên bản đồ."})]})]})})]})}export{V as ReportMap};
