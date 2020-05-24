import "./styles.scss";


import Hls from "hls.js"
import CryptoJS from 'crypto-js';
import Base64 from 'crypto-js/enc-base64';
import HmacSHA256 from 'crypto-js/hmac-sha256';

const server = CROS_SERVER;
var token
var uid
var live_id
var liver_uid
var devid
var tk = "";
var un = "";
var canopen = "n";

let socket
var romsocket

function init() {
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
    xhr.addEventListener("load", function (evt) {
        var JDATA = JSON.parse(xhr.responseText);
        liver_uid = JDATA.data.pfid;
        console.log(liver_uid);

        if (JDATA.ret_msg == "會話過期") {
            document.getElementById("connect_btn").innerText = "尚未登入";
            document.getElementById("connect_btn").setAttribute("disabled", "disabled");
            alert("會話過期,請重新登入");
        } else {
            //document.getElementById("liver").innerText="這是"+JDATA.data.nickname+"的房間";
            if (JDATA.data.live_key == null) {
                alert("主播已結束直播!或是您所輸入的live_id有誤");   //需重新啟用DEBUG時先至暫時關閉
            } else {
                document.getElementById("connect_btn").innerText = "連線直播間";
                document.getElementById("username").innerText = "歡迎，" + JDATA.data.my_info.nickname;
                document.getElementById("chat").innerHTML = '<div class="my-1 px-2 py-1 rounded-pill"  style="background-color: #FFCF00; word-break: break-all;">' + "這是" + "：" + JDATA.data.nickname + '的房間</div>';
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
                    let encodedSource = Base64.stringify(source);
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
                signature = HmacSHA256(signature, secret);
                signature = base64url(signature);
                tk = encodedHeader + "." + encodedData + "." + signature;
                document.getElementById("myat").value = tk;
                //getvideo();
            }
        }
        connect()
    });
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
        let msg = event.data;
        msg = JSON.parse(msg.replace("42/chat_nsp,", ""));
        if (msg[0] == "msg") {
            document.getElementById("chat").innerHTML += '<div class="msg-box-msg my-1 px-2 py-1 rounded-pill" ><b>' + msg[1].name + "</b>：" + msg[1].msg + '</div>';
            //console.log('Message from server ', msg[1].name + "：" + msg[1].msg);
            document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
        } else if (msg[0] == "join") {
            document.getElementById("chat").innerHTML += '<div class="msg-box-join my-1 px-2 py-1 rounded-pill" >' + msg[1].name + "[進入直播]" + '</div>';
            document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
        }
    });
    socket.addEventListener('open', function (event) {
        //socket.send('42/chat_nsp,["msg",{"name":"'+JDATA.data.my_info.nickname+'","grade_id":20,"grade_lvl":3,"lv":2,"lang_fans":"0","award_icon":"","medal":"","msg":"主播晚上好喔!","p_ic":"","g_lvl":"0","rel_color_lvl":0,"r_ic":"","n_cr":"#ffd700","rel_color":"#ffd700"}]');
    });
}
function getvideo() {//取得串流網址
    let xhr = new XMLHttpRequest();
    xhr.open('GET', server + 'https://langapi.lv-show.com/v2/h5/data?id=22&live_id=' + live_id);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send();
    xhr.addEventListener("load", function (evt) {
        var JDATA = JSON.parse(xhr.responseText);
        console.log(JDATA.data);
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
    });

}
function sendmsg() {//傳送使用者所輸入訊息
    var message = $("#msg").val();
    document.getElementById("chat").innerHTML += '<div class="msg-box-msg my-1 px-2 py-1 rounded-pill" >' + "你" + "：" + message + '</div>';
    document.getElementById("msg").value = "";
    document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
    socket.send('42/chat_nsp,["msg",{"name":"' + un + '","grade_id":1,"grade_lvl":5,"lv":3,"lang_fans":"0","award_icon":"","medal":"","msg":"' + message + '","p_ic":"","g_lvl":"0","rel_color_lvl":1,"r_ic":"","n_cr":"#0c08ff","rel_color":"#0c08ff"}]');
    //socket.send('42/chat_nsp,["msg",{"pfid":"3861468","live_id":"3652550Y104122Rev","is_admin":false,"lv":25,"name":"poko🍕格格真的飽了","msg":":)","medal":"","type":0,"rel_color":"#DFAF5E","n_cr":"#F8BBD0","vip_fan":2,"grade_id":1,"grade_lvl":87,"ugid":1,"uglv":78,"g_lvl":"0","r_ic":"","p_ic":"","lf_type":5,"a_ic":"","is_easter_egg":0,"i_sb_rid":0,"a_sb_rid":0,"at":1589814679994}]');
}
function refresh() {//refresh避免直播間聊天斷線
    socket.send('2');
    romsocket.send('2');
}
function flv_start() {//點擊進入直播間後順便開始撥放串流、將按鈕停用並顯示已連線--flv用
    document.getElementById("videoElement").play();
    document.getElementById("connect_btn").innerText = "已連線";
    document.getElementById("chat").innerHTML += '<div class="msg-box-msg my-1 px-2 py-1 rounded-pill text-center" >你進入了直播間~<br>主動打個招呼吧!</div>';
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
function hotWord() { //罐頭訊息loader
    let xhr = new XMLHttpRequest();
    xhr.open('POST', server + 'https://langapi.lv-show.com/v2/hot_word/list');
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
    xhr.send("pfid=" + liver_uid + "&type=1");
    xhr.addEventListener("load", function (evt) {
        let JDATA = JSON.parse(xhr.responseText);
        for (let i = (JDATA.data.list.length - 1); 0 < i; i--) {
            let name = JDATA.data.list[i].name;
            let content = JDATA.data.list[i].content;
            document.getElementById("hotword").innerHTML += `<button type="button" class="btn btn-light" onclick="$('#msg').val('${content}')" style="margin: 2px;border-radius: 30px;">${name}</button>`
        }
    });

}
function connect() {
    connectLive()
    setInterval(refresh, 50000)
    getvideo()
    flv_start()
    hotWord()
    room()
}
function room() {
    var tk = $("#myat").val();
    romsocket = new WebSocket('wss://ctl-q3.lv-show.com/socket.io/?EIO=3&transport=websocket');
    romsocket.addEventListener('open', function (event) {
        romsocket.send('40/control_nsp');
    });
    romsocket.addEventListener('open', function (event) {
        romsocket.send('42/control_nsp,["authentication",{"live_id":"' + live_id + '","anchor_pfid":"' + liver_uid + '","access_token":"' + tk + '","token":"' + tk + '","from":"WEB","client_type":"web","r":0}]');
    });
    romsocket.addEventListener('message', function (event) {
        let msg = event.data;
        msg = JSON.parse(msg.replace("42/control_nsp,", ""));
        try {
            if (msg[1].data.Event == "packet_delay_list_ex") {
                let dalaytime = msg[1].data.list[0].delay;
                document.getElementById("red_time").innerText = dalaytime + "秒";
                console.log("等等有紅包，剩餘時間:" + dalaytime + "秒");
            }
            if(msg[1].data.Event == "sunpacket_create") {
                let stamp = msg[1].data.stamp;
                let sun = 1;//1陽光，0浪花
                let xhr = new XMLHttpRequest();
                xhr.open('POST', server + 'https://langapi.lv-show.com/v2/redpacket/open');
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
                xhr.send(`live_id=${live_id}&f_pfid=0&stamp=${stamp}&is_sun=${sun}`);
                xhr.addEventListener("load", function (evt) {
                    var JDATA = JSON.parse(xhr.responseText);
                    document.body.innerHTML+=`<div class="alert alert-warning alert-dismissible" role="alert" style="position: fixed;bottom: 0;right:0;z-index: 1;">恭喜你搶到了<span id="sunget">${JDATA.data.gold}</span>陽光!!</div>`;
                    $('.alert').fadeOut(5000);
                    $('.alert').alert('close');
                    console.log("搶到了"+JDATA.data.gold+"陽光!");
                });
            }else{} 
        } catch (error) {
            
        } 
    });
}
// function redopen(live_id, stamp, sun) {
//     if (canopen == "y") {
//         let xhr = new XMLHttpRequest();
//         xhr.open('POST', 'https://langapi.lv-show.com/v2/redpacket/open');
//         xhr.setRequestHeader('PLATFORM', 'WEB');
//         xhr.setRequestHeader('LOCALE', 'TW');
//         xhr.setRequestHeader('USER-TOKEN', token);
//         xhr.setRequestHeader('VERSION', '5.0.0.7');
//         xhr.setRequestHeader('API-VERSION', '2.0');
//         xhr.setRequestHeader('USER-UID', uid);
//         xhr.setRequestHeader('DEVICE-ID', devid);
//         xhr.setRequestHeader('USER-MPHONE-OS-VER', '9');
//         xhr.setRequestHeader('VERSION-CODE', '1280');
//         xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
//         xhr.send(`live_id=${live_id}&f_pfid=0&stamp=${stamp}&is_sun=${sun}`);
//         xhr.addEventListener("load", function (evt) {
//             var JDATA = JSON.parse(xhr.responseText);
//             console.log(JDATA.data);
//         });
//     }
// }


window.onload = function () {
    // console.log("window loaded")
    token = getParams("token");//接收來html上的value
    uid = getParams("userid");//接收來html上的value
    live_id = getParams("live_id"); //請更改主播live ID
    liver_uid = getParams("live_uid"); //0524已改為從上方funtion取得，但註解會造成錯誤~請勿註解
    devid = Math.random().toString(36).substr(2, 678) + Date.now().toString(36).substr(4, 585);


    document.getElementById("connect_btn").onclick = connect
    document.getElementById("message_send").onclick = sendmsg

    init()
};