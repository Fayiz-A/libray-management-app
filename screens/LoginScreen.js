import React from 'react';
import {
   View,
   Text,
   StyleSheet,
   Image,
   TextInput,
   TouchableOpacity,
   KeyboardAvoidingView
} from 'react-native'
import firebase from '../config';

export default class LoginScreen extends React.Component {

   constructor() {
      super();

      this.state = {
         emailID: null,
         password: null
      }
   }

   login = async (emailID, password) => {
      if(emailID && password) {
         try {
            const response = await firebase.auth().signInWithEmailAndPassword(emailID, password)

            if(response) {
               this.props.navigation.navigate("TabNavigator")
            }
         } catch (e) {
            console.log(e)
            switch(e.code) {
               case 'auth/user-not-found': 
                  console.log(`User doesn't exist`)
                  alert(`User not found`)
               break;
               case 'auth/invalid-email':
                  console.log(`Invalid email`)
                  alert(`Invalid email`)
               break;
               default: 
               console.log(`Something unexpected occurred`)
               alert(`Something unexpected occurred`)
            }
         }

      } else {
         alert(`Enter email and password`)
      }
   }

   render() {
      return (
         <View>
            <KeyboardAvoidingView style={{marginTop: 20, alignItems: "center"}} >
               <Image 
                  source = {require('../assets/booklogo.jpg')}
                  style={{ width: 200, height: 200 }}
               />
               <Text style={{ textAlign: 'center', fontSize: 30 }}>Wily</Text>
               <View>
                  <TextInput 
                     style = {styles.loginBox}
                     placeholder = "Email"
                     keyboardType= 'email_address'
                     onChangeText={(text) => this.setState({
                        emailID: text
                     })}
                  />
                  <TextInput 
                     style = {styles.loginBox}
                     placeholder = "Password"
                     onChangeText={(text) => this.setState({
                        password: text
                     })}
                     secureTextEntry = {true}
                  />
                  <TouchableOpacity 
                     style={{
                        height: 30, 
                        width: 90,
                        borderWidth: 1,
                        marginTop: 20,
                        paddingTop: 5,
                        borderRadius: 15,
                     }}
                     onPress={() => this.login(this.state.emailID, this.state.password)}
                  >
                     <Text style={{align: "center"}}>Login</Text>
                  </TouchableOpacity>
               </View>
            </KeyboardAvoidingView>
         </View>
      )
   }
}

const styles = StyleSheet.create({
   loginBox: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
   }
})