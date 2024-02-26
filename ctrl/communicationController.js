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
                var str = createOrder(id,tempstr,price,address,'배달요청');
                    
                socket.emit('orderComplete','주문을 완료했습니다');
                io.sockets.in(market+'&'+store).emit('order', id, str);
            })
        });
    })
}

// 배달요청 취소
function deliveryCancelReq(userID,myMarket,myStore,socket){
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

function createOrder(id,tempstr,price,address,condition){
    var tag = "";
    var okIcon = "";
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
            tag = 'delivering';
            okIcon = '';
            break;
        case '배달완료':
            tag = 'deliveryComplete';
            okIcon = '';
            break;
    }
    var str = '<div class="deliveryReqMenuBox" id=delivery-'+id+'>'
    +'<div class="deliveryReqInfoBox">'
    +'<span id="deliveryReqId">주문자ID : ' + id + '</span><br>'
    +'<span id="deliveryReqMenu">주문목록</span><br>'
    +'<span id="deliveryReqMenuDetail">' + tempstr + '</span><br>'
    +'<span id="deliveryReqPrice">가격 : ' + price + '원</span><br>'
    +'</div>'
    +'<div class="deliveryReqButton">'
    +'<button id="' + tag + 'ReqCancelButton&' + id + '" onclick="deliveryCancel(this.id)"><i class="fa-solid fa-x"></i></button>'
    +'<button id="' + tag + 'ReqAcceptButton&' + id + '" style="background-color: #1A73E8;" onclick="deliveryOk(this.id)">' + okIcon + '</button>'
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
            return '';
        case '배달완료':
            return '';
    }
}

module.exports = {
    oderReq,
    createOrder,
    deliveryCancelReq,
    deliveryOkReq,
    changeHtmlReq,
};