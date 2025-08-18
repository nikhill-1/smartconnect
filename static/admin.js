function admins(){

    let names = document.getElementById("name").value;
    let pass = document.getElementById("password").value;
    if(names == "12345" ){
       if(pass == "admin"){
        open("chatbotadmin.html");
       }
       else{
        window.alert("incorrect password")
       }
    }
    else{
      window.alert("incorrect id or password");
    }
    }
