import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Image } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Permissions from 'expo-permissions';
import firebase from 'firebase';

import database from '../config';

export default class TransactionScreen extends React.Component {

   constructor() {
      super();

      this.state = {
         cameraPermissionGranted: null,
         scanned: false,
         scannedData: '',
         buttonState: 'normal',
         scannedBookId: '',
         scannedStudentId:'',
         transactionMessage: ''
      }
   }

   requestCameraPermission = async (id) => {
      var status = await BarCodeScanner.requestPermissionsAsync();
      console.log('Permission: ' + status.granted);

      this.setState({
         cameraPermissionGranted: status.granted,
         buttonState: id,
         scanned: false
      });
   }

   handleBarCodeScanned = ({type, data}) => {
      console.log('SCANNING')
      const buttonState = this.state.buttonState;

      if(buttonState === 'Student ID') {
        console.log(buttonState);
         this.setState({
            scannedStudentId: data,
            scanned: true,
            buttonState: 'normal',
         });
      } 
      else if(buttonState === 'Book ID') {
        console.log(buttonState);
         this.setState({
            scannedBookId: data,
            scanned: true,
            buttonState: 'normal',
         });
      }
      console.log(`Bar code with type ${type} and data ${data} has been scanned!`);
   }

   handleTransaction = async () => {
    let transactionMessage;

    console.log('In handle transaction');

    let book;

    database.collection('books').doc(this.state.scannedBookId).get().then((doc) => {
      book = doc.data();
      console.log(doc.data());
      if(book.bookAvailability) {
        console.log('available' + book.bookAvailability);
        this.initiateBookIssue();
        transactionMessage = 'Book issued';
        this.setState({
          transactionMessage: transactionMessage
        })
  
      } else {
        console.log('not available' + book.bookAvailability);
  
        this.initiateBookReturn();
        this.setState({
          transactionMessage: transactionMessage
        })
        transactionMessage = 'Book returned';
      }

    }).catch((e)=> console.log('error:' + e));
   }

   initiateBookIssue = async () => {
     try {
      database.collection('transaction').add({
        studentID: this.state.scannedStudentId,
        bookID: this.state.scannedBookId,
        transactionType: 'issue',
        // date: firebase.firestore.timestamp.now().toDate()
      });
  
      await database.collection('books').doc(this.state.scannedBookId).update({
        bookAvailability: false
      })
  
      await database.collection('student').doc(this.state.scannedStudentId).update({
        numberOfBooksIssued: firebase.firestore.filledValue.increment(1)
      });
      alert('Book Issued');
      this.setState({
        scannedBookId: '',
        scannedStudentId: ''
      });

     } catch (e) {
       alert('An error occured');
     }

   }

   initiateBookReturn = async () => {
    try {
      await database.collection('transactions').add({
        studentID: this.state.scannedStudentId,
        bookID: this.state.scannedBookId,
        transactionType: 'return',
        // date: firebase.firestore.timestamp.now().toDate()
      });
  
      await database.collection('books').doc(this.state.scannedBookId).update({
        bookAvailability: true
      })
  
      await database.collection('students').doc(this.state.scannedStudentId).update({
        numberOfBooksIssued: firebase.firestore.filledValue.decrement(1)
      });
      alert('Book Returned Successfully');
      this.setState({
        scannedBookId: '',
        scannedStudentId: ''
      });

     } catch (e) {
       alert('An error occured');
     }
   }

   render() {
      const hasCameraPermission = this.state.cameraPermissionGranted;
      const scanned = this.state.scanned;
      const buttonState = this.state.buttonState;

      if (buttonState != 'normal' && hasCameraPermission) {
         return (
            <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
         )
      }
      else if (buttonState === 'normal') {
         return(
            <View style={styles.container}>
              <View>
                <Image
                  source={require("../assets/booklogo.jpg")}
                  style={{width:200, height: 200}}/>
                <Text style={{textAlign: 'center', fontSize: 30}}>Wily</Text>
              </View>
              <View style={styles.inputView}>
              <TextInput 
                style={styles.inputBox}
                placeholder="Book Id"
                value={this.state.scannedBookId}/>
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={()=>{
                  this.requestCameraPermission("Book ID")
                }}>
                <Text style={styles.buttonText}>Scan</Text>
              </TouchableOpacity>
              </View>
              <View style={styles.inputView}>
              <TextInput 
                style={styles.inputBox}
                placeholder="Student Id"
                value={this.state.scannedStudentId}/>
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={()=>{
                  this.requestCameraPermission("Student ID")
                }}>
                <Text style={styles.buttonText}>Scan</Text>
              </TouchableOpacity>
              </View>
              <TouchableOpacity style = {styles.submitButton} onPress = {this.handleTransaction}>
                <Text>Submit</Text>
              </TouchableOpacity>
            </View>
          );
      }
   }
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 15,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      padding: 10,
      margin: 10
    },
    buttonText:{
      fontSize: 15,
      textAlign: 'center',
      marginTop: 10
    },
    inputView:{
      flexDirection: 'row',
      margin: 20
    },
    inputBox:{
      width: 200,
      height: 40,
      borderWidth: 1.5,
      borderRightWidth: 0,
      fontSize: 20
    },
    scanButton:{
      backgroundColor: '#66BB6A',
      width: 50,
      borderWidth: 1.5,
      borderLeftWidth: 0
    },
    submitButton: {
      backgroundColor: "green",
      width: 100,
      height: 40,
      borderWidth: 1,
      borderRadius: 25,
      justifyContent: "center",
      alignItems: "center"
    }
});

// import React, { useState, useEffect } from 'react';
// import { Text, View, StyleSheet, Button } from 'react-native';
// import { BarCodeScanner } from 'expo-barcode-scanner';

// export default class TransactionScreen extends React.Component {
//   const [hasPermission, setHasPermission] = useState(null);
//   const [scanned, setScanned] = useState(false);

//   constructor() {

//   }

//   useEffect(() => {
//     (async () => {
//       const { status } = await BarCodeScanner.requestPermissionsAsync();
//       setHasPermission(status === 'granted');
//     })();
//   }, []);

//   const handleBarCodeScanned = ({ type, data }) => {
//     setScanned(true);
//     alert(`Bar code with type ${type} and data ${data} has been scanned!`);
//   };

//   if (hasPermission === null) {
//     return <Text>Requesting for camera permission</Text>;
//   }
//   if (hasPermission === false) {
//     return <Text>No access to camera</Text>;
//   }

//   return (
//     <View style={styles.container}>
//       <BarCodeScanner
//         onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
//         style={StyleSheet.absoluteFillObject}
//       />
//       {scanned && <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />}
//     </View>
//   );
// }