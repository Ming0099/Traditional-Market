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
        socket.emit('changeText','#reviewcount','리뷰 ' + Object.keys(data['review']).length + '개');
        socket.emit('changeText','#timerange',' ' + data['mintime'] + ' ~ ' + data['maxtime'] + '분');

        var str = "";
        for(const key in data['menu']){
            str += '<div class="menuBox">'
                +'<div class="menuinfoBox">'
                    +'<label id="menutitle-' + key + '"><b>' + key + '</b></label>'
                    +'<br>'
                    +'<label id="menuinfo-' + key + '">' + data['menu'][key]['info'] + '</label>'
                    +'<br><br>'
                    +'<label id="menuprice-' + key + '"><b>' + data['menu'][key]['price'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원</b></label>'
                    +'<button id=plus-' + key + ' onclick="plus(this.id)"><b>+</b></button>'
                    +'<button id=minus-' + key + ' onclick="minus(this.id)"><b>−</b></button>'
                    +'<input id="count-' + key + '" value=0>'
                +'</div>'
                +'<div class="menuimageBox">'
                    +'<img src="' + data['menu'][key]['imgurl'] + '">'
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

// 리뷰페이지 init 요청
function mobileReviewInitReq(storePathData,socket){
    var rateArray = [0,0,0,0,0];

    db.collection('전통시장').doc(storePathData[0]).collection(storePathData[1]).doc(storePathData[2]).get().then((result)=>{
        var reviewData = result.data()['review'];
        var averageRate = result.data()['rate'];

        for(const key in reviewData){
            rateArray[parseInt(reviewData[key].rate)-1]++;
        }
        socket.emit('reviewRateInit',rateArray,averageRate);

        var str = createStar(averageRate);
        socket.emit('starInit',str);

        var reviewListHtml = createList(reviewData);
        socket.emit('reviewListInit',reviewListHtml);
    })
}

// 별 html 생성
function createStar(rate){
    var str = "";
    for(let i=0; i<5; i++){
        if(rate < 1){
            if(rate >= 0.5){
                str += '<i class="fa-solid fa-star-half-stroke"></i>';
            }else{
                str += '<i class="fa-regular fa-star"></i>';
            }
        }else{
            str += '<i class="fa-solid fa-star"></i>';
        }
        rate -= 1;
    }
    return str;
}

// 리뷰리스트 html 생성
function createList(obj){
    var str = "";
    for(const key in obj){
        str += '<div class ="reviewMargin">'
            + '<div class="reviewSeeName">' + obj[key].name + '</div>'
            + '<div class="reviewSeeRate">' + createStar(obj[key].rate) + '</div>'
            + '<div class="reviewSeeReview">' + obj[key].text + '</div>'
        + '</div>'
    }
    return str;
}

// 리뷰 작성 완료
function writeComplete(storePathData,userData,score,text,socket){

    db.collection('전통시장').doc(storePathData[0]).collection(storePathData[1]).doc(storePathData[2]).get().then((result)=>{
        var data = result.data();
        var reviewData = data['review'];

        if(reviewData[userData.id] != undefined){
            socket.emit('duplication','이미 리뷰 이력이 있습니다. 수정하시겠습니까?');
            return;
        }

        var averageRate = 0;
        for(const key in reviewData){
            averageRate += Number(reviewData[key]['rate']);
        }
        averageRate += Number(score);

        averageRate /= Object.keys(reviewData).length;


        db.collection('전통시장').doc(storePathData[0]).collection(storePathData[1]).doc(storePathData[2]).update({
            rate : averageRate,
            ['review.'+userData.id] : {
                name : userData.nickname,
                rate : score,
                text : text,
            }
        }).then(()=>{
            socket.emit('complete','리뷰 작성이 완료되었습니다.');
        })
    })
}

// 리뷰 수정
function correction(storePathData,userData,score,text,socket){
    db.collection('전통시장').doc(storePathData[0]).collection(storePathData[1]).doc(storePathData[2]).get().then((result)=>{
        var data = result.data();
        var reviewData = data['review'];

        var averageRate = 0;
        for(const key in reviewData){
            if(key != userData.id){
                averageRate += Number(reviewData[key]['rate']);
            }
        }
        averageRate += Number(score);

        averageRate /= Object.keys(reviewData).length;


        db.collection('전통시장').doc(storePathData[0]).collection(storePathData[1]).doc(storePathData[2]).update({
            rate : averageRate,
            ['review.'+userData.id] : {
                name : userData.nickname,
                rate : score,
                text : text,
            }
        }).then(()=>{
            socket.emit('complete','리뷰 수정이 완료되었습니다.');
        })
    })
}

module.exports = {
    mobileInfoInitReq,
    mobileMenuInit,
    mobileSignUpReq,
    mobileLoginReq,
    userInfoUpdataReq,
    mobileReviewInitReq,
    writeComplete,
    correction,
};