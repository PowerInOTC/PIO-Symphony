// 1 fetch each second all events
// Put them in the qeueu
// process each

/** PionerV1Open
openQuoteEvent( uint256 indexed bContractId); 
    * getContract(bContractId) -> db
openQuoteSignedEvent( uint256 indexed bContractId,bytes indexed fillAPIEventId); 
    * getContract(bContractId) -> db
cancelSignedMessageOpenEvent(address indexed sender, bytes indexed messageHash);
    * cancelSignedMessageOpenManager()
acceptQuoteEvent( uint256 indexed bContractId); 
    * getContract(bContractId) -> db
cancelOpenQuoteEvent( uint256 indexed bContractId);
    * getContract(bContractId) -> db
    * cancelOpenQuoteManage()

* PionerV1Default
settledEvent(uint256 bContractId);
    * getContract(bContractId) -> db
liquidatedEvent(uint256 bContractId);
    * getContract(bContractId) -> db

* PionerV1Close
openCloseQuoteEvent( uint256 indexed bCloseQuoteId);
    * getCloseQuote(bCloseQuoteId) -> db
acceptCloseQuoteEvent( uint256 indexed bCloseQuoteId);
    * getCloseQuote(bCloseQuoteId) -> db
expirateBContractEvent(uint256 indexed bContractId);
    * getContract(bContractId) -> db
closeMarketEvent( uint256 indexed bCloseQuoteId);
    * getCloseQuote(bCloseQuoteId) -> db
cancelOpenCloseQuoteContractEvent(uint256 indexed bContractId);
    * getCloseQuote(bCloseQuoteId) -> db
    * cancelOpenCloseQuoteContractManager
cancelSignedMessageCloseEvent(address indexed sender, bytes indexed messageHash);
    * cancelSignedMessageCloseManager()

* pionerV1Compliance
    * DepositEvent(address indexed user, uint256 amount);
    * InitiateWithdrawEvent(address indexed user, uint256 amount);
    * WithdrawEvent(address indexed user, uint256 amount);
    * CancelWithdrawEvent(address indexed user, uint256 amount);

pionerV1Oracle
deployBContract(uint256 indexed bOracleId);
    * getOracle(bOracleId) -> db

*/

import { Job } from 'bullmq';

export const processEther = async (job: Job) => {
  try {
    const etherData = job.data;
    console.log(`Processing Ether: ${JSON.stringify(etherData)}`);
    // Simulating Ether processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log(`Ether processed successfully: ${JSON.stringify(etherData)}`);
  } catch (error) {
    console.error('Error processing Ether:', error);
  }
};
