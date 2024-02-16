var admin = require("firebase-admin");
var firestore = require("firebase-admin/firestore");
var serviceAccount = require("../vacation2023-2-firebase-adminsdk-guq8c-803226e5b1.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket : 'vacation2023-2.appspot.com'
});
const db = firestore.getFirestore();

// 로그인요청
function loginReq(name, id, pw, socket){
    console.log(name,id,pw);
    
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
        console.log(myRoute,errorMessage);
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
}

// 메인화면 init 요청
function mainInitReq(myMarket,myStore,myCategory,socket){
    var myData = "";
    var errorMessage = "";

    try{
        db.collection('전통시장').doc(myMarket).collection(myCategory).doc(myStore).get().then((result)=>{
            var str = "";
            var myMenuData = result.data()['menu'];
            for(let i=0;i<myMenuData.length;i++){
                str += createmenu(myMenuData[i]['imgurl'],myMenuData[i]['name'],myMenuData[i]['info'],myMenuData[i]['price']);
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

// 메인화면 상품추가 요청
function addProductReq(imgurl,name,info,price,imgfile,imgfilename,storePathData,socket){
    var myData = "";
    var errorMessage = "";

    myData = createmenu(imgurl,name,info,price);

    const storage = admin.storage();
    
    async function uploadFromMemory() {
            await storage.bucket('vacation2023-2.appspot.com').file(imgfilename).save(imgfile);

            const fileRef = storage.bucket('vacation2023-2.appspot.com').file(imgfilename);
            
            return fileRef.getSignedUrl({
                action: 'read',
                expires: '03-09-2491'
            }).then(signedUrls => {
                db.collection('전통시장').doc(storePathData[0]).collection(storePathData[1]).doc(storePathData[2]).update({
                    menu : admin.firestore.FieldValue.arrayUnion({
                        imgurl : [signedUrls[0]],
                        name : [name],
                        info : [info],
                        price : [price]
                    })
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
                    + '<button><i class="fa-solid fa-trash-can"></i></button>'
                + '</div>'
            + '</div>'
    return str;
}

module.exports = {
    loginReq,
    signUpReq,
    mainInitReq,
    addProductReq,
};