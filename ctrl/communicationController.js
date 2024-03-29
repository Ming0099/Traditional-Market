var admin = require("firebase-admin");
var firestore = require("firebase-admin/firestore");
var serviceAccount = require("../vacation2023-2-firebase-adminsdk-guq8c-803226e5b1.json");

const db = firestore.getFirestore();

// 주문요청
function oderReq(market,store,data,price,id,address,io,socket){
    db.collection('유저배달').doc(id).get().then((result)=>{
        // 주문이력 체크
        if(result.data()[store] != undefined){
            socket.emit('orderError', "이미 주문이력이 있습니다.");
            return;
        }
        let today = new Date(); 
        var temp = [];
        var tempstr = "";
        for(let key in data){
            tempstr += key + " " + data[key] + "개<br>";
            temp.push(key + " " + data[key] + "개");
        }
        // 파이어베이스에 배달요청 사항 저장
        db.collection('유저배달').doc(id).update({
            [store] : {
                가격 : price,
                메뉴 : temp,
                주소 : address[0],
                상세주소 : address[1],
                상태 : "배달요청",
                시간 : today,
            }
        }).then(()=>{
            db.collection('점포배달').doc(market+'&'+store).update({
                [id] : {
                    가격 : price,
                    메뉴 : temp,
                    주소 : address[0],
                    상세주소 : address[1],
                    상태 : "배달요청",
                    시간 : today,
                }
            }).then(()=>{ // 저장완료시 점포웹에 전달
                var str = createOrder(id,tempstr,price,today.getTime() / 1000,address,'배달요청');
                    
                socket.emit('orderComplete','주문을 완료했습니다');
                io.sockets.in(market+'&'+store).emit('order', id, str);
            })
        });
    })
}

// 배달요청 취소
function deliveryCancelReq(userID,myMarket,myStore,socket){
    console.log(userID,myMarket,myStore);
    db.collection('유저배달').doc(userID).update({
        [myStore] : firestore.FieldValue.delete()
    }).then(()=>{
        db.collection('점포배달').doc(myMarket+'&'+myStore).update({
            [userID] : firestore.FieldValue.delete()
        }).then(()=>{
            socket.emit('deliveryCancel',userID);
        })
    })
}

// 배달요청 수락
function deliveryOkReq(userID,myMarket,myStore,socket){
    db.collection('유저배달').doc(userID).update({
        [myStore+'.상태'] : '주문접수'
    }).then(()=>{
        db.collection('점포배달').doc(myMarket+'&'+myStore).update({
            [userID+'.상태'] : '주문접수'
        }).then(()=>{
            socket.emit('deliveryOk',userID);
        })
    })
}

function createOrder(id,tempstr,price,date,address,condition){
    var tag = "";
    var okIcon = "";
    var okButtonBackground = "#1A73E8";
    var newDate = new Date(Number(date)*1000);
    var dateStr = (newDate.getMonth()+1) + '월 ' + newDate.getDate() + '일 ' + newDate.getHours() + ':' + newDate.getMinutes();
    switch(condition){
        case '배달요청':
            tag = 'delivery';
            okIcon = '<i class="fa-solid fa-utensils"></i>';
            break;
        case '주문접수':
            tag = 'receipt';
            okIcon = '<i class="fa-solid fa-motorcycle"></i>';
            break;
        case '배달중':
            okButtonBackground = "#0dc7ce";
            tag = 'delivering';
            okIcon = '<i class="fa-solid fa-motorcycle"></i>';
            break;
        case '배달완료':
            tag = 'deliveryComplete';
            okIcon = '<i class="fa-solid fa-motorcycle"></i>';
            break;
    }
    var str = '<div class="deliveryReqMenuBox" id=delivery-'+id+'>'
    +'<div class="deliveryReqInfoBox">'
    +'<span id="deliveryReqId">주문자ID : ' + id + '</span><br>'
    +'<span id="deliveryReqMenu">주문목록</span><br>'
    +'<span id="deliveryReqMenuDetail">' + tempstr + '</span><br>'
    +'<span id="deliveryReqPrice">가격 : ' + price + '원</span><br>'
    +'<span id="deliveryReqDate">주문일시 : ' + dateStr + '</span><br>'
    +'</div>'
    +'<div class="deliveryReqButton">'
    +'<button id="' + tag + 'ReqCancelButton-' + id + '" onclick="deliveryCancel(this.id)"><i class="fa-solid fa-x"></i></button>'
    +'<button id="' + tag + 'ReqAcceptButton-' + id + '" style="background-color: '+okButtonBackground+';" onclick="deliveryOk(this.id)">' + okIcon + '</button>'
    +'</div>'
    +'</div>'
    +'<div class="deliveryReqAddressBox"  id=deliveryAddress-'+id+'>'
    +'<div class="deliveryReqAddressTextBox">'
    +'<span>주소</span>'
    +'</div>'
    +'<div class="deliveryReqAddressInfoBox">'
    +'<div id="deliveryReqAddress">'
    +address[0]
    +'</div>'
    +'<div id="deliveryReqAddress2">'
    +address[1]
    +'</div>'
    +'</div>'
    +'</div>';

    if(condition == '배달중'){
        str = str.replace('<button id="'+tag+'ReqCancelButton-'+id+'" onclick="deliveryCancel(this.id)"><i class="fa-solid fa-x"></i></button>','');
    }else if(condition == '배달완료'){
        str = str.replace('<button id="'+tag+'ReqCancelButton-'+id+'" onclick="deliveryCancel(this.id)"><i class="fa-solid fa-x"></i></button>','')
        str = str.replace('<button id="'+tag+'ReqAcceptButton-'+id+'" style="background-color: #1A73E8;" onclick="deliveryOk(this.id)"><i class="fa-solid fa-motorcycle"></i></button>','')
    }

    return str;
}

function changeHtmlReq(str,before,after,socket){
    const beforeTag = changeTag(before);
    const afterTag = changeTag(after);
    const beforeIcon = changeIcon(before);
    const afterIcon = changeIcon(after);
    const id = str.split('ID : ')[1].split('<')[0];

    str = str.replace(beforeTag+'ReqCancelButton', afterTag+'ReqCancelButton');
    str = str.replace(beforeTag+'ReqAcceptButton', afterTag+'ReqAcceptButton');
    str = str.replace(beforeIcon, afterIcon);

    const topStr = str.split('<div class="deliveryReqAddressTextBox">')[0];
    const bottomStr = '<div class="deliveryReqAddressTextBox">' + str.split('<div class="deliveryReqAddressTextBox">')[1];

    str = '<div class="deliveryReqMenuBox" id=delivery-'+id+'>' + topStr + '</div>' 
    + '<div class="deliveryReqAddressBox" id="deliveryAddress-'+id+'">' + bottomStr + '</div>';

    if(after == '배달중'){
        str = str.replace('<button id="'+afterTag+'ReqCancelButton-'+id+'" onclick="deliveryCancel(this.id)"><i class="fa-solid fa-x" aria-hidden="true"></i></button>','');
        str = str.replace('#1A73E8','#0dc7ce');
    }else if(after == '배달완료'){str = str.replace('<button id="'+afterTag+'ReqCancelButton-'+id+'" onclick="deliveryCancel(this.id)"><i class="fa-solid fa-x" aria-hidden="true"></i></button>','');
        str = str.replace('<button id="'+afterTag+'ReqAcceptButton-'+id+'" style="background-color: #0dc7ce;" onclick="deliveryOk(this.id)"><i class="fa-solid fa-motorcycle" aria-hidden="true"></i></button>','');
    }
    

    socket.emit('changeHtml',str,afterTag);
}

function changeTag(condition){
    switch(condition){
        case '배달요청':
            return 'delivery';
        case '주문접수':
            return 'receipt';
        case '배달중':
            return 'delivering';
        case '배달완료':
            return 'deliveryComplete';
    }
}

function changeIcon(condition){
    switch(condition){
        case '배달요청':
            return '"fa-solid fa-utensils"';
        case '주문접수':
            return '"fa-solid fa-motorcycle"';
        case '배달중':
            return '"fa-solid fa-motorcycle"';
        case '배달완료':
            return '"fa-solid fa-motorcycle"';
    }
}

// 접수완료 -> 배달중
function receiptOkReq(userID, myMarket, myStore, socket){
    db.collection('유저배달').doc(userID).update({
        [myStore+'.상태'] : '배달중'
    }).then(()=>{
        db.collection('점포배달').doc(myMarket+'&'+myStore).update({
            [userID+'.상태'] : '배달중'
        }).then(()=>{
            socket.emit('receiptOk',userID);
        })
    })
}

// 배달중 -> 배달완료
function deliveringOkReq(userID, myMarket, myStore, socket){
    db.collection('점포배달').doc(myMarket+'&'+myStore).update({
        [userID+'.상태'] : '배달완료'
    }).then(()=>{
        socket.emit('deliveringOk',userID);
    })
    db.collection('유저배달').doc(userID).get().then((result)=>{
        var data = result.data()[myStore];
        const sec = Number(data['시간']._seconds);
        
        db.collection('배달완료').doc(userID).update({
            [sec+".가게명"] : myStore,
            [sec+".메뉴"] : data['메뉴'],
            [sec+".가격"] : data['가격'],
        })
        db.collection('유저배달').doc(userID).update({
            [myStore] : firestore.FieldValue.delete()
        })
    })
}

// 리뷰삭제
function deleteReviewReq(userID,myMarket,myStore,myCategory,socket){
    db.collection('전통시장').doc(myMarket).collection(myCategory).doc(myStore).update({
        ['review.'+userID] : firestore.FieldValue.delete()
    }).then(()=>{
        db.collection('유저').doc(userID).update({
            ['review.'+myStore] : firestore.FieldValue.delete()
        }).then(()=>{
            socket.emit('deleteReview',myStore);
        })
        db.collection('전통시장').doc(myMarket).collection(myCategory).doc(myStore).get().then((result)=>{
            var reviewData = result.data()['review'];
            var averageRate = 0;

            for(const key in reviewData){
                averageRate += Number(reviewData[key]['rate']);
            }
    
            if(Object.keys(reviewData).length != 0){
                averageRate /= Object.keys(reviewData).length;
            }

            db.collection('전통시장').doc(myMarket).collection(myCategory).doc(myStore).update({
                rate : averageRate,
            })
        })
    })
}

module.exports = {
    oderReq,
    createOrder,
    deliveryCancelReq,
    deliveryOkReq,
    changeHtmlReq,
    receiptOkReq,
    deliveringOkReq,
    deleteReviewReq,
};