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
                var imgurl = myData.imgurl;
                if(imgurl == ""){
                    imgurl = "image/none.jpg"
                }

                str += '<div class="Box" onclick="clickmenu(this.id)" id=' + doc.id.replace( / /gi, '_') + '>'
                    +'<div class="imageBox">'
                        +'<img src=' + imgurl + '>'
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
            db.collection('유저').doc(userData.id).update({
                ['review.'+storePathData[2]] : {
                    rate : score,
                    text : text,
                    market : storePathData[0],
                    category : storePathData[1],
                }
            })
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
            db.collection('유저').doc(userData.id).update({
                ['review.'+storePathData[2]] : {
                    rate : score,
                    text : text,
                    market : storePathData[0],
                    category : storePathData[1],
                }
            })
            socket.emit('complete','리뷰 수정이 완료되었습니다.');
        })
    })
}

// 배달현황 init
function mobileDeliveryInit(userData,socket){
    db.collection('유저배달').doc(userData['id']).get().then((result)=>{
        const data = result.data();
        var str = "";
        var progressVal = 0;
        var menuStr = "";
        var elapsedTime =  "";

        for(const key in data){
            menuStr = createDeliveryMenu(data[key]['메뉴']);
            progressVal = changeProgressValue(data[key]['상태']);
            elapsedTime = getElapsedTime(data[key]['시간'],new Date());
            str += '<div class="deliverystate1">'
                + '<span class="textview1"><b>'+data[key]['상태']+'</b></span> '
                + '<div class="textcontainer1">'
                + '<span><b>'+key+'</b></span>'
                + '<span style="font-size:14px;">'+menuStr+'</span>'
                + '<span style="font-size:14px;">'+elapsedTime+'분 전'+'</span>'
                + '</div>'
                + '<div class = "progressbar">'
                + '<progress value="'+progressVal+'" max="100" id="pb"></progress>'
                + '<div class="labels">'
                + '<div class="label">배달요청</div>'
                + '<div class="label">주문접수</div>'
                + '<div class="label">배달중</div>'
                + '<div class="label">배달완료</div>'
                + '</div>'
                + '</div>'
                + '</div>'
                + '<div class="Block"></div>';
        }
        socket.emit('deliveryInit', str);
    })
}

// 구매내역 init
function purchaseInitReq(userID, socket){
    db.collection('배달완료').doc(userID).get().then((result)=>{
        var data = result.data();

        str = "";
        for(const key in data){
            str += createPurchaseHtml(key, data[key]['가게명'], data[key]['가격'], data[key]['메뉴']);
        }

        socket.emit('purchaseInit', str);
    })
}

function createPurchaseHtml(time, store, price, menuArray){
    var menuStr = "";
    for(let i=0; i<menuArray.length; i++){
        menuStr += menuArray[i] + ', ';
    }
    menuStr = menuStr.slice(0,-2)
    var newDate = new Date(Number(time)*1000);
    var hour = '';
    var min = '';
    if(newDate.getHours() < 10){
        hour = '0' + newDate.getHours();
    }else{
        hour = newDate.getHours();
    }
    if(newDate.getMinutes() < 10){
        min = '0' + newDate.getMinutes();
    }else{
        min = newDate.getMinutes();
    }
    var dateStr = newDate.getFullYear() + '년 ' + (newDate.getMonth()+1) + '월 ' + newDate.getDate() + '일 ' + hour + ':' + min;

    var str = '';
        str += '<div class="purchasestate">'
        + '<div class="state"><b>배달 완료</b></div>'
        + '<div class="storename">'+store+'</div>'
        + '<div class="menu">'+menuStr+'</div>'
        + '<div class="time">주문일시 : '+dateStr+'</div>'
        + '</div>'
        + '<div class="Block"></div>'

    return str;
}

// 작성한리뷰 init
function my_reviewInitReq(userID, socket){
    db.collection('유저').doc(userID).get().then((result)=>{
        var str = "";
        var data = result.data()['review'];
        var storePathData = [];

        for(const key in data){
            storePathData.push(data[key]['market']);
            storePathData.push(data[key]['category']);
            storePathData.push(key);
            str += createMyreviewHtml(storePathData,data[key]['rate'],data[key]['text']);
            storePathData = [];
        }

        socket.emit('my_reviewInit',str);
    })
}

function createMyreviewHtml(storePathData, rate, text){
    var starStr = createStar(Number(rate));
    var buttonID = storePathData[0] + '-' + storePathData[1] + '-' + storePathData[2];
    var str = "";
    str += '<div class="reviewInfoBox">'
        + '<div class="InfoBox">'
        + '<span id="title">'+storePathData[2]+'<button id="'+buttonID+'" onclick="deleteReview(this.id)"><i class="fa-solid fa-trash-can"></i></button></span>'
        + '<span id="star">'+starStr+'</span>'
        + '<span id="text">'+text+'</span>'
        + '</div>'
        + '</div>'
    return str;
}

function changeProgressValue(state){
    switch(state){
        case '배달요청':
            return 0;
        case '주문접수':
            return 33;
        case '배달중':
            return 66;
        case '배달완료':
            return 100;
    }
}

function createDeliveryMenu(menu){
    var str = "";
    for(let i=0 ;i<menu.length;i++){
        str += menu[i] + ', ';
    }
    return str.slice(0,-2);
}

function getElapsedTime(before,after){
    const beforeSec = before._seconds;
    const afterSec = Math.floor(after.getTime() / 1000);
    const diffSec = afterSec - beforeSec;
    const diffMin = Math.floor(diffSec / 60);

    return diffMin;
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
    mobileDeliveryInit,
    purchaseInitReq,
    my_reviewInitReq,
};