const express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');
var socketio = require('socket.io');
const home = require("./routes"); // 라우팅
const PORT = 8080;
const webCtrl = require("./ctrl/webController");
const mobileCtrl = require("./ctrl/mobileController");

const app = express();

const privateKey = fs.readFileSync('tradition-store.kro.kr/private.key', 'utf8');
const certificate = fs.readFileSync('tradition-store.kro.kr/certificate.crt', 'utf8');
const ca = fs.readFileSync('tradition-store.kro.kr/ca_bundle.crt', 'utf8');

const credentials = { key: privateKey, cert: certificate, ca : ca};

const servers = http.createServer(credentials, app);

app.use(express.static(__dirname + '/public'));

app.use("/",home);

servers.listen(PORT, function(){
    console.log('Server Running at https://localhost:8080');
})



// 소켓
var io = socketio.listen(servers);
io.sockets.on('connection',function(socket){

    // 로그인요청
    socket.on('loginReq', function(name, id, pw){
        webCtrl.loginReq(name,id,pw,socket);
    });


    // 회원가입 요청
    socket.on('signUpReq', function(marketName, storeName, myCategory, myId, myPw){
        webCtrl.signUpReq(marketName, storeName, myCategory, myId, myPw,socket)
    })


    // 메인화면 init 요청
    socket.on('mainInitReq',function(myMarket,myStore,myCategory){
        webCtrl.mainInitReq(myMarket,myStore,myCategory,socket);
    })


    // 메인화면 상품추가 요청
    socket.on('addProductReq',function(imgurl,name,info,price,imgfile,imgfilename,storePathData){
        webCtrl.addProductReq(imgurl,name,info,price,imgfile,imgfilename,storePathData,socket);
    })


    /* 모바일 */
    // 점포 정보창 초기화
    socket.on('mobileInfoInitReq', function(marketname,category,storeName){
        mobileCtrl.mobileInfoInitReq(marketname,category,storeName,socket);
    })

    // 메뉴창 초기화
    socket.on('mobileMenuInit',function(marketname,category){
        mobileCtrl.mobileMenuInit(marketname,category,socket);
    })
})