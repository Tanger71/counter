import React from 'react';
import './App.css';
import Web3 from 'aion-web3';
import logo from './images/aion-logo.png';

const web3 = new Web3(new Web3.providers.HttpProvider("https://aion.api.nodesmith.io/v1/mastery/jsonrpc?apiKey=da85417fac594f0099708ad6e7ea2e97"));
//yeah, yeah. I have my private key here...
const account = web3.eth.accounts.privateKeyToAccount("d2abbfb69e2927abea2388ce74aa3199d86293a4704de0c6ff3572ec6719fefa83f31c24396498eccd1f4eaf690f9e24110c5a1c55ef436c1fe1aea5b452af40");
const contractAddress = "0xa00d22bee9a6873271751776a4153a0f991d0311e0aa3ad1c4ba6a12772e69a2";

const logoStyle = {
    width: 50
};

async function methodCall(methodName) {

    let data = web3.avm.contract
        .method(methodName)
        .encode();

    const transactionObject = {
        from: account.address,
        to: contractAddress,
        data: data,
        gasPrice: 10000000000,
        gas: 2000000,
        type: "0x1"
    };

    let initialResponse = await web3.eth.call(transactionObject);

    return web3.avm.contract.decode("string", initialResponse);
}

async function methodTxnInc(value){
    console.log("Incrementing by", value + "...");

    let data = web3.avm.contract
        .method("incrementCount")
        .inputs(["int"], [value])
        .encode();

    const transactionObject = {
        from: account.address,
        to: contractAddress,
        data: data,
        gasPrice: 10000000000,
        gas: 2000000
    };

    let signedTx = await web3.eth.accounts.signTransaction(transactionObject, account.privateKey);
    await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

}

class Layout extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            value: null,
            status: null,
            input: ''
        };
        this.getValue();
    }

    async getValue(){
        this.setState({value: await methodCall("getCount")});
    }

    async incrementCount(value){
        this.setState({status: "Awaiting txn..."})
        await methodTxnInc(value);
        this.getValue();
        this.setState({status: "Complete!"})

    }

    handelChange(event){
        this.setState({input: event.target.value})
    }

    async handelSubmit(event){
        this.incrementCount(this.state.input);
        event.preventDefault();
    }

    render(){
        return (
            <div>
                <p>Counter: {this.state.value}</p>
                {/*<div>*/}
                {/*    <button onClick={() => this.getValue()}>getCount</button>*/}
                {/*</div>*/}
                <div>
                    <button onClick={() => this.incrementCount(1)}>Increment +1</button>
                    <button onClick={() => this.incrementCount(-1)}>Increment -1</button>
                    <form onSubmit={this.handelSubmit.bind(this)}>
                        <label>
                            <input type="text" value={this.state.input} onChange={this.handelChange.bind(this)} />
                        </label>
                        <input type="submit" value="Increment" />
                    </form>
                    <p> {this.state.status}</p>
                </div>
            </div>
        );
    }
}

function App() {



  return (
    <div className="App">
        <p>Counter Contract Front</p>
        <img style={logoStyle} src={logo} alt="Logo" />
        <Layout/>
    </div>
  );
}


export default App;
