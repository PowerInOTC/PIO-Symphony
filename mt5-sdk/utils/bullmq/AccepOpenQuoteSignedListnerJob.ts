/*
### Accept Signed Quote Warper
for active OpenQuoteSigned
if (
    verifySelfMaxAcountLeverage(),
    && verifyCounterpartyMaxAccountLeverage(),
    && verifySelfBalance(), // onchain and broker
    && verifyParameters(quoteSigned, config.js),
    && verifyPrice(acceptPrice, brokerPrice, OraclePrice)
    ):
        verifySignQuoteParameters:
        this.warperOpenQuoteDeployOracleAndAcceptQuoteMM():

// Answer RFQ
    config file + price + selfLeverageOnchain + selfLeverageBroker

// Store and verify signed quote.
*/
