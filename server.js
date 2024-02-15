const express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');
var socketio = require('socket.io');
const home = require("./routes"); // 라우팅
const PORT = 8080;

var admin = require("firebase-admin");
var firestore = require("firebase-admin/firestore");
var serviceAccount = require("./vacation2023-2-firebase-adminsdk-guq8c-803226e5b1.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = firestore.getFirestore();

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
        var myRoute = "";
        var errorMessage = "";

        db.collection('점포').doc(name).get().then((result)=>{
            if(result.data()[id] == undefined){
                errorMessage = "등록되지 않은 점포입니다.";
            }else{
                if(result.data()[id]['pw'] == pw){
                    myRoute = "/main?market=" + name + "&name=" + result.data()[id]['name'].replace( / /gi, '_')
                        + "&category=" + result.data()[id]['category'];
                }else{
                    errorMessage = "등록되지 않은 점포입니다.";
                }
            }
            socket.emit('login',myRoute,errorMessage);
        })
    })

    // 회원가입 요청
    socket.on('signUpReq', function(marketName, storeName, myCategory, myId, myPw){
        var myRoute = "";
        var errorMessage = "";
            
        db.collection('점포').doc(marketName).get().then((result)=>{
            // id 중복 체크
            if(result.data()[myId] != undefined){
                errorMessage = "이미 등록된 아이디입니다.";
                socket.emit('signUp',myRoute,errorMessage);
                return;
            }

            // 점포 이름 중복 체크
            for(let i=0;i<Object.keys(result.data()).length;i++){
                if(result.data()[Object.keys(result.data())[i]]['name'] == storeName){
                    errorMessage = "이미 등록된 점포입니다.";
                    socket.emit('signUp',myRoute,errorMessage);
                    return;
                }
            }

            db.collection('점포').doc(marketName).update({
                [myId] : {
                    name : storeName,
                    pw : myPw,
                    category : myCategory,
                }
            });
            db.collection('전통시장').doc(marketName).collection(myCategory).doc(storeName).set({
                bestmenu : ['','',''],
                imgurl : "",
                maxtime : 0,
                mintime : 0,
                menu : [],
                minamount : 0,
                rate : 0,
                review : {
                    size : 0,
                },
                tip : 0,
            }).then(()=>{ // 점포 등록 완료시
                myRoute = '/';
                socket.emit('signUp',myRoute,errorMessage);
            });
        });
    })

    socket.on('changemenu',function(data){
        socket.emit('selectmenu',data, alldata);
    })
})