require("prismjs/themes/prism-coy.css")
require("prismjs/plugins/line-numbers/prism-line-numbers.css")
require("./src/vendor/css/code.css")
import firebase from "firebase/app"
import "firebase/analytics"

export const onClientEntry = () => {
  const config = {
    apiKey: "AIzaSyDZXgHwQwnhGub0C_MbAQ5aYKgSNgR15wE",
    authDomain: "blogojisanio.firebaseapp.com",
    databaseURL: "https://blogojisanio.firebaseio.com",
    projectId: "blogojisanio",
    storageBucket: "blogojisanio.appspot.com",
    messagingSenderId: "18155466111",
    appId: "1:18155466111:web:a0482f08b51534f3c2be4a",
    measurementId: "G-9569X1SK0B",
  }
  firebase.initializeApp(config)
}

export const onRouteUpdate = ({ location }, pluginOptions = {}) => {
  firebase.analytics()
}
