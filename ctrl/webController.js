var admin = require("firebase-admin");
var firestore = require("firebase-admin/firestore");
var serviceAccount = require("../vacation2023-2-firebase-adminsdk-guq8c-803226e5b1.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket : 'vacation2023-2.appspot.com'
});
const db = firestore.getFirestore();

const communicationCtrl = require("./communicationController");

// 로그인요청
function loginReq(name, id, pw, socket){
    console.log("점포 :", name,"login");
    
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
    
}

// 회원가입 요청
function signUpReq(marketName, storeName, myCategory, myId, myPw, socket){
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
            menu : {},
            minamount : 0,
            rate : 0,
            review : {},
            tip : 0,
        }).then(()=>{ // 점포 등록 완료시
            myRoute = '/';
            socket.emit('signUp',myRoute,errorMessage);
        });
        db.collection('점포배달').doc(marketName+'&'+storeName).set({});
    });
}

// 메인화면 init 요청
function mainInitReq(myMarket,myStore,myCategory,socket){
    var myData = "";
    var errorMessage = "";

    try{
        db.collection('전통시장').doc(myMarket).collection(myCategory).doc(myStore).get().then((result)=>{
            var str = "";
            var myMenuData = result.data()['menu'];
            for(const key in myMenuData){
                str += createmenu(myMenuData[key]['imgurl'],key,myMenuData[key]['info'],myMenuData[key]['price']);
            }
            myData = str;
            socket.emit('mainInit',myData,errorMessage);
        })
    }
    catch(e){
        errorMessage = "error";
        socket.emit('mainInit',myData,errorMessage);
    }
}

// 배달요청 init 요청
function deliveryInitReq(myMarket,myStore,myCategory,socket){
    db.collection('점포배달').doc(myMarket+'&'+myStore).get().then((result)=>{
        
        var data = result.data();
        var deliveryData;
        var str = "";
        var tempstr = "";
        for(const key in data){
            deliveryData = data[key];
            for(let j=0; j<deliveryData['메뉴'].length; j++){
                tempstr += deliveryData['메뉴'][j] + "<br>";
            }
            var address = [deliveryData['주소'],deliveryData['상세주소']];

            str += communicationCtrl.createOrder(key,tempstr,deliveryData['가격'],address);
        }
        socket.emit('deliveryInit',str);
    })
}

// 메인화면 상품추가 요청
function addProductReq(imgurl,name,info,price,imgfile,imgfilename,storePathData,socket){
    var myData = "";
    var errorMessage = "";

    myData = createmenu(imgurl,name,info,price);

    const storage = admin.storage();
    
    async function uploadFromMemory() {
            await storage.bucket('vacation2023-2.appspot.com').file(storePathData[0]+'/'+storePathData[2]+'/'+ name + '.jpg').save(imgfile);

            const fileRef = storage.bucket('vacation2023-2.appspot.com').file(storePathData[0]+'/'+storePathData[2]+'/'+ name + '.jpg');
            
            return fileRef.getSignedUrl({
                action: 'read',
                expires: '03-09-2491'
            }).then(signedUrls => {
                db.collection('전통시장').doc(storePathData[0]).collection(storePathData[1]).doc(storePathData[2]).update({
                    "menu" : {
                        [name] :{
                            imgurl : signedUrls[0],
                            info : info,
                            price : price
                        }
                    }
                    
                }).then(()=>{
                    socket.emit('addProduct',myData,errorMessage);
                });
            });
    }
    
    uploadFromMemory()
}

// 메뉴 생성
function createmenu(imgurl, name, info, price){
    var str = "";
    str += '<div class="menu">'
                + '<div class="menuimg">'
                    + '<img src="' + imgurl + '">'
                + '</div>'
                + '<div class="menuinfo">'
                    + '<span>메뉴명 : ' + name + '<br>설명 : ' + info + '<br>가격 : ' + price + '</span>'
                + '</div>'
                + '<div class="delete">'
                    + '<button id=delete-'+name+' onclick="deleteMenu(this.id)"><i class="fa-solid fa-trash-can"></i></button>'
                + '</div>'
            + '</div>'
    return str;
}

// 메인화면 상품삭제 요청
function deleteProductReq(storePathData,menuName,socket){
    const storage = admin.storage();
    // 스토리지에서 메뉴 사진 삭제
    storage.bucket('vacation2023-2.appspot.com').file(storePathData[0]+'/'+storePathData[2]+'/'+menuName+'.jpg').delete();

    // 파이어스토어에서 메뉴 정보 삭제
    db.collection('전통시장').doc(storePathData[0]).collection(storePathData[1]).doc(storePathData[2]).update({
        ["menu."+[menuName]] : firestore.FieldValue.delete()
    }).then(()=>{
        socket.emit('deleteProduct','삭제가 완료되었습니다.');
    });
}

module.exports = {
    loginReq,
    signUpReq,
    mainInitReq,
    addProductReq,
    deleteProductReq,
    deliveryInitReq,
};