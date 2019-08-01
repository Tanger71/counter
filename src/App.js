import React from 'react';
import './App.css';
import Web3 from 'aion-web3';
import logo from './images/aion-logo.png';

// const web3 = new Web3(new Web3.providers.HttpProvider("https://aion.api.nodesmith.io/v1/mastery/jsonrpc?apiKey=da85417fac594f0099708ad6e7ea2e97"));


const logoStyle = {
    width: 50
};



// class DetailsInput extends React.Component {
//     constructor(props) {
//         super(props);
//         this.state = {
//             privateKey: ''
//         };
//     }
//
//     handelChange(event){
//         this.setState({privateKey: event.target.value})
//         hasPrivateKey = true;
//     }
//
//     async handelSubmit(event){
//         account = web3.eth.accounts.privateKeyToAccount(this.state.privateKey);
//         event.preventDefault();
//     }
//
//     render(){
//         return (
//             <div>
//                 <form onSubmit={this.handelSubmit.bind(this)}>
//                     <label>
//                         <input type="text" value={this.state.input} onChange={this.handelChange.bind(this)} />
//                     </label>
//                     <input type="submit" value="Private Key" />
//                 </form>
//             </div>
//         );
//     }
// }

class Layout extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            value: this.props.result,
            status: null,
            input: ''
        };
        this.getValue();
    }

    async getValue(){
        this.setState({value: await this.props.methodCall("getCount")});
    }

    async incrementCount(value){
        this.setState({status: "Awaiting Confirmation with Aiwa..."})
        await this.props.methodTxnInc(value);
        this.setState({status: this.props.status});
        console.log("status", this.props.status);

        const localScope = this;
        let timer = setInterval(
            async function() {
                localScope.setState({status: localScope.props.status});
                if(localScope.props.status === "txn Complete!"){
                    console.log("status in", localScope.state.status);
                    await localScope.getValue();
                    clearInterval(timer);
                }
            },
            1000
        );

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
                {/*<DetailsInput/>*/}
                <div className="App">
                    <p>Counter Contract Front</p>
                    <img style={logoStyle} src={logo} alt="Logo" />
                    <p>Counter: {this.state.value}</p>
                    {/*<div>*/}
                    {/*    <button onClick={() => this.getValue()}>getCount</button>*/}
                    {/*</div>*/}
                    <div>
                        <button onClick={() => this.incrementCount(-1)}>Increment -1</button>
                        <button onClick={() => this.incrementCount(1)}>Increment +1</button>
                        <form onSubmit={this.handelSubmit.bind(this)}>
                            <label>
                                <input type="text" value={this.state.input} onChange={this.handelChange.bind(this)} />
                            </label>
                            <input type="submit" value="Increment" />
                        </form>
                        <p> {this.state.status}</p>
                    </div>
                </div>
            </div>

        );
    }
}

class App extends React.Component {
    componentDidMount = () => {

        setInterval(
            function() {
                if (window.aionweb3 ) {
                    this.setState({
                        aionweb3: window.aionweb3, //detect aiwa
                    });
                }
            }.bind(this),
            1000
        );

        setInterval(
            this.getFunction,
            1000
        );
    };

    constructor(props) {
        super(props);
        this.state = {
            aionweb3: null,
            account: null, //user account,
            value: " ",
            status: '',
            result: "",
            ctAddress: "0xa00d22bee9a6873271751776a4153a0f991d0311e0aa3ad1c4ba6a12772e69a2", //contract address,
            httpProvider: "https://aion.api.nodesmith.io/v1/mastery/jsonrpc?apiKey=da85417fac594f0099708ad6e7ea2e97"
        };
    }

    methodCall = async (methodName) =>  {

        let web3 = new Web3(
            new Web3.providers.HttpProvider(this.state.httpProvider)
        );


        // //set aiwa accouunt
        // try {
        //     this.setState({
        //         account:  window.aionweb3.account[0]
        //     })
        // } catch(e) {
        //     console.error("no account for sending", e.message);
        // }

        let data = web3.avm.contract
            .method(methodName)
            .encode();

        const transactionObject = {
            from: this.state.account,
            to: this.state.ctAddress,
            data: data,
            gasPrice: 10000000000,
            gas: 2000000,
            type: "0x1"
        };

        try {
            let res = await web3.eth.call(transactionObject); //call a method
            let returnValue = await web3.avm.contract.decode('string', res);
            this.setState({
                result: returnValue
            });
        } catch (err) {
            console.log("fail calling");
        }

        console.log('getter:', this.state.result);
        return this.state.result;

        // let initialResponse = await web3.eth.call(transactionObject);
        // return web3.avm.contract.decode("string", initialResponse);
    };

    methodTxnInc = async (value) => {
        console.log("Incrementing by", value + "...");

        //set web3
        let web3 = new Web3(
            new Web3.providers.HttpProvider(this.state.httpProvider)
        );

        let data = web3.avm.contract
            .method("incrementCount")
            .inputs(["int"], [value])
            .encode();

        const transactionObject = {
            from: this.state.account,
            to: this.state.ctAddress,
            data: data,
            gas: 2000000
        };

        try {
            let txHash = await window.aionweb3.sendTransaction(transactionObject);
            this.setState({status: "txn pending at --- "+ txHash + " --- " + 0 + "sec"});

            const localScope = this;

            let i = 0;
            let timer = setInterval(
                async function() {
                    i++;

                    if(await web3.eth.getTransactionReceipt(txHash)){
                        console.log("getTransactionReceipt", txHash);
                        console.log("onTxComplete");
                        localScope.setState({status: "txn Complete!"});
                        clearInterval(timer);
                    } else {
                        console.log("Txn Pending");
                        localScope.setState({status: "txn pending at --- "+ txHash + " --- " + i + "sec"});
                    }
                },
                1000
            );
        }
        catch (err) {
            console.log(err);
        }



    };

    render() {
        return (<div><Layout status={this.state.status} result={this.state.result} methodCall={this.methodCall} methodTxnInc={this.methodTxnInc}/></div>);
    }

}

export default App;
