import { ethers } from 'hardhat'

async function main() {
    try {
        const [developer] = await ethers.getSigners();
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const unlockTime = currentTimestamp + 60;
        const lockedAmount = ethers.parseEther("0.01");
        const LockContract = await ethers.getContractFactory("Lock");
        const utils = await LockContract.deploy(unlockTime, {
            value: lockedAmount,
        });
        await utils.waitForDeployment();
        const deployedAddress = await utils.getAddress();

        console.log("Network:", (await ethers.provider.getNetwork()).name);
        console.log("Deployer:", developer.address);
        console.log("Lock contract deployed to:", deployedAddress);

    }
    catch (error) {
        console.error(error);
        process.exitCode = 1;
    }
}
main();