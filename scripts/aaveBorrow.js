const { ethers, getNamedAccounts } = require("hardhat")
const { getWeth } = require("./getWeth")
async function main() {
    /// protocol

    await getWeth()

    const { deployer } = await getNamedAccounts()

    const lendingPool = await getLendingPool(deployer)
    console.log("lending Pool address", lendingPool.address)
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

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
