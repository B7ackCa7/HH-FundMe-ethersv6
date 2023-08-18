const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe
      let deployer
      let mockV3Aggregator
      const sendValue = ethers.parseEther("1") //"1000000000000000000" //1 eth
      beforeEach(async function () {
        //deploy fundme.sol with hardhat-deploy
        deployer = (await getNamedAccounts()).deployer

        //console.log("Deploying all contracts...")
        await deployments.fixture(["all"])

        fundMeAddress = (await deployments.get("FundMe")).address
        fundMe = await ethers.getContractAt("FundMe", fundMeAddress)
        mockV3Aggregator = await ethers.getContractAt(
          "MockV3Aggregator",
          deployer
        )
      })

      describe("constructor", async function () {
        it("Sets the aggregator address correctly", async function () {
          const response = await fundMe.getPriceFeed() //
          mockV3AggregatorAddress = (await deployments.get("MockV3Aggregator"))
            .address
          assert.equal(response, mockV3AggregatorAddress)
        })
      })

      describe("fund", async function () {
        // https://ethereum-waffle.readthedocs.io/en/latest/matchers.html
        // could also do assert.fail
        it("Should revert if not enough eth was sent", async function () {
          await expect(fundMe.fund()).to.be.revertedWith("Didn't send enough!") //
        })
        it("Updated the amount funded data structure ", async function () {
          await fundMe.fund({ value: sendValue })
          const response = await fundMe.getAddressToAmountFunded(deployer) //
          assert.equal(response.toString(), sendValue.toString())
        })
        it("Adds funder to array of getFunder", async function () {
          await fundMe.fund({ value: sendValue })
          const funder = await fundMe.getFunder(0)
          assert.equal(funder, deployer)
        })
      })
      describe("withdraw", async function () {
        beforeEach(async function () {
          //adds funds to the conract before any test runs
          await fundMe.fund({ value: sendValue })
        })

        it("Withdraw ETH from a single funder", async function () {
          //arrange
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMeAddress
          )
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )
          //act
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          //calculate gas cost use debbuger break on this line
          const { gasUsed, gasPrice } = transactionReceipt
          const gasCost = gasUsed * gasPrice

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMeAddress
          )
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )

          //assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          )
        })
        it("allows us to withdraw with multiple getFunder", async () => {
          const accounts = await ethers.getSigners()
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: sendValue })
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          )
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )
          // Act
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, gasPrice } = transactionReceipt
          const gasCost = gasUsed * gasPrice
          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          )
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )
          // Assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance + startingDeployerBalance,
            endingDeployerBalance + gasCost
          )
          // Make sure that the getFunder are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted
          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            )
          }
        })

        //check the only owner modifer
        it("Only allows the owner to withdraw", async () => {
          const accounts = await ethers.getSigners()
          const attacker = accounts[1]
          const attackerConnectedContract = await fundMe.connect(attacker)
          await expect(
            attackerConnectedContract.withdraw()
          ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
        })

        //gas optimized withdraw
        it("Withdraw ETH from a single funder", async function () {
          //arrange
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMeAddress
          )
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )
          //act
          const transactionResponse = await fundMe.cheaperWithdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          //calculate gas cost use debbuger break on this line
          const { gasUsed, gasPrice } = transactionReceipt
          const gasCost = gasUsed * gasPrice

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMeAddress
          )
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )

          //assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          )
        })

        it("Gas optimized cheaperWithdraw()", async () => {
          const accounts = await ethers.getSigners()
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: sendValue })
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          )
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )
          // Act
          const transactionResponse = await fundMe.cheaperWithdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, gasPrice } = transactionReceipt
          const gasCost = gasUsed * gasPrice
          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          )
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )
          // Assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance + startingDeployerBalance,
            endingDeployerBalance + gasCost
          )
          // Make sure that the getFunder are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted
          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            )
          }
        })
      })
    })
