import React from 'react';
import logo from './bh.png';
import './App.css';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';

import axios from 'axios';
import qrcode from 'qrcode';

import  { Redirect } from 'react-router-dom'
 
import openSocket from 'socket.io-client';
const socket = openSocket('http://localhost:8007');

const styles = theme => ({
  root: {
    flexGrow: 1,
    overflow: 'hidden',
    backgroundSize: 'cover',
    backgroundPosition: '0 400px',
    paddingBottom: 10
  },
  button: {
    margin: theme.spacing(1),
    color: "white",
    borderColor: "white"
  },
  input: {
    display: 'none',
  },
  invoiceText: {
    fontSize: 20,
    maxWidth: 1100,
    overflowWrap: 'break-word'
  }
});

// const opennodeApiKey = '598e5042-9044-4c1a-bdd7-3f7a8cf8e006';


class App extends React.Component {

  state={
    qr: '',
    showQr: true,
    showButt: false,
    showInvite: true,
    invoiceID: '',
    showError: true,
    countdown: 600000,
    remainingTime: '',
    invoiceLN: '',
  }

  constructor(props){
    super(props);
    this.getInvoiceLN = this.getInvoiceLN.bind(this);
    this.loadQrCode = this.loadQrCode.bind(this);
    this.waitForPayment = this.waitForPayment.bind(this);
    this.paymentCompleted = this.paymentCompleted.bind(this);
    this.msTominsec = this.msTominsec.bind(this);
  }

  async getInvoiceLN(){
    this.setState({countdown: 600000});
    /*var postData = {
        description: "ekino.com",
        currency: "JPY",
        amount: "0.01",
        auto_settle: false,
        // Change callback based on ngrok node: (localhost only)
        callback_url: "http://52085d64.ngrok.io/paymentComplete",
    };
    let axiosConfig = {
      headers: {
        'Authorization': '598e5042-9044-4c1a-bdd7-3f7a8cf8e006',
        'content-type': 'application/json'
      } 
    };
    axios.post('https://dev-api.opennode.co/v1/charges', postData, axiosConfig).then((response) => {
        // console.log(response);
        this.setState({invoiceID: response.data.data.id, invoiceLN: response.data.data.lightning_invoice.payreq});
        // console.log(this.state.invoiceID);
        this.loadQrCode(response.data.data.lightning_invoice.payreq);
    });*/
    socket.emit('newInvoice');

  }

  async loadQrCode(BOLT11){
    const qrCode = await qrcode.toDataURL(BOLT11, { margin: 2, width: 300 });
    this.setState({qr: qrCode, showButt: true, showQr: false});
    this.waitForPayment();
  }

  async waitForPayment(){
    var id = this.state.invoiceID;
    socket.emit('invoicePayment', id);
    this.interval = setInterval(() => {
      if(this.state.countdown !== 0){
        this.setState({countdown: this.state.countdown - 1000});
        this.msTominsec(this.state.countdown);
      }else{
        this.setState({ showInvite: true, showQr: true, showButt: false });
        clearInterval(this.interval);
        socket.removeListener('paymentComplete');
      }
    },1000);
  }

  componentDidMount(){
    socket.on('paymentComplete', (response) => {
      socket.removeListener('invoicePayment');
      this.paymentCompleted();
    });

    socket.on('invoiceGenerated', (response) => {
      // console.log(response);
      this.setState({invoiceLN: response.lightning_invoice.payreq});
      this.loadQrCode(response.lightning_invoice.payreq);
    });

  }

  async paymentCompleted(){
    // console.log("Payment completed");
    this.setState({showInvite:false, showQr: true});
    clearInterval(this.interval);
    socket.removeListener('paymentComplete');
    // window.open("https://discord.gg/3D3Af7k","self");
    // this.props.history.push("https://discord.gg/3D3Af7k");
    window.location.href = "https://discord.gg/3D3Af7k";
  }

  msTominsec(timeToConvert) {
    var seconds = timeToConvert / 1000;
    var minutes = parseInt(seconds / 60); 
    seconds = seconds % 60;
    this.setState({remainingTime: minutes + " minutes et " + seconds + " secondes"});
  }

  render(){
    const { classes } = this.props;
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h4>
         La communauté Crypto n°1 en France
        </h4>
        <div hidden={this.state.showButt}>
          <Button variant="outlined" className={classes.button} onClick={this.getInvoiceLN}>
            Accèder au serveur Discord
          </Button>
        </div>
        <div hidden={this.state.showQr}>
          <img className="" src={this.state.qr.toString()} alt={""} />
          <p className={classes.invoiceText}>{this.state.invoiceLN}</p>
          <p><b>Temps restant pour le paiment LN :  </b> {this.state.remainingTime}</p>
        </div>
        <div hidden={this.state.showInvite}>
          Paiement validé, veuillez patienter . . .
        </div>
      </header>
    </div>
  );
  }
}

export default withStyles(styles, { withTheme: true })(App);
