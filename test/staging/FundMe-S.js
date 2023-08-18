const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe
      let deployer
      const sendValue = ethers.parseEther("0.03")
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer
        fundMe = await ethers.getContract("FundMe", deployer)
      })

      it("allows people to fund and withdraw", async () => {
        await fundMe.fund({ value: sendValue })
        await fundMe.withdraw()
        const endBalance = await ethers.provider.getBalance(fundMe.target)
        assert.equal(endBalance.toString(), "0")
      })
    })
