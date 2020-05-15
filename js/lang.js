var server = "https://corrner-node.herokuapp.com/";
var token = getParams("token");//接收來html上的value
var uid = getParams("userid");//接收來html上的value
var live_id = getParams("live_id"); //請更改主播live ID
var liver_uid = getParams("live_uid"); //請更改主播UID
var devid = Math.random().toString(36).substr(2, 678) + Date.now().toString(36).substr(4, 585);
var tk = "";
var un = "";
let xhr = new XMLHttpRequest();
xhr.open('POST', server + 'https://langapi.lv-show.com/v2/live/enter?live_id=' + live_id + '&prs_id=&anchor_pfid=' + liver_uid);
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
function transferComplete(evt) {
    var JDATA = JSON.parse(xhr.responseText);
    if(JDATA.ret_msg == "會話過期"){
        document.getElementById("connect_btn").innerText = "尚未登入";
        document.getElementById("connect_btn").setAttribute("disabled", "disabled");
        alert("會話過期,請重新登入");
    }else{
        if (JDATA.data.live_key == null) {
            alert("主播已結束直播!");   //需重新啟用DEBUG時先至暫時關閉
        } else {
            un = JDATA.data.my_info.nickname;
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
            var secret = JDATA.data.live_key;//需要來自於上方json資料
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
            tk = encodedHeader + "." + encodedData + "." + signature;
            document.getElementById("myat").value = tk;
            //getvideo();
        }
    }
    
}
function connectLive() {//登入直播間，並取得權限及其他使用者傳來之訊息
    var tk = $("#myat").val();
    socket = new WebSocket('wss://cht-q1.lv-show.com/socket.io/?EIO=3&transport=websocket');
    socket.addEventListener('open', function (event) {
        socket.send('40/chat_nsp,');
    });
    socket.addEventListener('open', function (event) {
        socket.send('42/chat_nsp,["authentication",{"live_id":"' + live_id + '","anchor_pfid":"' + liver_uid + '","access_token":"' + tk + '","token":"' + tk + '","from":"WEB","client_type":"web","r":0}]');
    });
    socket.addEventListener('message', function (event) {
        msg = event.data;
        msg = JSON.parse(msg.replace("42/chat_nsp,", ""));
        if (msg[0] == "msg") {
            document.getElementById("chat").innerHTML += '<div style="background-color: #B4E89F;margin: 10px;padding: 10px;width: 98%;border-radius: 30px;word-break: break-all;">' + msg[1].name + "：" + msg[1].msg + '</div>';
            console.log('Message from server ', msg[1].name + "：" + msg[1].msg);
            document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
        } else if (msg[0] == "join") {
            document.getElementById("chat").innerHTML += '<div style="background-color: #F7EFE4;margin: 10px;padding: 10px;width: 98%;border-radius: 30px;word-break: break-all;">' + msg[1].name + "[進入直播]" + '</div>';
            document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
        }
    });
    socket.addEventListener('open', function (event) {
        //socket.send('42/chat_nsp,["msg",{"name":"'+JDATA.data.my_info.nickname+'","grade_id":20,"grade_lvl":3,"lv":2,"lang_fans":"0","award_icon":"","medal":"","msg":"主播晚上好喔!","p_ic":"","g_lvl":"0","rel_color_lvl":0,"r_ic":"","n_cr":"#ffd700","rel_color":"#ffd700"}]');
    });
}
function getvideo() {//取得串流網址
    let xhr = new XMLHttpRequest();
    var vdl = "";
    xhr.open('GET', server + 'https://langapi.lv-show.com/v2/h5/data?id=22&live_id=' + live_id);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send();
    xhr.addEventListener("load", transferComplete);
    function transferComplete(evt) {
        var JDATA = JSON.parse(xhr.responseText);
        console.log(JDATA.data.extra.live_url);
        document.getElementById("videoElement").setAttribute("src", JDATA.data.extra.stream);
        if (Hls.isSupported()) {
            const video = document.getElementById('videoElement');
            const hls = new Hls();
            hls.attachMedia(video);
            hls.on(Hls.Events.MEDIA_ATTACHED, function () {
                console.log("video and hls.js are now bound together !");
                hls.loadSource(JDATA.data.extra.stream);
            });
        }
        // if (flvjs.isSupported()) {
        //     var videoElement = document.getElementById('videoElement');
        //     var flvPlayer = flvjs.createPlayer({
        //         type: 'flv',
        //         enableWorker: false,
        //         url: JDATA.data.extra.live_url
        //     });
        //     flvPlayer.attachMediaElement(videoElement);
        //     flvPlayer.load();        
        // }
    }
}
function sendmsg() {//傳送使用者所輸入訊息
    var message = $("#msg").val();
    document.getElementById("chat").innerHTML += '<div style="background-color: #B4E89F;margin: 10px;padding: 10px;width: 98%;border-radius: 30px;word-break: break-all;">' + "你" + "：" + message + '</div>';
    document.getElementById("msg").value = "";
    document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
    socket.send('42/chat_nsp,["msg",{"name":"'+un+'","grade_id":1,"grade_lvl":5,"lv":3,"lang_fans":"0","award_icon":"","medal":"","msg":"' + message + '","p_ic":"","g_lvl":"0","rel_color_lvl":0,"r_ic":"","n_cr":"#ffffff","rel_color":"#ffffff"}]');
}
function refresh() {//refresh避免直播間聊天斷線
    socket.send('2');
}
function flv_start() {//點擊進入直播間後順便開始撥放串流、將按鈕停用並顯示已連線--flv用
    document.getElementById("videoElement").play();
    document.getElementById("connect_btn").innerText = "已連線";
    document.getElementById("chat").innerHTML += '<div style="background-color: #B4E89F;margin: 10px;padding: 10px;width: 98%;border-radius: 30px;word-break: break-all;">你進入了直播間~</div>';
    document.getElementById("connect_btn").setAttribute("disabled", "disabled");
}
function getParams(name, href) {
    //this function from https://www.jianshu.com/p/682fe64fd1eb
    var href = href || window.location.href,
        value = '';

    if (name) {
        var reg = new RegExp(name + '=([^&]*)', 'g');
        href.replace(reg, function ($0, $1) {
            value = decodeURI($1);
        });
    } else {
        value = {};
        var reg = /\b(\w+)=([^\/&]*)/g;
        href.replace(reg, function ($0, $1, $2) {
            value[$1] = decodeURI($2);
        });
    }
    return value;
};