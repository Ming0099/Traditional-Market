const express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');
var socketio = require('socket.io');
var admin = require("firebase-admin");
var firestore = require("firebase-admin/firestore");

var serviceAccount = require("./vacation2023-2-firebase-adminsdk-guq8c-803226e5b1.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
/*
const db = firestore.getFirestore();
db.collection('점포').doc('삼방시장').get().then((result)=>{
    console.log(result.data());
});*/

const app = express();

const privateKey = fs.readFileSync('tradition-store.kro.kr/private.key', 'utf8');
const certificate = fs.readFileSync('tradition-store.kro.kr/certificate.crt', 'utf8');
const ca = fs.readFileSync('tradition-store.kro.kr/ca_bundle.crt', 'utf8');

const credentials = { key: privateKey, cert: certificate, ca : ca};

const servers = http.createServer(credentials, app);

app.use(express.static(__dirname + '/public'));

// 루트
app.get('/',function(req, res){
    res.sendFile(__dirname + '/public/login.html');
})

app.get('/main',function(req, res){
    res.sendFile(__dirname + '/public/main.html');
})

// 회원가입
app.get('/register',function(req, res){
    res.sendFile(__dirname + '/public/register.html');
})

/* 추후 웹뷰앱으로 전환 */
// 모바일 루트
app.get('/m',function(req, res){
    res.sendFile(__dirname + '/public/m/main.html');
})

// 모바일 메뉴
app.get('/m/menu',function(req,res){
    res.sendFile(__dirname + '/public/m/menu.html');
})

// 모바일 로그인
app.get('/m/login',function(req,res){
    res.sendFile(__dirname+'/public/m/login.html');
})

// 모바일 회원가입
app.get('/m/register', (req, res) => {
    res.sendFile(__dirname+'/public/m/register.html');
});

// 모바일 상세정보
app.get('/m/info',function(req,res){
    res.sendFile(__dirname + '/public/m/info.html');
})

servers.listen(8080, function(){
    console.log('Server Running at https://localhost:8080');
})

// 소켓
var io = socketio.listen(servers);
io.sockets.on('connection',function(socket){

    // 로그인요청
    socket.on('loginReq', function(name, id, pw){

        var message = "";
        var errorMessage = "";
        
        const db = firestore.getFirestore();

        db.collection('점포').doc(name).get().then((result)=>{
            if(result.data()[id] == undefined){
                errorMessage = "등록되지 않은 점포입니다.";
            }else{
                if(result.data()[id]['pw'] == pw){
                    message = "/main?market=" + name + "&name=" + result.data()[id]['name'].replace( / /gi, '_')
                        + "&category=" + result.data()[id]['category'];
                }else{
                    errorMessage = "등록되지 않은 점포입니다.";
                }
            }
            socket.emit('login',message,errorMessage);
        })
    })

    socket.on('changemenu',function(data){
        socket.emit('selectmenu',data, alldata);
    })
})