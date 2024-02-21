var admin = require("firebase-admin");
var firestore = require("firebase-admin/firestore");
var serviceAccount = require("../vacation2023-2-firebase-adminsdk-guq8c-803226e5b1.json");

const db = firestore.getFirestore();

// 주문요청
function oderReq(market,store,data,price,id,address,io){
    let today = new Date(); 
    var temp = [];
    var tempstr = "";
    for(let key in data){
        tempstr += key + " " + data[key] + "개<br>";
        temp.push(key + " " + data[key] + "개");
    }
    // 파이어베이스에 배달요청 사항 저장
    db.collection('배달').doc(id).set({
        [store] : {
            가격 : price,
            메뉴 : temp,
            상태 : "배달요청",
            시간 : today,
        }
    }).then(()=>{ // 저장완료시 점포웹에 전달
        var str = "";
        str += '<div class="deliveryReqMenuBox">'
            +'<div class="deliveryReqInfoBox">'
            +'<span id="deliveryReqId">주문자ID : ' + id + '</span><br>'
            +'<span id="deliveryReqMenu">주문목록</span><br>'
            +'<span id="deliveryReqMenuDetail">' + tempstr + '</span><br>'
            +'<span id="deliveryReqPrice">가격 : ' + price + '원</span><br>'
            +'</div>'
            +'<div class="deliveryReqButton">'
            +'<button id="deliveryReqCancelButton"><i class="fa-solid fa-x"></i></button>'
            +'<button id="deliveryReqAcceptButton"><i class="fa-solid fa-utensils"></i></button>'
            +'</div>'
            +'</div>'
            +'<div class="deliveryReqAddressBox">'
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
        
        io.sockets.in(market+'&'+store).emit('order',id,str);
    });
}

module.exports = {
    oderReq,
};