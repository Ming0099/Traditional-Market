var admin = require("firebase-admin");
var firestore = require("firebase-admin/firestore");
var serviceAccount = require("../vacation2023-2-firebase-adminsdk-guq8c-803226e5b1.json");

const db = firestore.getFirestore();

// 점포 정보창 초기화
function mobileInfoInitReq(marketname,category,storeName,socket){
    db.collection('전통시장').doc(marketname).collection(category).doc(storeName).get().then((result)=>{
        data = result.data();
        
        socket.emit('changeImg','#titleImg',data['imgurl']);
        socket.emit('changeText','#Title',storeName);
        socket.emit('changeText','#tip','배달팁 ' + data['tip'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
        socket.emit('changeText','#minimumAmount','최소주문 ' + data['minamount'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
        socket.emit('changeText','#rate',data['rate']);
        socket.emit('changeText','#reviewcount','리뷰 ' + data['review']['size'] + '개');
        socket.emit('changeText','#timerange',' ' + data['mintime'] + ' ~ ' + data['maxtime'] + '분');

        var str = "";
        for(let i=0; i<data['menu'].length; i++){
            str += '<div class="menuBox">'
                +'<div class="menuinfoBox">'
                    +'<label id="menutitle' + i + '"><b>' + data['menu'][i]['name'] + '</b></label>'
                    +'<br>'
                    +'<label id="menuinfo' + i + '">' + data['menu'][i]['info'] + '</label>'
                    +'<br><br>'
                    +'<label id="menuprice' + i + '"><b>' + data['menu'][i]['price'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원</b></label>'
                    +'<button id=' + i + ' onclick="plus(this.id)"><b>+</b></button>'
                    +'<button id=' + i + ' onclick="minus(this.id)"><b>−</b></button>'
                    +'<input id="count' + i + '" value=0>'
                +'</div>'
                +'<div class="menuimageBox">'
                    +'<img src="' + data['menu'][i]['imgurl'] + '">'
                +'</div>'
            +'</div>';
        }
        socket.emit('cartInit',data['menu'].length);
        socket.emit('infoInit',str);
    });
}

// 메뉴창 초기화
function mobileMenuInit(marketname,category,socket){
    var count = 0;
    var str = "";
    db.collection('전통시장').doc(marketname).collection(category).get().then((result)=>{
        result.forEach((doc)=>{
            
            if(doc.id != 'temp'){
                var myData = doc.data();

                str += '<div class="Box" onclick="clickmenu(this.id)" id=' + doc.id.replace( / /gi, '_') + '>'
                    +'<div class="imageBox">'
                        +'<img src=' + myData.imgurl + '>'
                        +'</div>'
                        +'<div class="textBox">'
                            +'<br>'
                            +'<label id="Title"><b>' + doc.id + '</b></label>'
                            +'<label id="star"><i class="fa-solid fa-star"></i></label>'
                            +'<label id="rate"><b>' + myData.rate + '</b></label>'
                            +'<br><br>'
                            +'<label id="tip">배달팁 ' + myData.tip + '원</label>'
                            +'<br>'
                            +'<label id="minimumAmount">최소주문 ' + myData.minamount + '원</label>'
                            +'<br><br>';
                for(let j=0;j<myData.bestmenu.length;j++){
                    str += '<label id="menu">' + myData.bestmenu[j] + '</label>';
                }
                str +='</div>'
                    +'</div>';
                count++;
            }
        })
    }).then(()=>{
        if(count == 0){
            socket.emit('changeMenu',"");
        }else{
            socket.emit('changeMenu',str);
        }
    })
}

// 모바일 회원가입 요청
function mobileSignUpReq(id, pw, nickname, oftenmarket, address, address2, socket){
    var myRoute = "";
    var errorMessage = "";
    
    var pass = true;
    db.collection('유저').get().then((result)=>{
        result.forEach((doc)=>{
            if(doc.id == id){
                pass = false;
                return;
            }
        })
        if(!pass){
            errorMessage = "id 중복";
            socket.emit('signUp',myRoute,errorMessage);
            return;
        }else{
            db.collection('유저').doc(id).set({
                pw : pw,
                nickname : nickname,
                oftenmarket : oftenmarket,
                address : address,
                address2 : address2,
            }).then(()=>{
                myRoute = "/m/login";
                socket.emit('signUp',myRoute,errorMessage);
            })
            db.collection('유저배달').doc(id).set({});
        }
    });
}

// 모바일 로그인 요청
function mobileLoginReq(id, pw, autologin, socket){
    var myRoute = "";
    var errorMessage = "";

    db.collection('유저').doc(id).get().then((result)=>{
        // id체크
        if(result.data() == undefined){
            errorMessage = "아이디나 비밀번호를 다시 입력해주세요."
            socket.emit('login',myRoute,errorMessage);
            return;
        }
        // pw체크
        if(result.data().pw != pw){
            errorMessage = "아이디나 비밀번호를 다시 입력해주세요."
            socket.emit('login',myRoute,errorMessage);
            return;
        }

        var user = result.data();
        user.id = id;
        myRoute = "/m";

        socket.emit('login',myRoute,errorMessage,JSON.stringify(user),autologin);
        
    })
}

// 마이페이지 수정 요청
function userInfoUpdataReq(id,nick,address,market,socket){
    db.collection('유저').doc(id).update({
        nickname : nick,
        address : address[0],
        address2 : address[1],
        oftenmarket : market,
    }).then(()=>{
        socket.emit('userInfoUpdataRes',"저장이 완료되었습니다.");
    })
}


module.exports = {
    mobileInfoInitReq,
    mobileMenuInit,
    mobileSignUpReq,
    mobileLoginReq,
    userInfoUpdataReq,
};