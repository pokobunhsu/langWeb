var server = "http://localhost:8080/";
var token = "f561d7718d02ff4b4e337506522349d3";//接收來html上的value
var uid = "4855514";//接收來html上的value
var live_id = "1797163Y68198lWaF";//請更改主播live ID
var liver_uid = "1797163";//請更改主播UID
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
    if(JDATA.data.live_key == null){
        alert("主播已結束直播!");
    }else{
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
        getvideo();
    }
    //document.getElementById("player2").setAttribute("src",JDATA.data.liveurl);
}
function connectLive(){//登入直播間，並取得權限及其他使用者傳來之訊息
    var tk = $("#myat").val();
    socket = new WebSocket('wss://cht-q1.lv-show.com/socket.io/?EIO=3&transport=websocket');
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
function getvideo(){//取得串流網址
    let xhr = new XMLHttpRequest();
    var vdl = "";
    xhr.open('GET', server + 'https://langapi.lv-show.com/v2/h5/data?id=22&live_id='+live_id);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send();
    xhr.addEventListener("load", transferComplete);
    function transferComplete(evt){
        var JDATA = JSON.parse(xhr.responseText);
        console.log(JDATA.data.extra.live_url);
        if (flvjs.isSupported()) {
            var videoElement = document.getElementById('videoElement');
            var flvPlayer = flvjs.createPlayer({
                type: 'flv',
                enableWorker: false,
                lazyLoadMaxDuration: 3 * 60,
                url: JDATA.data.extra.live_url
            });
            flvPlayer.attachMediaElement(videoElement);
            flvPlayer.load();        
        }
    }
}
function sendmsg(){//傳送使用者所輸入訊息
    var message = $("#msg").val();
    document.getElementById("chat").innerHTML+='<div style="background-color: pink;margin: 10px;">'+"你"+"："+message+'</div>';
    document.getElementById("msg").value="";
    document.getElementById("chat").scrollTop =  document.getElementById("chat").scrollHeight;
    socket.send('42/chat_nsp,["msg",{"name":"KAHO","grade_id":1,"grade_lvl":5,"lv":3,"lang_fans":"0","award_icon":"","medal":"","msg":"'+message+'","p_ic":"","g_lvl":"0","rel_color_lvl":0,"r_ic":"","n_cr":"#ffffff","rel_color":"#ffffff"}]');
}
function refresh(){//refresh避免直播間聊天斷線
    socket.send('2');
}
function flv_start() {//點擊進入直播間後順便開始撥放串流、將按鈕停用並顯示已連線
    document.getElementById("videoElement").play();
    document.getElementById("connect_btn").innerText="已連線";
    document.getElementById("connect_btn").setAttribute("disabled","disabled");
}