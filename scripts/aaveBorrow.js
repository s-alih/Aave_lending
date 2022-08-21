const { ethers, getNamedAccounts } = require("hardhat")
const { getWeth, AMOUNT } = require("./getWeth")
async function main() {
    /// protocol

    await getWeth()

    const { deployer } = await getNamedAccounts()

    const lendingPool = await getLendingPool(deployer)
    console.log("lending Pool address", lendingPool.address)

    // weith token address
    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    // approve
    await approveERC20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)
    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
    console.log("deposited")

    /// borrow time

    const { totalDebtETH, availableBorrowsETH } = await borrowUserData(lendingPool, deployer)

    const daiPrice = await getDaiPriceData()

    const amountofDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber())

    console.log("you can borrow: ", amountofDaiToBorrow)

    const amountofDai = ethers.utils.parseEther(amountofDaiToBorrow.toString())
    const daiAddress = "0x6b175474e89094c44da98b954eedeac495271d0f"
    await borrowDai(daiAddress, lendingPool, amountofDai, deployer)

    await borrowUserData(lendingPool, deployer)

    await repay(amountofDai, daiAddress, lendingPool, deployer)
    await borrowUserData(lendingPool, deployer)
}

async function borrowUserData(lendingPoll, account) {
    const {
        totalCollateralETH,
        totalDebtETH,
        availableBorrowsETH
    } = await lendingPoll.getUserAccountData(account)

    console.log("Total collateral: ", totalCollateralETH.toString())
    console.log("total Borrow: ", totalDebtETH.toString())
    console.log("avaiable to borrow: ", availableBorrowsETH.toString())
    return { totalDebtETH, availableBorrowsETH }
}

async function getDaiPriceData() {
    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        "0x773616E4d11A78F511299002da57A0a94577F1f4"
    )

    const price = (await daiEthPriceFeed.latestRoundData())[1]

    console.log("Dai price will be:  ", price.toString())
    return price
}

async function borrowDai(daiAddress, lendingPoolAdress, amountofDaiToBorrow, account) {
    const borrowTx = await lendingPoolAdress.borrow(daiAddress, amountofDaiToBorrow, 1, 0, account)
    await borrowTx.wait(1)
    console.log("you borrowed")
}

async function getLendingPool(account) {
    const lendingPoolProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        account
    )
    const lendingPoolAdress = await lendingPoolProvider.getLendingPool()

    const lendingPoll = await ethers.getContractAt("ILendingPool", lendingPoolAdress, account)
    return lendingPoll
}

async function approveERC20(erc20Address, spenderAddress, amountToSpend, account) {
    const erc20Token = await ethers.getContractAt("IERC20", erc20Address, account)
    const tx = await erc20Token.approve(spenderAddress, amountToSpend)
    await tx.wait(1)
    console.log("Approved")
}

async function repay(amount, daiAddress, lendingPoll, account) {
    await approveERC20(daiAddress, lendingPoll.address, amount, account)
    const repayTx = await lendingPoll.repay(daiAddress, amount, 1, account)
    await repayTx.wait(1)

    console.log("Repaid")
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
