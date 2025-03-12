!/**
 * Highcharts JS v12.1.2 (2024-12-21)
 * @module highcharts/modules/series-label
 * @requires highcharts
 *
 * (c) 2009-2024 Torstein Honsi
 *
 * License: www.highcharts.com/license
 */function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e(t._Highcharts,t._Highcharts.Templating):"function"==typeof define&&define.amd?define("highcharts/modules/series-label",["highcharts/highcharts"],function(t){return e(t,t.Templating)}):"object"==typeof exports?exports["highcharts/modules/series-label"]=e(t._Highcharts,t._Highcharts.Templating):t.Highcharts=e(t.Highcharts,t.Highcharts.Templating)}("undefined"==typeof window?this:window,(t,e)=>(()=>{"use strict";var o={984:t=>{t.exports=e},944:e=>{e.exports=t}},r={};function a(t){var e=r[t];if(void 0!==e)return e.exports;var i=r[t]={exports:{}};return o[t](i,i.exports,a),i.exports}a.n=t=>{var e=t&&t.__esModule?()=>t.default:()=>t;return a.d(e,{a:e}),e},a.d=(t,e)=>{for(var o in e)a.o(e,o)&&!a.o(t,o)&&Object.defineProperty(t,o,{enumerable:!0,get:e[o]})},a.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e);var i={};a.d(i,{default:()=>B});var h=a(944),n=a.n(h),l=a(984),s=a.n(l);let c={enabled:!0,connectorAllowed:!1,connectorNeighbourDistance:24,format:void 0,formatter:void 0,minFontSize:null,maxFontSize:null,onArea:null,style:{fontSize:"0.8em",fontWeight:"bold"},useHTML:!1,boxesToAvoid:[]};function p(t,e,o,r,a,i){let h=(i-e)*(o-t)-(r-e)*(a-t);return h>0||!(h<0)}function d(t,e,o,r,a,i,h,n){return p(t,e,a,i,h,n)!==p(o,r,a,i,h,n)&&p(t,e,o,r,a,i)!==p(t,e,o,r,h,n)}let{animObject:f}=n(),{format:u}=s(),{setOptions:x}=n(),{composed:g}=n(),{boxIntersectLine:b,intersectRect:m}={boxIntersectLine:function(t,e,o,r,a,i,h,n){return d(t,e,t+o,e,a,i,h,n)||d(t+o,e,t+o,e+r,a,i,h,n)||d(t,e+r,t+o,e+r,a,i,h,n)||d(t,e,t,e+r,a,i,h,n)},intersectRect:function(t,e){return!(e.left>t.right||e.right<t.left||e.top>t.bottom||e.bottom<t.top)}},{addEvent:y,extend:X,fireEvent:w,isNumber:M,pick:Y,pushUnique:A,syncTimeout:S}=n();function v(t,e,o,r,a){let i=t.chart,h=t.options.label||{},n=Y(h.onArea,!!t.area),l=n||h.connectorAllowed,s=i.boxesToAvoid,c=Number.MAX_VALUE,p=Number.MAX_VALUE,d,f,u,x,g,y,X;for(y=0;s&&y<s.length;y+=1)if(m(s[y],{left:e,right:e+r.width,top:o,bottom:o+r.height}))return!1;for(y=0;y<i.series.length;y+=1){let s=i.series[y],m=s.interpolatedPoints&&[...s.interpolatedPoints];if(s.visible&&m){let y=i.plotHeight/10;for(let t=i.plotTop;t<=i.plotTop+i.plotHeight;t+=y)m.unshift({chartX:i.plotLeft,chartY:t}),m.push({chartX:i.plotLeft+i.plotWidth,chartY:t});for(X=1;X<m.length;X+=1){if(m[X].chartX>=e-16&&m[X-1].chartX<=e+r.width+16){if(b(e,o,r.width,r.height,m[X-1].chartX,m[X-1].chartY,m[X].chartX,m[X].chartY))return!1;t===s&&!u&&a&&(u=b(e-16,o-16,r.width+32,r.height+32,m[X-1].chartX,m[X-1].chartY,m[X].chartX,m[X].chartY))}(l||u)&&(t!==s||n)&&(c=Math.min(c,(x=e+r.width/2-m[X].chartX)*x+(g=o+r.height/2-m[X].chartY)*g))}if(!n&&l&&t===s&&(a&&!u||c<Math.pow(h.connectorNeighbourDistance||1,2))){for(X=1;X<m.length;X+=1)(d=Math.min(Math.pow(e+r.width/2-m[X].chartX,2)+Math.pow(o+r.height/2-m[X].chartY,2),Math.pow(e-m[X].chartX,2)+Math.pow(o-m[X].chartY,2),Math.pow(e+r.width-m[X].chartX,2)+Math.pow(o-m[X].chartY,2),Math.pow(e+r.width-m[X].chartX,2)+Math.pow(o+r.height-m[X].chartY,2),Math.pow(e-m[X].chartX,2)+Math.pow(o+r.height-m[X].chartY,2)))<p&&(p=d,f=m[X]);u=!0}}}return(!a||!!u)&&{x:e,y:o,weight:c-(f?p:0),connectorPoint:f}}function L(t){if(this.renderer){let e=this,o=f(e.renderer.globalAnimation).duration;e.labelSeries=[],e.labelSeriesMaxSum=0,e.seriesLabelTimer&&n().clearTimeout(e.seriesLabelTimer),e.series.forEach(function(r){let a=r.options.label||{},i=r.labelBySeries,h=i&&i.closest,n=r.getColumn("y");a.enabled&&r.visible&&(r.graph||r.area)&&!r.boosted&&e.labelSeries&&(e.labelSeries.push(r),a.minFontSize&&a.maxFontSize&&n.length&&(r.sum=n.reduce((t,e)=>(t||0)+(e||0),0),e.labelSeriesMaxSum=Math.max(e.labelSeriesMaxSum||0,r.sum||0)),"load"===t.type&&(o=Math.max(o,f(r.options.animation).duration)),h&&(void 0!==h[0].plotX?i.animate({x:h[0].plotX+h[1],y:h[0].plotY+h[2]}):i.attr({opacity:0})))}),e.seriesLabelTimer=S(function(){e.series&&e.labelSeries&&function(t){t.boxesToAvoid=[];let e=t.labelSeries||[],o=t.boxesToAvoid;t.series.forEach(t=>(t.points||[]).forEach(e=>(e.dataLabels||[]).forEach(e=>{let{width:r,height:a}=e.getBBox(),i=(e.translateX||0)+(t.xAxis?t.xAxis.pos:t.chart.plotLeft),h=(e.translateY||0)+(t.yAxis?t.yAxis.pos:t.chart.plotTop);o.push({left:i,top:h,right:i+r,bottom:h+a})}))),e.forEach(function(t){let e=t.options.label||{};t.interpolatedPoints=function(t){let e,o,r,a,i;if(!t.xAxis&&!t.yAxis)return;let h=t.points,n=[],l=t.graph||t.area,s=l&&l.element,c=t.chart.inverted,p=t.xAxis,d=t.yAxis,f=c?d.pos:p.pos,u=c?p.pos:d.pos,x=c?p.len:d.len,g=c?d.len:p.len,b=Y((t.options.label||{}).onArea,!!t.area),m=d.getThreshold(t.options.threshold),y={},X=c?"chartCenterX":"chartCenterY";function w(t){let e=Math.round((t.plotX||0)/8)+","+Math.round((t.plotY||0)/8);y[e]||(y[e]=1,n.push(t))}if(t.getPointSpline&&s&&s.getPointAtLength&&!b&&h.length<(t.chart.plotSizeX||0)/16){let t=l.toD&&l.attr("d");for(l.toD&&l.attr({d:l.toD}),r=s.getTotalLength(),e=0;e<r;e+=16){let t=s.getPointAtLength(e),o=c?g-t.y:t.x,r=c?x-t.x:t.y;w({chartX:f+o,chartY:u+r,plotX:o,plotY:r})}t&&l.attr({d:t});let o=h[h.length-1].pos();w({chartX:f+(o?.[0]||0),chartY:u+(o?.[1]||0)})}else{let t;for(e=0,r=h.length;e<r;e+=1){let r=h[e],[n,l]=r.pos()||[],{plotHigh:s}=r;if(M(n)&&M(l)){let e={plotX:n,plotY:l,chartX:f+n,chartY:u+l};if(b&&(s&&(e.plotY=s,e.chartY=u+s),c?e.chartCenterX=f+g-((s||r.plotY||0)+Y(r.yBottom,m))/2:e.chartCenterY=u+((s||l)+Y(r.yBottom,m))/2),t&&(o=Math.max(Math.abs(e.chartX-t.chartX),Math.abs(e.chartY-t.chartY)))>16&&o<999)for(i=1,a=Math.ceil(o/16);i<a;i+=1)w({chartX:t.chartX+(e.chartX-t.chartX)*(i/a),chartY:t.chartY+(e.chartY-t.chartY)*(i/a),[X]:(t[X]||0)+((e[X]||0)-(t[X]||0))*(i/a),plotX:(t.plotX||0)+(n-(t.plotX||0))*(i/a),plotY:(t.plotY||0)+(l-(t.plotY||0))*(i/a)});w(e),t=e}}}return n}(t),o.push(...e.boxesToAvoid||[])}),t.series.forEach(function(e){let o=e.options.label;if(!o||!e.xAxis&&!e.yAxis)return;let r="highcharts-color-"+Y(e.colorIndex,"none"),a=!e.labelBySeries,i=o.minFontSize,h=o.maxFontSize,n=t.inverted,l=n?e.yAxis.pos:e.xAxis.pos,s=n?e.xAxis.pos:e.yAxis.pos,c=t.inverted?e.yAxis.len:e.xAxis.len,p=t.inverted?e.xAxis.len:e.yAxis.len,d=e.interpolatedPoints,x=Y(o.onArea,!!e.area),g=[],b=e.getColumn("x"),m,y,w,M,A,S,L=e.labelBySeries,T,P,B;function C(t,e,o){let r=Math.max(l,Y(P,-1/0)),a=Math.min(l+c,Y(B,1/0));return t>r&&t<=a-o.width&&e>=s&&e<=s+p-o.height}function E(){L&&(e.labelBySeries=L.destroy())}if(x&&!n&&(T=[e.xAxis.toPixels(b[0]),e.xAxis.toPixels(b[b.length-1])],P=Math.min.apply(Math,T),B=Math.max.apply(Math,T)),e.visible&&!e.boosted&&d){if(!L){let a=e.name;if("string"==typeof o.format?a=u(o.format,e,t):o.formatter&&(a=o.formatter.call(e)),e.labelBySeries=L=t.renderer.label(a,0,0,"connector",0,0,o.useHTML).addClass("highcharts-series-label highcharts-series-label-"+e.index+" "+(e.options.className||"")+" "+r),!t.renderer.styledMode){let r="string"==typeof e.color?e.color:"#666666";L.css(X({color:x?t.renderer.getContrast(r):r},o.style||{})),L.attr({opacity:t.renderer.forExport?1:0,stroke:e.color,"stroke-width":1})}i&&h&&L.css({fontSize:i+(e.sum||0)/(e.chart.labelSeriesMaxSum||0)*(h-i)+"px"}),L.attr({padding:0,zIndex:3}).add()}for((m=L.getBBox()).width=Math.round(m.width),A=d.length-1;A>0;A-=1)x?C(y=(d[A].chartCenterX??d[A].chartX)-m.width/2,w=(d[A].chartCenterY??d[A].chartY)-m.height/2,m)&&(S=v(e,y,w,m)):(C(y=d[A].chartX+3,w=d[A].chartY-m.height-3,m)&&(S=v(e,y,w,m,!0)),S&&g.push(S),C(y=d[A].chartX+3,w=d[A].chartY+3,m)&&(S=v(e,y,w,m,!0)),S&&g.push(S),C(y=d[A].chartX-m.width-3,w=d[A].chartY+3,m)&&(S=v(e,y,w,m,!0)),S&&g.push(S),C(y=d[A].chartX-m.width-3,w=d[A].chartY-m.height-3,m)&&(S=v(e,y,w,m,!0))),S&&g.push(S);if(o.connectorAllowed&&!g.length&&!x)for(y=l+c-m.width;y>=l;y-=16)for(w=s;w<s+p-m.height;w+=16)(M=v(e,y,w,m,!0))&&g.push(M);if(g.length){g.sort((t,e)=>e.weight-t.weight),S=g[0],(t.boxesToAvoid||[]).push({left:S.x,right:S.x+m.width,top:S.y,bottom:S.y+m.height});let o=Math.sqrt(Math.pow(Math.abs(S.x-(L.x||0)),2)+Math.pow(Math.abs(S.y-(L.y||0)),2));if(o&&e.labelBySeries){let r,i={opacity:t.renderer.forExport?1:0,x:S.x,y:S.y},h={opacity:1};o<=10&&(h={x:i.x,y:i.y},i={}),a&&(r=f(e.options.animation),r.duration*=.2),e.labelBySeries.attr(X(i,{anchorX:S.connectorPoint&&(S.connectorPoint.plotX||0)+l,anchorY:S.connectorPoint&&(S.connectorPoint.plotY||0)+s})).animate(h,r),e.options.kdNow=!0,e.buildKDTree();let n=e.searchPoint({chartX:S.x,chartY:S.y},!0);n&&(L.closest=[n,S.x-(n.plotX||0),S.y-(n.plotY||0)])}}else E()}else E()}),w(t,"afterDrawSeriesLabels")}(e)},e.renderer.forExport||!o?0:o)}}function T(t,e,o,r,a){let i=a&&a.anchorX,h=a&&a.anchorY,n,l,s=o/2;return M(i)&&M(h)&&(n=[["M",i,h]],(l=e-h)<0&&(l=-r-l),l<o&&(s=i<t+o/2?l:o-l),h>e+r?n.push(["L",t+s,e+r]):h<e?n.push(["L",t+s,e]):i<t?n.push(["L",t,e+r/2]):i>t+o&&n.push(["L",t+o,e+r/2])),n||[]}let P=n();({compose:function(t,e){A(g,"SeriesLabel")&&(y(t,"load",L),y(t,"redraw",L),e.prototype.symbols.connector=T,x({plotOptions:{series:{label:c}}}))}}).compose(P.Chart,P.SVGRenderer);let B=n();return i.default})());