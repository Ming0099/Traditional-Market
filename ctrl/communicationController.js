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
                var str = createOrder(id,tempstr,price,address);
                    
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

function createOrder(id,tempstr,price,address){
    var str = '<div class="deliveryReqMenuBox" id=delivery-'+id+'>'
    +'<div class="deliveryReqInfoBox">'
    +'<span id="deliveryReqId">주문자ID : ' + id + '</span><br>'
    +'<span id="deliveryReqMenu">주문목록</span><br>'
    +'<span id="deliveryReqMenuDetail">' + tempstr + '</span><br>'
    +'<span id="deliveryReqPrice">가격 : ' + price + '원</span><br>'
    +'</div>'
    +'<div class="deliveryReqButton">'
    +'<button id="deliveryReqCancelButton&' + id + '" onclick="deliveryCancel(this.id)"><i class="fa-solid fa-x"></i></button>'
    +'<button id="deliveryReqAcceptButton&' + id + '" style="background-color: #1A73E8;" onclick="deliveryOk(this.id)"><i class="fa-solid fa-utensils"></i></button>'
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

module.exports = {
    oderReq,
    createOrder,
    deliveryCancelReq,
};