function Gear_shape(){
    document.querySelector("div.modal_setting").className = "modal_setting showing";
}

function cancel_Gear(){
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
    if(delivery_cash.value == "" || order_min_cash.value == "" || start_time.value == "" || end_time.value == ""){
        alert("빈칸을 없이 해주세요.");
    }
    else{ //성공했을시
        if((start_time.value <= 60 && start_time.value >= 0)  && (end_time.value <= 60 && end_time.value >= 0)){
            if(start_time.value < end_time.value){
                if((best_menu1.value != best_menu2.value) && (best_menu1.value != best_menu3.value)){
                    if(best_menu2.value != best_menu3.value){ //성공 했을시
                        //입력정보
                        success(delivery_cash, order_min_cash, start_time, end_time, best_menu1, best_menu2, best_menu3, imgfile);
                        cancel_Gear();
                        alert("성공!!!")
                    }
                    else if(best_menu2.value == ""){
                        //입력정보
                        success(delivery_cash, order_min_cash, start_time, end_time, best_menu1, best_menu2, best_menu3, imgfile);
                        cancel_Gear();
                        alert("성공!!!")
                    }
                    else{
                        alert("같은 메뉴가 있습니다.");
                    }
                }
                else if(best_menu1.value == ""){
                    if(best_menu2.value != best_menu3.value){ //성공 했을시
                        //입력정보
                        success(delivery_cash, order_min_cash, start_time, end_time, best_menu1, best_menu2, best_menu3, imgfile);
                        cancel_Gear();
                        alert("성공!!!")
                    }
                    else if(best_menu2.value == ""){
                        //입력정보
                        success(delivery_cash, order_min_cash, start_time, end_time, best_menu1, best_menu2, best_menu3, imgfile);
                        cancel_Gear();
                        alert("성공!!!")
                    }
                    else{
                        alert("같은 메뉴가 있습니다.");
                    }
                }
                else{
                    alert("같은 메뉴가 있습니다.");
                }
            }
            else{
                alert("시작 시간이 끝시간 보나 낮아야합니다.");
            }
        }
        else{
            alert("시간을 다시 설정해주세요.");
        }
    }
}

function success(delivery_cash, order_min_cash, start_time, end_time, best_menu1, best_menu2, best_menu3, imgfile){
    //성공시
    delivery_cash.value = "";
    order_min_cash.value = "";
    start_time.value = "";
    end_time.value = "";
    best_menu1.value = "";
    best_menu2.value = "";
    best_menu3.value = "";
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