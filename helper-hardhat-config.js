const networkConfig = {
  11155111: {
    name: "sepolia",
    ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
  },
  56: {
    name: "bnb",
    ethUsdPriceFeed: "0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e",
  },
  //31337
}

const developmentChains = ["hardhat", "localhost"]
const DECIMALS = 8
const INITAL_ANSWER = 180000000000

module.exports = {
  networkConfig,
  developmentChains,
  DECIMALS,
  INITAL_ANSWER,
}
