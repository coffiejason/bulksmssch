/******************************************
 * My Login
 *
 * Bootstrap 4 Login Page
 *
 * @author          Muhamad Nauval Azhar
 * @uri 			https://nauval.in
 * @copyright       Copyright (c) 2018 Muhamad Nauval Azhar
 * @license         My Login is licensed under the MIT license.
 * @github          https://github.com/nauvalazhar/my-login
 * @version         1.2.0
 *
 * Help me to keep this project alive
 * https://www.buymeacoffee.com/mhdnauvalazhar
 * 
 ******************************************/

'use strict';

var validdd = false;

$(function() {

	// author badge :)
	//var author = '<div style="position: fixed;bottom: 0;right: 20px;background-color: #fff;box-shadow: 0 4px 8px rgba(0,0,0,.05);border-radius: 3px 3px 0 0;font-size: 12px;padding: 5px 10px;">By <a href="https://twitter.com/mhdnauvalazhar">@mhdnauvalazhar</a> &nbsp;&bull;&nbsp; <a href="https://www.buymeacoffee.com/mhdnauvalazhar">Buy me a Coffee</a></div>';
	//$("body").append(author);

	$("input[type='password'][data-eye]").each(function(i) {
		var $this = $(this),
			id = 'eye-password-' + i,
			el = $('#' + id);

		$this.wrap($("<div/>", {
			style: 'position:relative',
			id: id
		}));

		$this.css({
			paddingRight: 60
		});
		$this.after($("<div/>", {
			html: 'Show',
			class: 'btn btn-primary btn-sm',
			id: 'passeye-toggle-'+i,
		}).css({
				position: 'absolute',
				right: 10,
				top: ($this.outerHeight() / 2) - 12,
				padding: '2px 7px',
				fontSize: 12,
				cursor: 'pointer',
		}));

		$this.after($("<input/>", {
			type: 'hidden',
			id: 'passeye-' + i
		}));

		var invalid_feedback = $this.parent().parent().find('.invalid-feedback');

		if(invalid_feedback.length) {
			$this.after(invalid_feedback.clone());
		}

		$this.on("keyup paste", function() {
			$("#passeye-"+i).val($(this).val());
		});
		$("#passeye-toggle-"+i).on("click", function() {
			if($this.hasClass("show")) {
				$this.attr('type', 'password');
				$this.removeClass("show");
				$(this).removeClass("btn-outline-primary");
			}else{
				$this.attr('type', 'text');
				$this.val($("#passeye-"+i).val());				
				$this.addClass("show");
				$(this).addClass("btn-outline-primary");
			}
		});
	});

	$(".my-login-validation").submit(function() {
		var form = $(this);
		event.preventDefault();
        if (form[0].checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
		  
        }
		form.addClass('was-validated');
		validdd = true;
	});
});

function login(){
	var phone = document.getElementById("phone").value;
	var password = document.getElementById("password").value;

	console.log(phone+' '+password);
	/*
	var x = document.getElementById("invalid_credentials");
                if (x.style.display === "block") {
                  x.style.display = "none";
    }*/

	if(phone !== "" && password !== ""){

		var x = document.getElementById("invalid_credentials");
		if (x.style.display === "block") {
		x.style.display = "none";
		}

		var x = document.getElementById("progressbar");
			if (x.style.display === "none") {
			  x.style.display = "block";
		} 
		
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "https://ispylegon.herokuapp.com/userlogin", true);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.responseType = 'json';
	
		xhr.onload  = function() {
		  var jsonResponse = xhr.response;
		  //sessionStorage.setItem("assigned_key", ""+jsonResponse.assigned_key);
		  if(jsonResponse.error){
			var x = document.getElementById("invalid_credentials");
			if (x.style.display === "none") {
			  x.style.display = "block";
			}
	
			var x = document.getElementById("progressbar");
			if (x.style.display === "block") {
			  x.style.display = "none";
			} 
	
		  }
		  else{
	
			sessionStorage.setItem('phone',jsonResponse.phone);
			
			location.href = "usererrands.html";
		  }
		};
	
		xhr.send(JSON.stringify({
			cred: phone,
			password: password
		}));
	}

}

function signup(){
	console.log(validdd);

	var name = document.getElementById("name").value;
				
	var email = document.getElementById("email").value;
		
	var phone = document.getElementById("phone").value;
		
	//var momo = document.getElementById("momo").value;
		
	var password = document.getElementById("password").value;
		
	var agree = document.getElementById("agree").checked;

	if(validdd == true && name !== "" && phone !== "" && email !== "" && password !== "" && agree == true ){

		validdd = false;
		
		var x = document.getElementById("progressbar");
		if (x.style.display === "none") {
		x.style.display = "block";
		}

		var xhr = new XMLHttpRequest();
		xhr.open("POST", "https://ispylegon.herokuapp.com/userregister", true);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.responseType = 'json';

		xhr.onload  = function() {
			var jsonResponse = xhr.response;
			//sessionStorage.setItem("assigned_key", ""+jsonResponse.assigned_key);

			var x = document.getElementById("progressbar");
			if (x.style.display === "block") {
				x.style.display = "none";
			}
			console.log("signup successful");
			location.href = "userlogin.html";
		};

		xhr.send(JSON.stringify({
			name: name,
			phone: phone,
			email: email,
			password: password
		}));
   }
}

function hideAlert(){
	console.log('sdsdsasds')
	var x = document.getElementById("invalid_credentials");
	if (x.style.display === "block") {
	  x.style.display = "none";
	}
}

function forgotpass(){
	var phone = document.getElementById("phone").value;

	fetch('https://ispylegon.herokuapp.com/forgotpassword/'+phone)
        .then(response => response.json())
        .then(data => load(data));
	
	function load(data){
		if(data.status == 'found'){

			var x = document.getElementById("number_notfound");
			if (x.style.display === "block") {
			x.style.display = "none";
			}

			location.href = "reset.html?phone="+phone;
		}
		else if(data.status == 'notfound'){

			var x = document.getElementById("number_notfound");
			if (x.style.display === "none") {
			x.style.display = "block";
			}
		}

	}
}

function resetPassword(){
	var new_password = document.getElementById("new-password").value;

	const urlParams = new URLSearchParams(window.location.search);
	const phone = urlParams.get('phone');

	var xhr = new XMLHttpRequest();
	xhr.open("POST", "https://ispylegon.herokuapp.com/resetPassword", true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.responseType = 'json';

	xhr.onload  = function() {
	  var jsonResponse = xhr.response;
	  alert('Password was changed successfully')
	  location.href = "userlogin.html";
	};

	xhr.send(JSON.stringify({
		phone: phone,
		password: new_password
	}));

}