        // Your web app's Firebase configuration
        // For Firebase JS SDK v7.20.0 and later, measurementId is optional
        var firebaseConfig = {
            apiKey: "AIzaSyDSGVLIY4RfidP6QxtfARt68ZmwM9dJ_Fs",
            authDomain: "ispylegon.firebaseapp.com",
            databaseURL: "https://ispylegon-default-rtdb.firebaseio.com",
            projectId: "ispylegon",
            storageBucket: "ispylegon.appspot.com",
            messagingSenderId: "944323424490",
            appId: "1:944323424490:web:2854c227d8b7f8ef926793",
            measurementId: "G-4ZM920STPX"
          };
          // Initialize Firebase
          firebase.initializeApp(firebaseConfig);
          firebase.analytics();

          const messaging = firebase.messaging();

          messaging
            .requestPermission()
            .then(function () {
              //alert("Notification permission granted.");
              console.log("Notification permission granted.");

              return messaging.getToken()
            })
            .then(function(token) {
              // print the token on the HTML page
              //console.log(token);
              
              fetch('https://ispylegon.herokuapp.com/pushtoken/'+token+'/ic')
              
            })
            .catch(function (err) {
            //alert(err);
            console.log("Unable to get permission to notify.", err);
          });

          messaging.onMessage(function(payload) {
            console.log('onMessage:',payload);
          });