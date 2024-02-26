var beforeStoreData = {};

function Gear_shape(){
    saveStoreInfo();
    document.querySelector("div.modal_setting").className = "modal_setting showing";
}

function cancel_Gear(){
    undoStoreInfo();
    document.querySelector("div.modal_setting").className = "modal_setting";
}

function ok_Gear(){ //정보넣어야함 //점포 변경
    var delivery_cash = document.getElementById("delivery_cash");
    var order_min_cash = document.getElementById("order_min_cash");
    var imgfile = document.getElementById("changefile").files[0];
    var start_time = document.getElementById("start_time");
    var end_time = document.getElementById("end_time");
    var best_menu1 = document.getElementById("best1");
    var best_menu2 = document.getElementById("best2");
    var best_menu3 = document.getElementById("best3");
    var bestMenuArray = [];
    var pass = true;
    
    if(delivery_cash.value == "" || order_min_cash.value == "" || start_time.value == "" || end_time.value == ""){
        alert("빈칸을 없이 해주세요.");
    }
    else{ //성공했을시
        if((start_time.value <= 100 && start_time.value >= 0)  && (end_time.value <= 100 && end_time.value >= 0)){
            if(start_time.value < end_time.value){
                if(best_menu1.value == "없음"){
                    if(best_menu2.value == "없음"){
                        if(best_menu3.value != "없음"){
                            bestMenuArray.push(best_menu3.value);
                        }
                    }else{
                        bestMenuArray.push(best_menu2.value);
                        if(best_menu3.value != "없음"){
                            bestMenuArray.push(best_menu3.value);
                            if(best_menu2.value == best_menu3.value){
                                pass = false;
                            }
                        }
                    }
                }else{
                    bestMenuArray.push(best_menu1.value);
                    if(best_menu2.value == "없음"){
                        if(best_menu3.value != "없음"){
                            bestMenuArray.push(best_menu3.value);
                            if(best_menu1.value == best_menu3.value){
                                pass = false;
                            }
                        }
                    }else{
                        bestMenuArray.push(best_menu2.value);
                        if(best_menu3.value != "없음"){
                            bestMenuArray.push(best_menu3.value);
                            if(best_menu1.value == best_menu2.value || best_menu1.value == best_menu3.value || best_menu2.value == best_menu3.value){
                                pass = false;
                            }
                        }else{
                            if(best_menu1.value == best_menu2.value){
                                pass = false;
                            }
                        }
                    }
                }

                if(pass){
                    for(let i=bestMenuArray.length;i<3;i++){
                        bestMenuArray.push('없음');
                    }
                    var storePathData = [myMarket, myCategory, myStore];
                    success(storePathData,delivery_cash, order_min_cash, start_time, end_time, bestMenuArray, imgfile)
                }else{
                    alert("같은 메뉴가 있습니다.");
                }
            }
            else{
                alert("배달시간 입력이 잘못되었습니다.");
            }
        }
        else{
            alert("배달시간은 최소 0분에서 최대 100분까지 설정할 수 있습니다.");
        }
    }
}

function success(storePathData,delivery_cash, order_min_cash, start_time, end_time, bestMenuArray, imgfile){
    //성공시
    socket.emit('storeInfoChange',storePathData,delivery_cash.value, order_min_cash.value, start_time.value, end_time.value, bestMenuArray, imgfile);
}

function handleInput(event) {
    var input = event.target.value;
    var datalistOptions = document.getElementById('list2').options;

    // 입력된 값이 datalist에 있는지 확인하고, datalist에 있는 값으로 갱신
    for (var i = 0; i < datalistOptions.length; i++) {
        if (input === datalistOptions[i].value) {
            event.target.value = input; // 입력된 값이 datalist에 있는 경우, 값을 갱신
            return;
        }
    }

    // 입력된 값이 datalist에 없는 경우, 값을 비움
    event.target.value = '';
}

function saveStoreInfo(){
    beforeStoreData.previewStore = document.getElementById('previewStore').src;
    beforeStoreData.delivery_cash = document.getElementById('delivery_cash').value;
    beforeStoreData.order_min_cash = document.getElementById('order_min_cash').value;
    beforeStoreData.start_time = document.getElementById('start_time').value;
    beforeStoreData.end_time = document.getElementById('end_time').value;
    beforeStoreData.best1 = document.getElementById('best1').value;
    beforeStoreData.best2 = document.getElementById('best2').value;
    beforeStoreData.best3 = document.getElementById('best3').value;
}

function undoStoreInfo(){
    document.getElementById('previewStore').src = beforeStoreData.previewStore;
    document.getElementById('delivery_cash').value = beforeStoreData.delivery_cash;
    document.getElementById('order_min_cash').value = beforeStoreData.order_min_cash;
    document.getElementById('start_time').value = beforeStoreData.start_time;
    document.getElementById('end_time').value = beforeStoreData.end_time;
    document.getElementById('best1').value = beforeStoreData.best1;
    document.getElementById('best2').value = beforeStoreData.best2;
    document.getElementById('best3').value = beforeStoreData.best3;

    $('#changefile').val('');
}

socket.on('storeInfoChangeComplete',function(){
    alert('저장이 완료되었습니다.');
    $('#changefile').val('');
    cancel_Gear();
})