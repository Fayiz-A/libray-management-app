import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Image, KeyboardAvoidingView, ToastAndroid } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Permissions from 'expo-permissions';
import firebase from 'firebase';

import firebaseConfig from '../config';

let database = firebaseConfig.firestore();

export default class TransactionScreen extends React.Component {

  constructor() {
    super();

    this.state = {
      cameraPermissionGranted: null,
      scanned: false,
      scannedData: '',
      buttonState: 'normal',
      scannedBookId: '',
      scannedStudentId: '',
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

  handleBarCodeScanned = ({ type, data }) => {
    console.log('SCANNING')
    const buttonState = this.state.buttonState;

    if (buttonState === 'Student ID') {
      console.log(buttonState);
      this.setState({
        scannedStudentId: data,
        scanned: true,
        buttonState: 'normal',
      });
    }
    else if (buttonState === 'Book ID') {
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
    // let transactionMessage;

    // console.log('In handle transaction');

    // let book;

    // database.collection('books').doc(this.state.scannedBookId).get().then((doc) => {
    //   book = doc.data();
    //   console.log(doc.data());
    //   if (book.bookAvailability) {
    //     console.log('available' + book.bookAvailability);
    //     this.initiateBookIssue();
    //     transactionMessage = 'Book issued';
    //     ToastAndroid.show(transactionMessage, ToastAndroid.SHORT);
    //     this.setState({
    //       transactionMessage: transactionMessage
    //     })

    //   } else {
    //     console.log('not available' + book.bookAvailability);

    //     this.initiateBookReturn();
    //     this.setState({
    //       transactionMessage: transactionMessage
    //     })
    //     transactionMessage = 'Book returned';
    //     // ToastAndroid.show(transactionMessage,ToastAndroid.SHORT);
    //   }

    // }).catch((e) => console.log('error:' + e));

    let transactionType = await this.checkBookEligibility();

    if(!transactionType) {
      alert(`The book doesn't exist in the library database`);
      this.setState({
        scannedStudentId: "",
        scannedBookId: ""
      });
    } else if(transactionType === "Issue") {
      let isStudentEligible = await this.checkStudentEligibiltyForBookIssue();
      if(isStudentEligible) {
        this.initiateBookIssue();
        alert(`Book issued to the student!`);
      }
    } else {
      let isStudentEligible = await this.checkStudentEligibiltyForBookReturn();
      if(isStudentEligible) {
        this.initiateBookReturn();
        alert(`Book returned to the library`);
      }
    }
  }

  checkBookEligibility = async () => {
    const bookRef = await database.collection("books")
    .where("bookID", "==", this.state.scannedBookId)
    .get();

    let transactionType = "";

    if(bookRef.docs.length == 0) {
      transactionType = false;
    } else {
      bookRef.docs.map(doc => {
        let book = doc.data();

        if(book.bookAvailability) {
          transactionType = "Issue";
        } else {
          transactionType = "Return";
        }

      })
    }

    return transactionType;
  }


  checkStudentEligibiltyForBookIssue = async () => {
    const studentRef = await database.collection("student")
      .where("studentID", "==", this.state.scannedStudentId)
      .get();
      
    let isStudentEligible = "";
    if(studentRef.docs.length == 0) {
      this.setState({
        scannedStudentId: "",
        scannedBookId: ""
      });

      isStudentEligible = false;
      alert(`The student id doesn't exist in the database!`);
    } else {
      studentRef.docs.map(doc => {
        let student = doc.data();

        if(student.numberOfBooksIssued < 2) {
          isStudentEligible = true;
        } else {
          isStudentEligible = false;
          alert(`The student has already issued two books!`);

          this.setState({
            scannedBookId: "",
            scannedStudentId: ""
          });
        }
      });
    }

    return isStudentEligible;

  }


  checkStudentEligibiltyForBookReturn = async () => {
    const transactionRef = await database.collection("transactions")
    .where("bookID", "==", this.state.scannedBookId)
    .limit(1)
    .get();

    let isStudentEligible = "";

    transactionRef.docs.map(doc => {
      let lastBookTransaction = doc.data();

      if(lastBookTransaction.studentID == this.state.scannedStudentId) {
        isStudentEligible = true;
      } else {
        isStudentEligible = false;
        alert(`THe book was not issued by this student!`);

        this.setState({
          scannedStudentId: "",
          scannedBookId: "",
        });
      }

    });

    return isStudentEligible;
  }


  initiateBookIssue = async () => {
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
      numberOfBooksIssued: firebase.firestore.FieldValue.increment(1)
    });
    //alert('Book Issued');

    this.setState({
      scannedBookId: '',
      scannedStudentId: ''
    });



  }

  initiateBookReturn = async () => {
    await database.collection('transactions').add({
      studentID: this.state.scannedStudentId,
      bookID: this.state.scannedBookId,
      transactionType: 'return',
      // date: firebase.firestore.timestamp.now().toDate()
    });

    await database.collection('books').doc(this.state.scannedBookId).update({
      bookAvailability: true
    })

    await database.collection('student').doc(this.state.scannedStudentId).update({
      numberOfBooksIssued: firebase.firestore.FieldValue.increment(1)
    });
    // alert('Book Returned Successfully');
    this.setState({
      scannedBookId: '',
      scannedStudentId: ''
    });


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
      return (
        <KeyboardAvoidingView style={styles.container} behaviour="padding" enable>
          <View>
            <Image
              source={require("../assets/booklogo.jpg")}
              style={{ width: 200, height: 200 }} />
            <Text style={{ textAlign: 'center', fontSize: 30 }}>Wily</Text>
          </View>
          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeholder="Book Id"
              onChangeText={text => this.setState({ scannedBookId: text })}
              value={this.state.scannedBookId} />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                this.requestCameraPermission("Book ID")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeholder="Student Id"
              onChangeText={text => this.setState({ scannedStudentId: text })}
              value={this.state.scannedStudentId} />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                this.requestCameraPermission("Student ID")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={this.handleTransaction}>
            <Text>Submit</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>

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
  displayText: {
    fontSize: 15,
    textDecorationLine: 'underline'
  },
  scanButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    margin: 10
  },
  buttonText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10
  },
  inputView: {
    flexDirection: 'row',
    margin: 20
  },
  inputBox: {
    width: 200,
    height: 40,
    borderWidth: 1.5,
    borderRightWidth: 0,
    fontSize: 20
  },
  scanButton: {
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