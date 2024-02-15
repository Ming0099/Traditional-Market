const express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');
var socketio = require('socket.io');
var admin = require("firebase-admin");
var firestore = require("firebase-admin/firestore");
const home = require("./routes"); // 라우팅
const PORT = 8080;

var serviceAccount = require("./vacation2023-2-firebase-adminsdk-guq8c-803226e5b1.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

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