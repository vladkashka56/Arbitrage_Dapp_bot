import React, { Component } from 'react'
import {
  Button,
  InputGroup,
  FormControl,
  Modal,
  Card,
  ProgressBar,
} from 'react-bootstrap'
import './App.css'
import { ethers } from 'ethers'
import { erc20abi, abi } from './abi'
import {
  walletAddress,
  walletPrivate,
  web3url,
  uniswap,
  sushiswap,
  defiswap,
  wethaddress,
  autoProfit,
  autoAmount,
  autoTime,
  autoGasLimit,
  autoGasValue,
  autoSlippage,
  addressdatabaseurl,
  logdatabaseurl,
} from './config'
import { MDBDataTableV5 } from 'mdbreact'
import { database } from './firebase/firebase'
import { FiMonitor, FiCloudLightning, FiUserPlus } from 'react-icons/fi'
import { BsClockHistory, BsTable, BsTrash } from 'react-icons/bs'
import { GiReceiveMoney, GiMoneyStack } from 'react-icons/gi'

// const web3 = new Web3(new Web3.providers.HttpProvider(web3url))
const ethProvider = new ethers.providers.JsonRpcProvider(web3url)
const uniswap_address = uniswap
const sushi_address = sushiswap
const defiswap_address = defiswap
const Eth_address = wethaddress
class Display extends Component {
  constructor(props) {
    super(props)
    this.state = {
      // capture parameter
      uni_buy: 0,
      uni_sell: 0,
      sushi_buy: 0,
      sushi_sell: 0,
      pancake_buy: 0,
      pancake_sell: 0,
      profit_rate: 0,
      tableDatas: [],
      tableData: [],

      // input token
      inputAddress: '',
      tokenAddresses: [],

      // trading parameter
      tradeToken: '',
      tradeTokenAddress: '0x88fBA5A752111b1be58e7129cAAD2c0dB62DafF5',
      tradebuyprice: 0,
      tradesellprice: 0,
      traderate: 0,
      log: '',
      logTimestamp: '',
      logList: '',
      firstDex: uniswap,
      secondDex: sushiswap,
      // auto start
      modalShowState: false,
      autoProfit: autoProfit,
      autoAmount: autoAmount,
      autoTime: autoTime,
      autoSlippage: autoSlippage,
      autoGasLimit: autoGasLimit,
      autoGasValue: autoGasValue,
      autoExcuteButtonState: false,
      ownerAddress: walletAddress,
      ownerPrivateKey: walletPrivate,
      ownerBalance: '',
      autoModeState: false,
      walletBalance: '',
      logs: [],
      progressbarState: 0,
      progressLabel: 'Please start trading!',
    }
  }

  async componentWillMount() {
    await this.loadLog()
    await this.loadAddresses()

    if (this.state.ownerAddress !== 0) {
      let first_value = await ethProvider.getBalance(this.state.ownerAddress)
      this.setState({
        ownerBalance: ethers.utils.formatEther(first_value),
      })
    }
  }

  async getPriceData() {
    await this.loadLog()
    await this.loadAddresses()
    await this.start()
  }

  async loadAddresses() {
    let snapshot = await database.ref(addressdatabaseurl + '/').get()
    if (snapshot.exists) {
      var walletList = []
      const newArray = snapshot.val()
      if (newArray) {
        Object.keys(newArray).map((key) => {
          const value = newArray[key]
          walletList.push({
            Address: value.Address,
          })
        })
      }
    }
    this.setState({
      tokenAddresses: walletList,
    })
  }

  async loadLog() {
    database
      .ref(logdatabaseurl + '/')
      .get()
      .then((snapshot) => {
        if (snapshot.exists) {
          var logs = []
          const newArray = snapshot.val()

          if (newArray) {
            Object.keys(newArray).map((key, index) => {
              const value = newArray[key]
              logs.unshift({
                timeStamp: value.timeStamp,
                tradeToken: value.tradeToken,
                autoAmount: value.autoAmount,
                firstDex: value.firstDex,
                secondDex: value.secondDex,
                tradeRate: value.tradeRate,
              })
            })
          }
          this.setState({
            logs: logs,
          })
        }
      })
  }

  async clearLog() {
    database.ref(logdatabaseurl + '/').remove()
    this.loadLog()
  }

  async start() {
    let autoAmount = this.state.autoAmount

    for (let index = 0; index < this.state.tokenAddresses.length; index++) {
      let uni_buy,
        uni_sell,
        sushi_buy,
        sushi_sell,
        pancake_buy,
        pancake_sell,
        max_buy,
        max_sell,
        profit_rate,
        profit_rate_style,
        firstDex,
        secondDex,
        tokenName,
        tokenDecimal
      try {
        try {
          let tokenContract = new ethers.Contract(
            this.state.tokenAddresses[index]['Address'],
            erc20abi,
            ethProvider,
          )
          tokenName = await tokenContract.symbol()
          tokenDecimal = await tokenContract.decimals()
        } catch (err) {
          console.log(err)
        }

        try {
          let mycontract1 = new ethers.Contract(
            uniswap_address,
            [
              'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
              'function getAmountsIn(uint amountOut, address[] memory path) public view returns (uint[] memory amounts)',
              'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
              'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
            ],
            ethProvider,
          )
          uni_buy = await mycontract1.getAmountsOut(
            ethers.utils.parseUnits(autoAmount, 'ether'),
            [Eth_address, this.state.tokenAddresses[index]['Address']],
          )
          uni_sell = await mycontract1.getAmountsIn(
            ethers.utils.parseUnits(autoAmount, 'ether'),
            [this.state.tokenAddresses[index]['Address'], Eth_address],
          )
          uni_buy =
            Math.round(uni_buy[1] / Math.pow(10, tokenDecimal - 5)) / 100000
          uni_sell =
            Math.round(uni_sell[0] / Math.pow(10, tokenDecimal - 5)) / 100000
        } catch (err) {
          uni_buy = 0
          uni_sell = 100000000000000000000
          console.log(err)
        }
        try {
          let mycontract2 = new ethers.Contract(
            sushi_address,
            [
              'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
              'function getAmountsIn(uint amountOut, address[] memory path) public view returns (uint[] memory amounts)',
              'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
              'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
            ],
            ethProvider,
          )
          sushi_buy = await mycontract2.getAmountsOut(
            ethers.utils.parseUnits(autoAmount, 'ether'),
            [Eth_address, this.state.tokenAddresses[index]['Address']],
          )
          sushi_sell = await mycontract2.getAmountsIn(
            ethers.utils.parseUnits(autoAmount, 'ether'),
            [this.state.tokenAddresses[index]['Address'], Eth_address],
          )
          sushi_buy =
            Math.round(sushi_buy[1] / Math.pow(10, tokenDecimal - 5)) / 100000
          sushi_sell =
            Math.round(sushi_sell[0] / Math.pow(10, tokenDecimal - 5)) / 100000
        } catch (err) {
          sushi_buy = 0
          sushi_sell = 100000000000000000000
          console.log('sushi error', err)
        }

        try {
          let mycontract3 = new ethers.Contract(
            defiswap_address,
            abi,
            ethProvider,
          )
          pancake_buy = await mycontract3.getAmountsOut(
            ethers.utils.parseUnits(autoAmount, 'ether'),
            [Eth_address, this.state.tokenAddresses[index]['Address']],
          )
          pancake_sell = await mycontract3.getAmountsIn(
            ethers.utils.parseUnits(autoAmount, 'ether'),
            [this.state.tokenAddresses[index]['Address'], Eth_address],
          )
          pancake_buy =
            Math.round(pancake_buy[1] / Math.pow(10, tokenDecimal - 5)) / 100000
          pancake_sell =
            Math.round(pancake_sell[0] / Math.pow(10, tokenDecimal - 5)) /
            100000
        } catch (err) {
          pancake_buy = 0
          pancake_sell = 100000000000000000000
          console.log('defi_error', err)
        }

        max_buy = Math.max.apply(null, [uni_buy, sushi_buy, pancake_buy])
        if (max_buy === uni_buy) {
          firstDex = uniswap_address
        } else if (max_buy === sushi_buy) {
          firstDex = sushi_address
        } else {
          firstDex = defiswap_address
        }

        max_sell = Math.min.apply(null, [uni_sell, sushi_sell, pancake_sell])

        if (max_sell === uni_sell) {
          secondDex = uniswap_address
        } else if (max_sell === sushi_sell) {
          secondDex = sushi_address
        } else {
          secondDex = defiswap_address
        }

        profit_rate =
          Math.round(((max_buy - max_sell) / max_buy) * 1000000) / 10000

        uni_buy == 0
          ? (uni_buy = <a className="text-warning"> xxx.xxx </a>)
          : (uni_buy = uni_buy)

        sushi_buy == 0
          ? (sushi_buy = <a className="text-warning"> xxx.xxx</a>)
          : (sushi_buy = sushi_buy)

        pancake_buy == 0
          ? (pancake_buy = <a className="text-warning"> xxx.xxx </a>)
          : (pancake_buy = pancake_buy)

        uni_sell == 100000000000000000000
          ? (uni_sell = <a className="text-warning"> xxx.xxx </a>)
          : (uni_sell = uni_sell)

        sushi_sell == 100000000000000000000
          ? (sushi_sell = <a className="text-warning"> xxx.xxx </a>)
          : (sushi_sell = sushi_sell)

        pancake_sell == 100000000000000000000
          ? (pancake_sell = <a className="text-warning"> xxx.xxx </a>)
          : (pancake_sell = pancake_sell)

        if (profit_rate > 0) {
          profit_rate_style = <a className="text-success"> {profit_rate} </a>
          if (this.state.traderate < profit_rate) {
            this.setState({
              tradeTokenAddress: this.state.tokenAddresses[index]['Address'],
              tradeToken: tokenName,
              tradebuyprice: max_buy,
              tradesellprice: max_sell,
              traderate: profit_rate,
              firstDex: firstDex,
              secondDex: secondDex,
            })
          }
        } else if (profit_rate <= 0) {
          profit_rate_style = <a className="text-danger"> {profit_rate} </a>
        }

        if (
          this.state.tradeTokenAddress ==
          this.state.tokenAddresses[index]['Address']
        ) {
          if (profit_rate > 0) {
            console.log('zero over')

            this.setState({
              tradeTokenAddress: this.state.tokenAddresses[index]['Address'],
              tradeToken: tokenName,
              tradebuyprice: max_buy,
              tradesellprice: max_sell,
              traderate: profit_rate,
              firstDex: firstDex,
              secondDex: secondDex,
            })
          } else {
            console.log('zero down')
            this.setState({
              tradeTokenAddress: '',
              tradeToken: '',
              tradebuyprice: 0,
              tradesellprice: 0,
              traderate: 0,
              firstDex: '',
              secondDex: '',
            })
          }
        }

        let tableData = {
          tokenName: tokenName,
          tokenDecimal: tokenDecimal,
          uni_buy: uni_buy,
          uni_sell: uni_sell,
          sushi_buy: sushi_buy,
          sushi_sell: sushi_sell,
          pancake_buy: pancake_buy,
          pancake_sell: pancake_sell,
          profit_rate: profit_rate,
          profit_rate_style: profit_rate_style,
        }
        let tableDatas = this.state.tableDatas
        tableDatas[index] = tableData
        this.setState({
          tableDatas: tableDatas,
        })
      } catch (err) {
        let tableDatas = this.state.tableDatas
        tableDatas[index] = []
        this.setState({
          tableDatas: tableDatas,
        })
        console.log(err)
      }
      if (index === this.state.tokenAddresses.length - 1) {
        this.start()
        this.loadAddresses()
      }
    }
  }

  async manualExcute() {
    if (this.state.autoExcuteButtonState === false) {
      this.setState({
        progressbarState: 0,
        progressLabel: 'Please start trading!',
      })
      return
    }
    const flashloanContractAddr = '0xa1b571cE6Decb441928003584c2e093dfAa23966'
    var wallet = new ethers.Wallet(this.state.ownerPrivateKey)
    const account = wallet.connect(ethProvider)
    let flashloanContract = new ethers.Contract(
      flashloanContractAddr,
      [
        'function flashloan(address token1, address token2, uint256 borrow_amount, address router1, address router2) public',
      ],
      account,
    )

    this.setState({
      progressbarState: 0,
      progressLabel: 'sending transaction for flashloan',
    })

    let tradeToken = this.state.tradeToken
    let tradeTokenAddress = this.state.tradeTokenAddress
    let firstDex = this.state.firstDex
    let secondDex = this.state.secondDex
    let tradeRate = this.state.traderate

    let ethBalance = await ethProvider.getBalance(this.state.ownerAddress)
    this.setState({
      ownerBalance: ethers.utils.formatEther(ethBalance),
    })
    if (ethBalance < ethers.utils.parseUnits('2', 'ether')) {
      this.setState({
        progressbarState: 0,
        progressLabel: 'Please check eth balance',
      })
    } else {
      if (tradeRate < this.state.autoProfit) {
        console.log('faild profit')
        this.setState({
          tradeTokenAddress: '',
        })
        setTimeout(() => {
          this.manualExcute()
        }, this.state.autoTime)
        return
      }

      try {
        let tx = await flashloanContract.flashloan(
          Eth_address,
          tradeTokenAddress,
          ethers.utils.parseUnits(this.state.autoAmount, 'ether'),
          firstDex,
          secondDex,
          {
            gasLimit: this.state.autoGasLimit,
            gasPrice: ethers.utils.parseUnits(
              String(this.state.autoGasValue),
              'gwei',
            ),
            nonce: await ethProvider.getTransactionCount(
              this.state.ownerAddress,
            ),
            value: ethers.BigNumber.from(
              this.state.autoAmount * 1000000000000000000 + '',
            ),
          },
        )
        await tx.wait()

        this.setState({
          ownerBalance: ethers.utils.formatEther(
            await ethProvider.getBalance(this.state.ownerAddress),
          ),
        })

        console.log('successful')

        const logList = {
          timeStamp: new Date().toISOString(),
          autoAmount: this.state.autoAmount,
          tradeToken: tradeToken,
          tradeRate: tradeRate,
          firstDex: firstDex,
          secondDex: secondDex,
        }
        var userListRef = database.ref(logdatabaseurl)
        var newUserRef = userListRef.push()
        newUserRef.set(logList)
        let buffer = ''
        this.setState({ logList: buffer })
        this.loadLog()

        this.setState({
          progressbarState: 100,
          progressLabel: 'Complete',
        })
        console.log('\n time checking')

        setTimeout(() => {
          this.manualExcute()
        }, this.state.autoTime)
        return
      } catch (error) {
        console.log('transaction failed...')
        console.log(error)
      }
    }
  }

  autoExcute() {
    if (this.state.ownerAddress === '' || this.state.ownerPrivateKey === '') {
      alert('please input address and privatekey')
      return
    }
    this.setState({
      modalShowState: true,
    })
  }

  async autoExcuteStart() {
    this.setState({
      autoExcuteButtonState: true,
      modalShowState: false,
    })
    setTimeout(() => {
      this.manualExcute()
    }, 500)
  }

  closeModal() {
    this.setState({
      modalShowState: false,
      autoProfit: 20,
      autoTime: 30000,
      autoSlippage: 100,
      autoGasLimit: 500000,
      autoGasValue: 40,
    })
  }

  stopAutoExcute() {
    this.setState({
      autoExcuteButtonState: false,
      autoModeState: false,
    })
    console.log('stop excute')
  }

  render() {
    var rowstable = this.state.tableDatas
    const datatable = {
      columns: [
        {
          label: 'Token',
          field: 'tokenName',
        },
        {
          label: 'Uni Buy Amount',
          field: 'uni_buy',
        },
        {
          label: 'Sushi Buy Amount',
          field: 'sushi_buy',
        },
        {
          label: 'defi Buy Amount',
          field: 'pancake_buy',
        },
        {
          label: 'Uni Sell Amount',
          field: 'uni_sell',
        },
        {
          label: 'Sushi Sell Amount',
          field: 'sushi_sell',
        },
        {
          label: 'defi Sell Amount',
          field: 'pancake_sell',
        },
        {
          label: 'Profit Rate',
          field: 'profit_rate_style',
        },
      ],
      rows: rowstable,
    }

    const rowslog = this.state.logs
    const datalog = {
      columns: [
        {
          label: 'TimeStamp',
          field: 'timeStamp',
          sort: 'asc',
          width: 150,
        },
        {
          label: 'Trade Token',
          field: 'tradeToken',
          sort: 'asc',
          width: 270,
        },
        {
          label: 'Trade Amount',
          field: 'autoAmount',
          sort: 'asc',
          width: 200,
        },
        {
          label: 'Buy Dex',
          field: 'firstDex',
          sort: 'asc',
          width: 100,
        },
        {
          label: 'Sell Dex',
          field: 'secondDex',
          sort: 'asc',
          width: 100,
        },
        {
          label: 'Trade Rate',
          field: 'tradeRate',
          sort: 'asc',
          width: 100,
        },
      ],
      rows: rowslog,
    }

    const handleAutoProfit = (e) => {
      let addLabel = e.target.value
      this.setState({
        autoProfit: addLabel,
      })
    }

    const handleAutoAmount = async (e) => {
      let addLabel = e.target.value
      this.setState({
        autoAmount: addLabel,
      })
      // if(addLabel < 3) {
      //   alert("You must enter 3 or higher. Otherwise, you may lose Ether.")
      //   this.setState({
      //     autoAmount : 3
      //   })
      // } else {
      //   this.setState({
      //     autoAmount: addLabel,
      //   });
      // }
    }

    const handleAutoTimepitch = (e) => {
      let addLabel = e.target.value
      this.setState({
        autoTime: addLabel,
      })
    }

    const handleAutoSlippage = (e) => {
      let addLabel = e.target.value
      this.setState({
        autoSlippage: addLabel,
      })
    }

    const handleAutoGasValue = (e) => {
      let addLabel = e.target.value
      this.setState({
        autoGasValue: addLabel,
      })
    }

    const handleAutoGasLimit = (e) => {
      let addLabel = e.target.value
      this.setState({
        autoGasLimit: addLabel,
      })
    }

    const handleOwnerAddress = async (e) => {
      let addLabel = e.target.value
      this.setState({
        ownerAddress: addLabel,
      })
    }

    const handleOwnerPrivateKey = async (e) => {
      let addLabel = e.target.value
      this.setState({
        ownerPrivateKey: addLabel,
      })
    }

    return (
      <div>
        <div className="row">
          <div className="col-7">
            <Card
              bg="light"
              style={{ height: '35rem', overflow: 'scroll' }}
              border="primary"
              overflow="scroll"
            >
              <Card.Body>
                <Card.Title>
                  <h2>
                    {' '}
                    <FiMonitor /> &nbsp; Dex Token Price Monitor
                  </h2>{' '}
                  <hr />
                </Card.Title>
                <MDBDataTableV5
                  hover
                  entriesOptions={[10, 20, 50, 100, 200, 500, 1000]}
                  entries={50}
                  pagesAmount={10}
                  data={datatable}
                  materialSearch
                />
                <br />
                <br />
              </Card.Body>
            </Card>
            <br />

            <Card
              bg="light"
              style={{ height: '30rem', overflow: 'scroll' }}
              border="primary"
            >
              <Card.Body>
                <div className="row">
                  <div className="col-10">
                    <Card.Title>
                      <h2>
                        {' '}
                        <BsClockHistory /> &nbsp; Trade Log
                      </h2>{' '}
                    </Card.Title>
                  </div>
                  <div className="col-2">
                    <Button
                      variant="primary"
                      id="button-addon2"
                      onClick={() => this.clearLog()}
                    >
                      <BsTrash /> Clear Log
                    </Button>
                  </div>
                </div>
                <hr />

                <MDBDataTableV5
                  hover
                  entriesOptions={[10, 20, 50, 100, 200, 500, 1000]}
                  entries={50}
                  pagesAmount={1000}
                  data={datalog}
                />
              </Card.Body>
            </Card>
          </div>

          <div className="col-5">
            <Card
              bg="light"
              style={{ height: '67rem', overflow: 'scroll' }}
              border="primary"
            >
              <Card.Body>
                <h2>
                  {' '}
                  <GiReceiveMoney /> &nbsp; Trading Amount
                </h2>{' '}
                <hr />
                <br />
                <div className="row">
                  <div className="col-1"></div>
                  <div className="col-10">
                    <InputGroup className="mb-3">
                      <InputGroup.Text id="basic-addon3">
                        Trade Amount (Eth)
                      </InputGroup.Text>
                      <FormControl
                        id="basic-url"
                        aria-describedby="basic-addon3"
                        type="text"
                        defaultValue={this.state.autoAmount}
                        onChange={handleAutoAmount}
                        placeholder="Loan Amount  X ETH X is integer"
                      />
                      <Button
                        variant="primary"
                        id="button-addon2"
                        onClick={() => this.getPriceData()}
                      >
                        <BsTable />
                        &nbsp; Get Price Data
                      </Button>
                    </InputGroup>
                  </div>
                  <div className="col-1"></div>
                </div>
                <br />
                <br />
                <h2>
                  {' '}
                  <FiUserPlus /> &nbsp; Wallet Address and Private Key
                </h2>{' '}
                <hr />
                <br />
                <div className="row">
                  <div className="col-1"></div>
                  <div className="col-10">
                    <InputGroup className="mb-3">
                      <FormControl
                        placeholder="Wallet address"
                        aria-label="Recipient's username"
                        aria-describedby="basic-addon2"
                        defaultValue={this.state.ownerAddress}
                        onChange={handleOwnerAddress}
                      />

                      <FormControl
                        placeholder="Private Key"
                        aria-label="Recipient's username"
                        aria-describedby="basic-addon2"
                        defaultValue={this.state.ownerPrivateKey}
                        onChange={handleOwnerPrivateKey}
                      />
                    </InputGroup>
                  </div>
                  <div className="col-1"></div>
                </div>
                <br />
                <br />
                <h2>
                  {' '}
                  <GiMoneyStack /> &nbsp; Wallet Balance :{' '}
                  {this.state.ownerBalance}{' '}
                </h2>{' '}
                <hr />
                <br />
                <br />
                <h2>
                  {' '}
                  <FiCloudLightning /> &nbsp; Auto Trading
                </h2>{' '}
                <hr />
                <br />
                <br />
                <p show={this.state.showstate}>
                  We can execute Arbitrage trading on{' '}
                  <b>{this.state.tradeToken}</b> Token, buy price is(Eth/Token){' '}
                  <b>{this.state.tradebuyprice}</b> , sell price is(Eth/Token){' '}
                  <b>{this.state.tradesellprice} </b>, profit rate is{' '}
                  <b>{this.state.traderate} %</b>{' '}
                </p>
                <br />
                <br />
                <div className="row">
                  <div className="col-1"></div>
                  <div className="col-10">
                    <InputGroup className="mb-3">
                      <Button
                        variant={
                          this.state.autoExcuteButtonState
                            ? 'danger'
                            : 'success'
                        }
                        id="button-addon2"
                        onClick={
                          this.state.autoExcuteButtonState
                            ? () => this.stopAutoExcute()
                            : () => this.autoExcute()
                        }
                        style={{ width: '100%' }}
                      >
                        <FiCloudLightning /> &nbsp;&nbsp;{' '}
                        {this.state.autoExcuteButtonState
                          ? 'Stop Auto Execute'
                          : 'Start Auto Execute'}
                      </Button>
                    </InputGroup>
                    <br />
                    <h6> {this.state.progressLabel} </h6>

                    <ProgressBar animated now={this.state.progressbarState} />
                  </div>
                </div>
                <br />
                <br />
              </Card.Body>
            </Card>
          </div>
        </div>
        <Modal show={this.state.modalShowState}>
          <Modal.Header closeButton onClick={() => this.closeModal()}>
            <Modal.Title>Auto-Excute</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <InputGroup className="mb-3">
              <InputGroup.Text id="basic-addon3">Profit Rate</InputGroup.Text>
              <FormControl
                id="basic-url1"
                aria-describedby="basic-addon3"
                type="text"
                defaultValue={this.state.autoProfit}
                onChange={handleAutoProfit}
                placeholder="Profit Limit, unit : %"
              />
              <InputGroup.Text id="basic-addon2">%</InputGroup.Text>
            </InputGroup>

            <InputGroup className="mb-3">
              <InputGroup.Text id="basic-addon3">Interval</InputGroup.Text>
              <FormControl
                id="basic-url"
                aria-describedby="basic-addon3"
                type="text"
                defaultValue={this.state.autoTime}
                onChange={handleAutoTimepitch}
                placeholder="Interval  Unit : ms"
              />
              <InputGroup.Text id="basic-addon2">ms</InputGroup.Text>
            </InputGroup>

            <InputGroup className="mb-3">
              <InputGroup.Text id="basic-addon3">Slippage</InputGroup.Text>
              <FormControl
                id="basic-url"
                aria-describedby="basic-addon3"
                type="text"
                defaultValue={this.state.autoSlippage}
                onChange={handleAutoSlippage}
                placeholder="Slippage Unit : %"
              />
              <InputGroup.Text id="basic-addon2">%</InputGroup.Text>
            </InputGroup>

            <InputGroup className="mb-3">
              <InputGroup.Text id="basic-addon3">Gas value</InputGroup.Text>
              <FormControl
                id="basic-url"
                aria-describedby="basic-addon3"
                type="text"
                defaultValue={this.state.autoGasValue}
                onChange={handleAutoGasValue}
                placeholder="Gas Value Unit : gwei"
              />
              <InputGroup.Text id="basic-addon2">Gwei</InputGroup.Text>
            </InputGroup>

            <InputGroup className="mb-3">
              <InputGroup.Text id="basic-addon3">Gas Limit</InputGroup.Text>
              <FormControl
                id="basic-url"
                aria-describedby="basic-addon3"
                type="text"
                defaultValue={this.state.autoGasLimit}
                onChange={handleAutoGasLimit}
                placeholder="Gas Limit"
              />
            </InputGroup>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => this.closeModal()}>
              Close
            </Button>
            <Button variant="primary" onClick={() => this.autoExcuteStart()}>
              Start
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}

export default Display
