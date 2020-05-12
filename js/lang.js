var server = "http://localhost:8080/";
var token = "dc8e3f0d69dbca28e79c60185aa18a6f";//接收來html上的value
var uid = "4855514";//接收來html上的value
var live_id = "1325961Y96093nEsm";//請更改主播live ID
var liver_uid = "1325961";//請更改主播UID
var devid = Math.random().toString(36).substr(2, 678) + Date.now().toString(36).substr(4, 585);
var tk="";
let xhr = new XMLHttpRequest();
xhr.open('POST', server + 'https://langapi.lv-show.com/v2/live/enter?live_id='+live_id+'&prs_id=&anchor_pfid='+liver_uid);
xhr.setRequestHeader('PLATFORM', 'WEB');
xhr.setRequestHeader('LOCALE', 'TW');
xhr.setRequestHeader('USER-TOKEN', token);
xhr.setRequestHeader('VERSION', '5.0.0.7');
xhr.setRequestHeader('API-VERSION', '2.0');
xhr.setRequestHeader('USER-UID', uid);
xhr.setRequestHeader('DEVICE-ID', devid);
xhr.setRequestHeader('USER-MPHONE-OS-VER', '9');
xhr.setRequestHeader('VERSION-CODE', '1280');
xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
xhr.send();
xhr.addEventListener("load", transferComplete);
function transferComplete(evt){
    var JDATA = JSON.parse(xhr.responseText);
    var header = {
        "alg": "HS256"
      };
    var data = {
        "access_token": token,
        "live_id": live_id,
        "LOCALE": "TW",
        "pfid": uid,
        "name": JDATA.data.my_info.nickname,
        "from": "306",
        "lang_fans": "0"
    };
    var secret =JDATA.data.live_key;//需要來自於上方json資料
    console.log(secret);
    function base64url(source) {
        encodedSource = CryptoJS.enc.Base64.stringify(source);
        encodedSource = encodedSource.replace(/=+$/, '');
        encodedSource = encodedSource.replace(/\+/g, '-');
        encodedSource = encodedSource.replace(/\//g, '_');
        return encodedSource;
    }
    var stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
    var encodedHeader = base64url(stringifiedHeader);
    var stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(data));
    var encodedData = base64url(stringifiedData);
    var signature = encodedHeader + "." + encodedData;
    signature = CryptoJS.HmacSHA256(signature, secret);
    signature = base64url(signature);
    tk = encodedHeader+"."+encodedData+"."+signature;
    document.getElementById("myat").value=tk;
    var videoid = JDATA.data.share.share_id;
    videoid = videoid.substr(0,8);
    var videolink = "https://video-wsflv.langlive.com/live/"+videoid+".flv";
    const player = new Clappr.Player({
        source: videolink, 
        parentId: "#player",
        width:500,
        height:720
      });
    //document.getElementById("player2").setAttribute("src",JDATA.data.liveurl);
}
function connectLive(){
    const socket = new WebSocket('wss://cht-q1.lv-show.com/socket.io/?EIO=3&transport=websocket');
    var tk = $("#myat").val();
    socket.addEventListener('open', function (event) {
        socket.send('40/chat_nsp,');
    });
    socket.addEventListener('open', function (event) {
        socket.send('42/chat_nsp,["authentication",{"live_id":"'+live_id+'","anchor_pfid":"'+liver_uid+'","access_token":"'+tk+'","token":"'+tk+'","from":"WEB","client_type":"web","r":0}]');
    });
    socket.addEventListener('message', function (event) {
        msg =event.data;
        msg=JSON.parse(msg.replace("42/chat_nsp,",""));
        if(msg[0]=="msg"){
            document.getElementById("chat").innerHTML+='<div style="background-color: pink;margin: 10px;">'+msg[1].name+"："+msg[1].msg+'</div>';
            console.log('Message from server ', msg[1].name+"："+msg[1].msg);
            document.getElementById("chat").scrollTop =  document.getElementById("chat").scrollHeight;
        }else if(msg[0]=="join"){
            document.getElementById("chat").innerHTML+='<div style="background-color: bisque;margin: 10px;">'+msg[1].name+"[進入直播]"+'</div>';
            document.getElementById("chat").scrollTop =  document.getElementById("chat").scrollHeight;
        }

    });
    socket.addEventListener('open', function (event) {
        //socket.send('42/chat_nsp,["msg",{"name":"'+JDATA.data.my_info.nickname+'","grade_id":20,"grade_lvl":3,"lv":2,"lang_fans":"0","award_icon":"","medal":"","msg":"主播晚上好喔!","p_ic":"","g_lvl":"0","rel_color_lvl":0,"r_ic":"","n_cr":"#ffd700","rel_color":"#ffd700"}]');
    });
}

