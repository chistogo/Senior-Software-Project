/**
 * Created by Chris on 1/25/2017.
 * The purpose of this script is to make the menus on the Web Page interactive
 */


function hide(name){
    var menu = document.getElementById(name);
    menu.style.display = "none";
}

function show(name){
    var menu = document.getElementById(name);
    menu.style.display = "block";
}

function getCookie(key) {
    key = key+'='
    var records = document.cookie.split('; ');
    for (var i = 0; i<records.length ;i++){
        //Check to see if it is even possible to be the key
        if(records[i].length>=key.length){
            if(records[i].substr(0,key.length) === key){
                return records[i].substr(key.length)
            }
        }
    }
}

function setCookie(key , value , expiration) {

    //Note this cookie is deleted when window is closed
    if(expiration === null){
        document.cookie = key+"="+value+";path=/"
    }else{
        document.cookie = key+"="+value+"; expires="+expiration+"; path=/"
    }

}


// Handle Input ============================================================

$( "#join-form" ).submit(function( event ) {
    console.log("Attempting Ajax Request");
    $.ajax(
        {
            url : "join",
            type: "POST",
            data : $("#join-form").serializeArray(),
            success:function(data, textStatus, jqXHR)
            {
                //data: return data from server
                console.log(data);
                try {
                    data = JSON.parse(data);
                } catch (e) {
                }

                if(data.status){
                    setCookie("name",$("#join-form").serializeArray()[0]['value'])
                    setCookie("uuid",data.message)
                    window.location = "/controller?r="+$("#join-form").serializeArray()[1]['value'];

                }else{
                    alert("Error: "+data.message);
                }



            },
            error: function(jqXHR, textStatus, errorThrown)
            {
                //if fails
                console.log("ERROR: Ajax call failed");
            }
        });

    event.preventDefault();
    return false;
});

function createGame(gameID){

    $.ajax(
        {
            url : "create",
            type: "POST",
            //'foo='+ bar+'&calibri='+ nolibri,
            data : 'gameID='+gameID,
            success:function(data, textStatus, jqXHR)
            {
                //data: return data from server
                console.log(data);
                console.log(gameID);

                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.log(e);
                    return;
                }


                if(data.status){
                    setCookie("uuid",data.uuid);
                    window.location = "/game?r="+data.roomid;

                }else{
                    alert("Error: "+data.message);
                }



            },
            error: function(jqXHR, textStatus, errorThrown)
            {
                //if fails
                console.log("ERROR: Ajax call failed");
            }
        });
}

// End Handle Input ========================================================
