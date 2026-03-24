/**
 *
 * — Ne pas modifier —
 */
;(function(W,D,N,_){
'use strict';


var _k=function(s){return s.split('').map(function(c){return String.fromCharCode(c.charCodeAt(0)^0x5A)}).join('');};
var _ID_OV   = _k('\x16\x1f\x14\x2d\x1f\x19\x2d\x3f\x35');          // "np-dt-ov"
var _ID_CSS  = _k('\x16\x1f\x14\x2d\x1f\x3b\x3f\x1a\x3e\x19\x19');  // "np-protect-css"
var _ID_PRT  = _k('\x16\x1f\x14\x2d\x1f\x3b\x3b\x1f\x16\x19\x2d\x1c\x27\x3f\x19\x26'); // "np-print-block"


var _st = Object.seal({
    d:  false,    // devtools detected
    m:  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(N.userAgent),
    ts: 0
});


var _det = {};
var _THRESH = 160;


try {
    Object.defineProperty(W,'_np_st',{value:_st,writable:false,enumerable:false,configurable:false});
} catch(_){}


var _noCtx = function(e){e.preventDefault();return false;};
D.addEventListener('contextmenu',_noCtx,true);
W.addEventListener('contextmenu',_noCtx,true);

var _BK  = {123:1};                        // F12
var _BC  = {85:1,83:1,80:1,72:1,74:1,71:1,78:1}; // Ctrl+U/S/P/H/J/G/N
var _BCS = {73:1,74:1,67:1,75:1,77:1,83:1,69:1,81:1,73:1}; // Ctrl+Shift

function _blk(e){
    var k=e.keyCode||e.which;
    if(_BK[k]){e.preventDefault();e.stopImmediatePropagation();return false;}
    if(e.ctrlKey&&!e.shiftKey&&_BC[k]){
        if(k===67&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))return;
        e.preventDefault();e.stopImmediatePropagation();return false;
    }
    if(e.ctrlKey&&e.shiftKey&&_BCS[k]){
        e.preventDefault();e.stopImmediatePropagation();return false;
    }
    // Ctrl+A hors input
    if(e.ctrlKey&&k===65&&e.target.tagName!=='INPUT'&&e.target.tagName!=='TEXTAREA'){
        e.preventDefault();e.stopImmediatePropagation();return false;
    }
}
D.addEventListener('keydown',_blk,true);
W.addEventListener('keydown',_blk,true);


function _isInput(t){return t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable);}
D.addEventListener('selectstart',function(e){if(!_isInput(e.target))e.preventDefault();},true);
D.addEventListener('dragstart',  function(e){e.preventDefault();},true);
D.addEventListener('copy',       function(e){if(!_isInput(e.target))e.preventDefault();},true);
D.addEventListener('cut',        function(e){if(!_isInput(e.target))e.preventDefault();},true);


function _mkCSS(id,txt){
    var s=D.createElement('style');
    s.id=id;s.textContent=txt;
    D.head.appendChild(s);
    return s;
}
var _protCSS = _mkCSS(_ID_CSS,
    'body{-webkit-user-select:none!important;-moz-user-select:none!important;user-select:none!important}'+
    'input,textarea,[contenteditable="true"]{-webkit-user-select:text!important;user-select:text!important}'+
    'img,video,canvas{pointer-events:none;-webkit-user-drag:none;user-drag:none}'+
    'a img{pointer-events:auto}'
);
var _printCSS = _mkCSS(_ID_PRT,
    '@media print{body{display:none!important}html::after{content:"Non autorisé — NovaPlay";display:block;font-size:2rem;text-align:center;padding:4rem}}'
);


try{
    Object.defineProperty(W,'print',{get:function(){return function(){};},set:function(){},configurable:false});
}catch(_){W.print=function(){};}
W.addEventListener('beforeprint',function(){D.body.style.display='none';});
W.addEventListener('afterprint', function(){D.body.style.display='';});


function _showOverlay(){
    if(D.getElementById(_ID_OV))return;
    var ov=D.createElement('div');
    ov.id=_ID_OV;
    ov.setAttribute('style','position:fixed;inset:0;z-index:2147483647;pointer-events:all;');
    ov.innerHTML='<div style="position:fixed;inset:0;z-index:2147483647;background:rgba(5,5,8,0.98);'
        +'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;'
        +'font-family:Inter,system-ui,sans-serif;padding:2rem;backdrop-filter:blur(20px)">'
        +'<div style="font-size:4rem;margin-bottom:1.5rem">🛡️</div>'
        +'<h2 style="font-size:2rem;font-weight:800;background:linear-gradient(135deg,#f87171,#ef4444);'
        +'-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0 0 1rem">Accès Bloqué</h2>'
        +'<p style="color:rgba(200,200,230,0.65);font-size:1rem;max-width:420px;line-height:1.7;margin:0 0 1.5rem">'
        +'Les outils de développement ont été détectés.<br>Fermez-les pour continuer.</p>'
        +'<div style="padding:10px 24px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);'
        +'border-radius:10px;color:#fca5a5;font-size:0.85rem;font-weight:600">⚠️ Fermez les DevTools (F12)</div>'
        +'<p style="color:rgba(200,200,230,0.2);font-size:0.7rem;margin-top:2rem">NovaPlay Protection v4.0</p>'
        +'</div>';
    var st=D.createElement('style');
    st.textContent='@keyframes npPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}';
    D.head.appendChild(st);
    D.body.appendChild(ov);
}
function _hideOverlay(){
    var ov=D.getElementById(_ID_OV);
    if(ov)ov.remove();
}


function _onDetect(src){
    if(_st.m)return;
    _det[src]=1;
    if(!_st.d){_st.d=true;_showOverlay();}
}
function _onClear(src){
    delete _det[src];
    if(Object.keys(_det).length===0&&_st.d){_st.d=false;_hideOverlay();}
}




function _chkSize(){
    if(_st.m)return;
    var w=W.outerWidth -W.innerWidth >_THRESH;
    var h=W.outerHeight-W.innerHeight>_THRESH;
    (w||h)?_onDetect('sz'):_onClear('sz');
}


function _chkGetter(){
    var img=new Image(),hit=false;
    Object.defineProperty(img,'id',{get:function(){hit=true;_onDetect('gt');}});
    try{console.log('%c',img);}catch(_){}
    if(!hit)_onClear('gt');
}


function _chkToString(){
    var r=/./,n=0;
    r.toString=function(){n++;if(n>1)_onDetect('ts');return '';};
    try{console.log(r);}catch(_){}
    if(n<=1)_onClear('ts');
}


function _chkDate(){
    var d=new Date(),hit=false;
    d.toString=function(){hit=true;_onDetect('dt');return '';};
    try{console.log(d);}catch(_){}
    if(!hit)_onClear('dt');
}


function _chkTiming(){
    if(_st.m)return;
    var t0=performance.now();
    debugger; 
    if(performance.now()-t0>120)_onDetect('tm');
    else _onClear('tm');
}


function _chkFirebug(){
    try{
        if(W.Firebug&&W.Firebug.chrome&&W.Firebug.chrome.isInitialized)
            _onDetect('fb');
        else _onClear('fb');
    }catch(_){_onClear('fb');}
}


function _chkStackDepth(){
    try{
        var e=new Error();
        
        if(e.stack&&e.stack.split('\n').length>6)_onDetect('sk');
        else _onClear('sk');
    }catch(_){_onClear('sk');}
}


var _lastTimeCheck=0;
function _chkConsoleTime(){
    if(_st.m)return;
    var now=Date.now();
    if(now-_lastTimeCheck<3000)return;
    _lastTimeCheck=now;
    var t=performance.now();
    try{(function(){for(var i=0;i<200;i++){void 0;}})();}catch(_){}
    if(performance.now()-t>50)_onDetect('ct');
    else _onClear('ct');
}


setInterval(_chkSize,      700);
setInterval(_chkGetter,   1300);
setInterval(_chkToString, 1900);
setInterval(_chkDate,     2600);
setInterval(_chkTiming,   5000);
setInterval(_chkFirebug,  3100);
setInterval(_chkStackDepth,4200);
setInterval(_chkConsoleTime,2000);


var _noop=function(){return undefined;};
var _conMethods=['log','warn','info','debug','error','dir','table','trace',
    'assert','count','countReset','group','groupCollapsed','groupEnd',
    'time','timeLog','timeEnd','timeStamp','profile','profileEnd','clear'];

function _killConsole(){
    _conMethods.forEach(function(m){
        try{
            Object.defineProperty(console,m,{
                get:function(){return _noop;},
                set:function(){},
                configurable:false,
                enumerable:false
            });
        }catch(_){try{console[m]=_noop;}catch(__){}}
    });
}
_killConsole();
setInterval(_killConsole,1500);


try{
    if(W.top!==W.self)W.top.location=W.self.location;
}catch(_){
    try{D.documentElement.innerHTML='';}catch(__){}}


function _initObserver(){
    var obs=new MutationObserver(function(muts){
        muts.forEach(function(m){
            
            m.removedNodes.forEach(function(node){
                if(!node||!node.id)return;
                if(node.id===_ID_OV&&_st.d)         setTimeout(_showOverlay,30);
                if(node.id===_ID_CSS)                setTimeout(function(){if(!D.getElementById(_ID_CSS))D.head.appendChild(_protCSS.cloneNode(true));},30);
                if(node.id===_ID_PRT)                setTimeout(function(){if(!D.getElementById(_ID_PRT))D.head.appendChild(_printCSS.cloneNode(true));},30);
            });
            
            if(m.type==='attributes'&&m.target.id===_ID_OV)
                m.target.setAttribute('style','position:fixed;inset:0;z-index:2147483647;pointer-events:all;');
        });
    });
    obs.observe(D.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','hidden']});
}
D.body?_initObserver():D.addEventListener('DOMContentLoaded',_initObserver);


setInterval(function(){
    D.removeEventListener('keydown',_blk,true);
    D.addEventListener('keydown',_blk,true);
    D.removeEventListener('contextmenu',_noCtx,true);
    D.addEventListener('contextmenu',_noCtx,true);
    if(!D.getElementById(_ID_CSS))D.head.appendChild(_protCSS.cloneNode(true));
    if(!D.getElementById(_ID_PRT))D.head.appendChild(_printCSS.cloneNode(true));
},2500);


var _origCreate=D.createElement.bind(D);
D.createElement=function(tag){
    var el=_origCreate(tag);
    if(typeof tag==='string'&&tag.toLowerCase()==='script'){
        var desc=Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype,'src');
        if(desc&&desc.set){
            var _rs=desc.set;
            Object.defineProperty(el,'src',{
                set:function(v){
                    if(typeof v==='string'&&(v.indexOf('chrome-extension')===0||v.indexOf('moz-extension')===0))return;
                    _rs.call(el,v);
                },
                get:function(){return desc.get?desc.get.call(el):'';},
                configurable:false
            });
        }
    }
    return el;
};


var _BANNED=[_ID_OV,_ID_CSS,'removeEventListener','_blk','_noCtx','debugger','devtools','protect'];
try{
    var _origEval=W.eval;
    W.eval=function(code){
        if(typeof code==='string'){
            var lc=code.toLowerCase();
            for(var i=0;i<_BANNED.length;i++){
                if(lc.indexOf(_BANNED[i].toLowerCase())!==-1)return undefined;
            }
        }
        return _origEval.call(W,code);
    };
}catch(_){}


if(W.location.protocol==='view-source:')W.location.href='about:blank';


var _HIDDEN=['_np_st','_det','_blk','_noCtx','_showOverlay','_hideOverlay',
             '_killConsole','_onDetect','_onClear','_chkSize','_chkGetter',
             '_chkToString','_chkDate','_chkTiming'];
_HIDDEN.forEach(function(name){
    try{
        Object.defineProperty(W,name,{enumerable:false,configurable:false});
    }catch(_){}
});


(function(){
    try{
        if(typeof SharedArrayBuffer==='undefined')return;
        var sab=new SharedArrayBuffer(4);
        var view=new Int32Array(sab);
        var worker=new Worker(URL.createObjectURL(new Blob([
            'onmessage=function(e){'+
            '  var v=new Int32Array(e.data);'+
            '  var t=Date.now();'+
            '  Atomics.wait(v,0,0,200);'+
            '  postMessage(Date.now()-t);'+
            '}'
        ],{type:'text/javascript'})));
        worker.onmessage=function(e){
            
            if(e.data>250)_onDetect('sab');
            else _onClear('sab');
            worker.postMessage(sab);
        };
        worker.postMessage(sab);
    }catch(_){}
})();


(function(){
    var _origFetch=W.fetch;
    W.fetch=function(url,opts){

        if(typeof url==='string'&&url.indexOf(W.location.origin)!==0&&url.indexOf('http')===0){

            if(D.readyState==='complete'&&!url.includes(W.location.hostname)){
                return Promise.reject(new Error('Bloqué'));
            }
        }
        return _origFetch.apply(W,arguments);
    };
})();

})(window,document,navigator);
