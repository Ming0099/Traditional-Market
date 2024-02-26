const express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');
var socketio = require('socket.io');
const home = require("./routes"); // 라우팅
const PORT = 8080;
const webCtrl = require("./ctrl/webController");
const mobileCtrl = require("./ctrl/mobileController");
const communicationCtrl = require("./ctrl/communicationController");

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

    // 메인화면 상품삭제 요청
    socket.on('deleteProductReq',function(storePathData,menuName){
        webCtrl.deleteProductReq(storePathData,menuName,socket);
    })

    // 배달요청 init 요청
    socket.on('otherInitReq',function(myMarket,myStore,myCategory){
        webCtrl.otherInitReq(myMarket,myStore,myCategory,socket);
    })

    // 정보 변경 팝업창 init 요청
    socket.on('popupInitReq',function(myMarket, myStore, myCategory){
        webCtrl.popupInitReq(myMarket, myStore, myCategory,socket);
    })

    // 정보 변경 요청
    socket.on('storeInfoChange',function(storePathData,delivery_cash, order_min_cash, start_time, end_time, bestMenuArray, imgfile){
        webCtrl.storeInfoChange(storePathData,delivery_cash, order_min_cash, start_time, end_time, bestMenuArray, imgfile,socket);
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

    // 모바일 회원가입 요청
    socket.on('mobileSignUpReq',function(id, pw, nickname, oftenmarket, address, address2){
        mobileCtrl.mobileSignUpReq(id, pw, nickname, oftenmarket, address, address2, socket);
    })

    // 모바일 로그인 요청
    socket.on('mobileLoginReq',function(id,pw,autologin){
        mobileCtrl.mobileLoginReq(id,pw,autologin,socket);
    })

    // 마이페이지 정보수정 요청
    socket.on('userInfoUpdataReq',function(id,nick,address,market){
        mobileCtrl.userInfoUpdataReq(id,nick,address,market,socket);
    })

    // 점포 온라인 상태확인 요청
    socket.on('onlineCheckReq',function(market,store){
        var temp = io.sockets.adapter.rooms[market+'&'+store];
        if(temp == undefined){ // 오프라인
            socket.emit('onlineCheck',false);
        }else{ // 온라인
            socket.emit('onlineCheck',true);
        }
    })

    // 모바일 리뷰 페이지 init요청
    socket.on('reviewInitReq',function(storePathData){
        mobileCtrl.mobileReviewInitReq(storePathData,socket);
    })

    // 모바일 리뷰 작성 완료
    socket.on('writeComplete',function(storePathData,userData,score,text){
        mobileCtrl.writeComplete(storePathData,userData,score,text,socket);
    })

    // 모바일 리뷰 수정
    socket.on('correction',function(storePathData, userData, score, text){
        mobileCtrl.correction(storePathData, userData, score, text,socket);
    })

    // 배달현황 init
    socket.on('mobileDeliveryInit',function(userData){
        mobileCtrl.mobileDeliveryInit(userData,socket);
    })


    /* 통신 */
    // 점포 방 참가
    socket.on('join',function(market, store){
        socket.join(market+'&'+store);
    })

    // 주문하기(send)
    socket.on('order',function(market,store,data,price,id,address){
        communicationCtrl.oderReq(market,store,data,price,id,address,io,socket);
    })

    // 배달요청 취소
    socket.on('deliveryCancelReq',function(userID,myMarket,myStore){
        communicationCtrl.deliveryCancelReq(userID,myMarket,myStore,socket);
    })

    // 배달요청 수락
    socket.on('deliveryOkReq',function(userID,myMarket,myStore){
        communicationCtrl.deliveryOkReq(userID,myMarket,myStore,socket);
    })



    // html 변환
    socket.on('changeHtmlReq',function(str,before,after){
        communicationCtrl.changeHtmlReq(str,before,after,socket);
    })
})

